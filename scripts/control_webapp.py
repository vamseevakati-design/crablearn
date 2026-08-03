from pathlib import Path
import runpy


if __name__ == "__main__":
    start_script = Path(__file__).resolve().parent / "bin" / "start"
    runpy.run_path(str(start_script), run_name="__main__")
