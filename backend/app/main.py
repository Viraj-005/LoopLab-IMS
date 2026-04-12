"""
IMS Backend Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

from app.config import get_settings
from app.routes import (
    auth, 
    applications, 
    dashboard, 
    email_templates, 
    webhooks, 
    job_posts,
    intern_auth,
    intern_portal,
    cofounder,
    notifications,
    admin_interns,
    settings as system_settings
)
from app.database import init_db

settings = get_settings()

app = FastAPI(
    title="IMS API",
    description="Intern Application Management System API",
    version="1.0.0"
)

# CORS
origins = [
    settings.frontend_url,
    "http://localhost:5173",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api")
app.include_router(intern_auth.router, prefix="/api")
app.include_router(intern_portal.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(system_settings.router, prefix="/api")
app.include_router(cofounder.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(email_templates.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")
app.include_router(job_posts.router, prefix="/api")
app.include_router(admin_interns.router, prefix="/api")

# Static files for uploaded CVs
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

@app.on_event("startup")
async def on_startup():
    # In development, we can auto-create tables
    from app.database import init_db
    await init_db()

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": "reload-01"}

@app.get("/")
async def root():
    return {"message": "IMS API is running", "docs": "/docs"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
