from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import items
from settings import settings

app = FastAPI(title="오늘 — bmad-tutorial backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_allow_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router)
