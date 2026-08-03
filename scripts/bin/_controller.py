import json
import os
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
RUNTIME_DIR = ROOT / "artifacts" / "runtime"
LOG_DIR = RUNTIME_DIR / "logs"
WINDOWS = os.name == "nt"
CREATE_NEW_PROCESS_GROUP = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)

SERVICES = {
    "web": {
        "kind": "node",
        "command": ["npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
        "url": "http://127.0.0.1:5173",
        "label": "Vite web app",
    },
    "api": {
        "kind": "node",
        "command": ["npm", "run", "api:dev"],
        "url": "http://127.0.0.1:4000/api/health",
        "label": "API server",
        "env": {"PORT": "4000"},
    },
    "db": {
        "kind": "compose",
        "command": ["docker", "compose", "up", "-d", "postgres"],
        "stop_command": ["docker", "compose", "stop", "postgres"],
        "status_command": ["docker", "compose", "ps", "postgres"],
        "label": "Postgres container",
    },
}


def ensure_runtime_dirs() -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)


def npm_command() -> str:
    found = shutil.which("npm.cmd") or shutil.which("npm")
    if found:
        return found

    program_files = os.environ.get("ProgramFiles", r"C:\Program Files")
    fallback = Path(program_files) / "nodejs" / "npm.cmd"
    if fallback.exists():
        return str(fallback)

    raise RuntimeError("npm was not found. Install Node.js or add npm to PATH.")


def docker_command() -> str:
    found = shutil.which("docker")
    if found:
        return found

    fallback_paths = [
        Path(r"C:\Program Files\Docker\Docker\resources\bin\docker.exe"),
        Path(r"C:\ProgramData\DockerDesktop\version-bin\docker.exe"),
    ]
    for fallback in fallback_paths:
        if fallback.exists():
            return str(fallback)

    raise RuntimeError("docker was not found. Install Docker or add it to PATH.")


def docker_desktop_executable() -> Path | None:
    candidates = [
        Path(r"C:\Program Files\Docker\Docker\Docker Desktop.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def has_docker() -> bool:
    try:
        docker_command()
        return True
    except RuntimeError:
        return False


def docker_daemon_available() -> tuple[bool, str]:
    if not has_docker():
        return False, "docker CLI is not available"

    result = subprocess.run(
        [docker_command(), "info", "--format", "{{.ServerVersion}}"],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode == 0:
        return True, result.stdout.strip() or "docker daemon is available"

    message = (result.stderr or result.stdout).strip() or "docker daemon is not running"
    return False, message


def ensure_docker_daemon(autostart: bool) -> tuple[bool, str]:
    available, detail = docker_daemon_available()
    if available:
        return True, detail

    if not autostart or not WINDOWS:
        return False, detail

    desktop = docker_desktop_executable()
    if not desktop:
        return False, detail

    try:
        subprocess.Popen([str(desktop)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        return False, detail

    deadline = time.time() + 60
    while time.time() < deadline:
        available, daemon_detail = docker_daemon_available()
        if available:
            return True, daemon_detail
        time.sleep(2)

    return False, detail


def resolve_command(command: list[str]) -> list[str]:
    resolved = list(command)
    if resolved and resolved[0] == "npm":
        resolved[0] = npm_command()
    if resolved and resolved[0] == "docker":
        resolved[0] = docker_command()
    return resolved


def state_for(service: str) -> Path:
    return RUNTIME_DIR / f"{service}.json"


def log_for(service: str) -> Path:
    return LOG_DIR / f"{service}.log"


def load_state(service: str) -> dict[str, object]:
    path = state_for(service)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_state(service: str, state: dict[str, object]) -> None:
    ensure_runtime_dirs()
    state_for(service).write_text(json.dumps(state, indent=2), encoding="utf-8")


def clear_state(service: str) -> None:
    path = state_for(service)
    if path.exists():
        path.unlink()


def read_pid(service: str) -> int | None:
    state = load_state(service)
    pid = state.get("pid")
    return pid if isinstance(pid, int) else None


def is_process_running(pid: int) -> bool:
    if pid <= 0:
        return False

    if WINDOWS:
        result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}"],
            capture_output=True,
            text=True,
            check=False,
        )
        return str(pid) in result.stdout

    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def wait_for_http(url: str, timeout_seconds: int) -> bool:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urlopen(url, timeout=2):
                return True
        except URLError:
            time.sleep(0.5)
        except Exception:
            time.sleep(0.5)
    return False


def start_node_service(service: str, timeout_seconds: int) -> None:
    service_cfg = SERVICES[service]
    existing_pid = read_pid(service)
    if existing_pid and is_process_running(existing_pid):
        print(f"{service}: already running (pid {existing_pid})")
        print(f"{service}: {service_cfg['url']}")
        return

    ensure_runtime_dirs()
    log_file = log_for(service)
    env = os.environ.copy()
    env.update(service_cfg.get("env", {}))

    print(f"{service}: starting...", flush=True)

    with log_file.open("a", encoding="utf-8") as log_handle:
        process = subprocess.Popen(
            resolve_command(service_cfg["command"]),
            cwd=str(ROOT),
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            stdin=subprocess.DEVNULL,
            env=env,
            creationflags=CREATE_NEW_PROCESS_GROUP if WINDOWS else 0,
            start_new_session=not WINDOWS,
        )

    save_state(service, {
        "pid": process.pid,
        "started_at": time.time(),
        "log": str(log_file),
        "url": service_cfg["url"],
    })

    if wait_for_http(service_cfg["url"], timeout_seconds):
        print(f"{service}: started at {service_cfg['url']} (pid {process.pid})")
        return

    if not is_process_running(process.pid):
        clear_state(service)
        raise RuntimeError(f"{service}: exited before becoming reachable. See {log_file}")

    print(f"{service}: started, but readiness check timed out. See {log_file}")


def stop_node_service(service: str) -> None:
    pid = read_pid(service)
    log_file = log_for(service)
    if not pid or not is_process_running(pid):
        clear_state(service)
        print(f"{service}: not running")
        return

    print(f"{service}: stopping...", flush=True)

    if WINDOWS:
        subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], check=False)
    else:
        try:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
        except ProcessLookupError:
            pass

    for _ in range(20):
        if not is_process_running(pid):
            break
        time.sleep(0.25)

    if is_process_running(pid):
        if WINDOWS:
            subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], check=False)
        else:
            try:
                os.killpg(os.getpgid(pid), signal.SIGKILL)
            except ProcessLookupError:
                pass

    clear_state(service)
    print(f"{service}: stopped (last pid {pid})")
    print(f"{service}: log {log_file}")


def status_node_service(service: str) -> None:
    service_cfg = SERVICES[service]
    pid = read_pid(service)
    running = bool(pid and is_process_running(pid))
    reachable = False
    if running:
        reachable = wait_for_http(service_cfg["url"], timeout_seconds=2)

    state = "running" if running else "stopped"
    if running and reachable:
        state = "running and reachable"
    elif running:
        state = "running but not yet reachable"

    print(f"{service}: checking status...", flush=True)
    print(f"{service}: {state}")
    if pid:
        print(f"{service}: pid {pid}")
    print(f"{service}: url {service_cfg['url']}")
    print(f"{service}: log {log_for(service)}")


def start_db() -> None:
    service_cfg = SERVICES["db"]
    if not has_docker():
        print("db: skipped (docker not available)")
        return

    daemon_ok, daemon_detail = ensure_docker_daemon(autostart=True)
    if not daemon_ok:
        raise RuntimeError(
            f"docker daemon is not running. Start Docker Desktop and retry. Details: {daemon_detail}"
        )

    print("db: starting...", flush=True)
    result = subprocess.run(
        resolve_command(service_cfg["command"]),
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raw_error = result.stderr.strip() or result.stdout.strip() or "Failed to start database."
        if "Docker Desktop is unable to start" in raw_error:
            raise RuntimeError(
                "Docker Desktop is installed but not running correctly. Open Docker Desktop manually, wait until Engine is running, then retry `python scripts/bin/start.py db`."
            )
        raise RuntimeError(raw_error)
    print("db: started")


def stop_db() -> None:
    service_cfg = SERVICES["db"]
    if not has_docker():
        print("db: skipped (docker not available)")
        return

    daemon_ok, daemon_detail = ensure_docker_daemon(autostart=False)
    if not daemon_ok:
        print("db: stopped (docker daemon not running)")
        print(daemon_detail)
        return

    print("db: stopping...", flush=True)
    result = subprocess.run(
        resolve_command(service_cfg["stop_command"]),
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "Failed to stop database.")
    print("db: stopped")


def status_db() -> None:
    service_cfg = SERVICES["db"]
    if not has_docker():
        print("db: unavailable (docker not available)")
        print("db: log not available")
        return

    daemon_ok, daemon_detail = ensure_docker_daemon(autostart=False)
    if not daemon_ok:
        print("db: stopped (docker daemon not running)")
        print(daemon_detail)
        return

    print("db: checking status...", flush=True)
    result = subprocess.run(
        resolve_command(service_cfg["status_command"] + ["--format", "json"]),
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    output = (result.stdout or "").strip()
    error_output = (result.stderr or "").strip()
    if result.returncode != 0:
        print("db: stopped")
        print(error_output or output or "Unable to retrieve db status")
        return

    running = bool(output)
    print(f"db: {'running' if running else 'stopped'}")
    print(output or "db: no status output")


def normalize_services(values: list[str]) -> list[str]:
    if not values:
        return ["all"]
    if len(values) == 1 and values[0] == "all":
        return ["all"]
    unknown = [value for value in values if value not in SERVICES]
    if unknown:
        raise RuntimeError(f"Unknown service(s): {', '.join(unknown)}")
    return values


def selected_services(values: list[str]) -> list[str]:
    if values == ["all"]:
        return ["web", "api", "db"]
    return values


def run_action(action: str, services: list[str]) -> None:
    targets = selected_services(services)
    for service in targets:
        print(f"{service}: {action}", flush=True)
        if action == "start":
            if SERVICES[service]["kind"] == "node":
                start_node_service(service, timeout_seconds=35)
            else:
                start_db()
        elif action == "stop":
            if SERVICES[service]["kind"] == "node":
                stop_node_service(service)
            else:
                stop_db()
        elif action == "restart":
            if SERVICES[service]["kind"] == "node":
                stop_node_service(service)
                start_node_service(service, timeout_seconds=35)
            else:
                stop_db()
                start_db()
        elif action == "status":
            if SERVICES[service]["kind"] == "node":
                status_node_service(service)
            else:
                status_db()
        else:
            raise RuntimeError(f"Unknown action: {action}")


def main(default_action: str | None = None, argv: list[str] | None = None) -> int:
    try:
        if default_action is None:
            import argparse

            parser = argparse.ArgumentParser(description="Start, stop, restart, and check status of individual crablearn scripts.")
            parser.add_argument("action", choices=["start", "stop", "restart", "status"], help="Action to perform")
            parser.add_argument("services", nargs="*", help="Services to manage: web, api, db, or all")
            args = parser.parse_args(argv)
            services = normalize_services(args.services)
            run_action(args.action, services)
            return 0

        arguments = list(argv or [])
        action = default_action
        if arguments and arguments[0] in {"start", "stop", "restart", "status"}:
            action = arguments.pop(0)

        if not arguments:
            arguments = ["web", "api"]

        services = normalize_services(arguments)
        run_action(action, services)
        return 0
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr, flush=True)
        return 1
