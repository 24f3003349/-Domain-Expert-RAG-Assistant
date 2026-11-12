"""Main FastAPI application."""

import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import redis.asyncio as redis
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_limiter import FastAPILimiter

from app.api.v1.api import api_router
from app.core.config import get_settings
from app.core.database import async_engine
from app.models import Base

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifespan."""
    # Note: Database migrations are managed via Alembic (alembic upgrade head)

    # Initialize rate limiter
    try:
        redis_instance = redis.from_url(
            settings.REDIS_URL, encoding="utf-8", decode_responses=True
        )
        await FastAPILimiter.init(redis_instance)
        logging.info("Rate limiter initialized successfully")
    except Exception as e:
        logging.warning(f"Failed to initialize rate limiter: {e}. Running without rate limits.")

    warmup_task = None
    if "pytest" not in sys.modules:
        async def _warmup() -> None:
            try:
                from app.services.rag_service import get_rag_service
                rag = await asyncio.to_thread(get_rag_service)
                await rag.embed_model.aget_query_embedding("warmup")
                await rag.llm.async_client.chat(
                    model=rag.llm.model,
                    messages=[{"role": "user", "content": "ok"}],
                    stream=False,
                    think=rag.llm.thinking,
                    keep_alive=rag.llm.keep_alive,
                    options={"num_ctx": rag.llm.context_window, "num_predict": 1, **rag.llm.additional_kwargs},
                )
                logging.info("RAG models warmed in VRAM/CPU")
            except Exception as e:
                logging.warning(f"RAG warmup skipped: {e}")
        warmup_task = asyncio.create_task(_warmup())

    yield

    if warmup_task and not warmup_task.done():
        warmup_task.cancel()
    # Cleanup
    await async_engine.dispose()


app = FastAPI(
    title="Domain Expert RAG Assistant API",
    description="Enterprise-grade RAG system for domain-specific document Q&A",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    msg = "; ".join(f"{err.get('loc', ['field'])[-1]}: {err.get('msg', 'invalid')}" for err in errors)
    return JSONResponse(status_code=422, content={"detail": msg, "errors": errors})


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {
        "message": "Welcome to Domain Expert RAG Assistant API",
        "version": "1.0.0",
        "docs": f"{settings.API_V1_STR}/docs",
    }


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )