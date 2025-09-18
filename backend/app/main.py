# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import importlib
import logging
import traceback
from pathlib import Path

log = logging.getLogger("uvicorn.error")

app = FastAPI(title="Dentist Web", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

def mount_router(modname: str) -> None:
    try:
        mod = importlib.import_module(modname)
    except Exception:
        log.error("❌ Import failed for %s\n%s", modname, traceback.format_exc())
        return

    r = getattr(mod, "router", None)
    if r is None:
        log.error("❌ %s imported but has no attribute 'router'", modname)
        return

    # Log what the router actually contains before mounting
    try:
        routes = getattr(r, "routes", [])
        log.info("🔎 %s exposes %d route(s)", modname, len(routes))
        for rt in routes:
            methods = getattr(rt, "methods", set())
            path = getattr(rt, "path", "?")
            include = getattr(rt, "include_in_schema", True)
            log.info("   ↳ %s %s (include_in_schema=%s)", "/".join(sorted(methods)), path, include)
    except Exception:
        log.warning("   (could not introspect routes for %s)", modname)

    try:
        app.include_router(r)
        log.info("✅ Mounted %s", modname)
    except Exception:
        log.error("❌ include_router failed for %s\n%s", modname, traceback.format_exc())

ROUTERS = [
    "routers.auth",
    "routers.assignments",
    "routers.assignment_types",
    "routers.departments",
    "routers.doctor",
    "routers.students",
    "routers.submissions",
    "routers.feedback",
    "routers.dashboard",
    "routers.student_management",
    "routers.student_profile",
    "routers.course_management",
    "routers.reports",
    "routers.announcements",
]

for r in ROUTERS:
    mount_router(r)

# Mount static files for uploads directory
uploads_path = Path("uploads")
uploads_path.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"ok": True, "service": "Dentist Web"}

# List all registered paths (useful to see what the app actually has)
@app.get("/_routes")
def _routes():
    return [{"path": rt.path, "name": rt.name} for rt in app.routes]
