#!/usr/bin/env python3

import argparse
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _controller import main


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="stop.py",
        description="Stop the web and api services by default. Add db explicitly when needed.",
    )
    parser.add_argument("args", nargs="*", help="Optional action and services: start|stop|restart|status plus web|api|db|all")
    parsed = parser.parse_args()
    raise SystemExit(main("stop", parsed.args))
