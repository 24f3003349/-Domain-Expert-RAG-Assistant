"""Message schemas."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models.message import MessageRole


class MessageBase(BaseModel):
    """Base message schema."""
    content: str = Field(..., description="Message content")


class MessageCreate(MessageBase):
    """Message creation schema."""
    pass


class MessageUpdate(BaseModel):
    """Message update schema."""
    content: Optional[str] = None


class MessageResponse(MessageBase):
    """Message response schema."""
    id: UUID
    chat_id: UUID
    role: MessageRole
    created_at: datetime
    citations: Optional[Any] = None
    thinking: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    @classmethod
    def extract_metadata(cls, data: Any) -> Any:
        citations = getattr(data, "citations", None) if not isinstance(data, dict) else data.get("citations")
        content = getattr(data, "content", "") if not isinstance(data, dict) else data.get("content", "")

        extracted_thinking = None
        extracted_sources = None

        if isinstance(citations, dict):
            extracted_thinking = citations.get("thinking")
            extracted_sources = citations.get("sources")

        # Fallback for legacy messages where thinking process was concatenated into content
        if not extracted_thinking and isinstance(content, str) and "*Thinking Process:*" in content:
            parts = content.split("\n\n---\n\n")
            if len(parts) > 1:
                raw_thinking = parts[0].replace("> *Thinking Process:*", "").strip()
                extracted_thinking = "\n".join(l.lstrip("> ").rstrip() for l in raw_thinking.splitlines())
                clean_content = "\n\n---\n\n".join(parts[1:]).strip()
                if isinstance(data, dict):
                    data["content"] = clean_content
                else:
                    try:
                        setattr(data, "content", clean_content)
                    except Exception:
                        pass

        if isinstance(data, dict):
            if extracted_thinking and not data.get("thinking"):
                data["thinking"] = extracted_thinking
            if extracted_sources and not data.get("sources"):
                data["sources"] = extracted_sources
        else:
            try:
                if extracted_thinking and not hasattr(data, "thinking"):
                    setattr(data, "thinking", extracted_thinking)
                if extracted_sources and not hasattr(data, "sources"):
                    setattr(data, "sources", extracted_sources)
            except Exception:
                pass

        return data


class MessageWithChat(MessageResponse):
    """Message response with chat included."""
    chat: "ChatResponse" = {}


# Import at the end to avoid circular imports
from app.schemas.chat import ChatResponse
