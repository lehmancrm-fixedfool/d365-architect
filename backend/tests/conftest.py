"""
D365 Architect OS — Test configuration
Ensures dotenv is loaded before any app imports (mirrors main.py behaviour).
"""
import sys
from pathlib import Path

# Make sure the backend directory is on sys.path so imports work the same as main.py
BACKEND_DIR = Path(__file__).parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Load env BEFORE any app modules are imported
from dotenv import load_dotenv
_base = BACKEND_DIR
load_dotenv(_base / ".env")
load_dotenv(_base / ".env.local")
load_dotenv(_base.parent / ".env")        # AIProjects/.env fallback
load_dotenv(_base.parent / ".env.local")

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture(scope="session")
def client():
    """Shared synchronous test client for the whole session."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
