import uuid
import pytest

from app.crud.chat import chat as chat_crud
from app.crud.message import message as message_crud
from app.models.message import MessageRole


@pytest.mark.unit
class TestChatAndMessageCRUD:
    """Test chat and message CRUD operations."""

    async def test_create_and_get_chat(self, test_db_session, test_user):
        """Test creating a chat session and retrieving it."""
        chat = await chat_crud.create(
            test_db_session,
            obj_in={"title": "Test Intelligence Sync", "user_id": test_user.id}
        )
        assert chat is not None
        assert chat.title == "Test Intelligence Sync"
        assert chat.user_id == test_user.id

        # List user chats
        user_chats = await chat_crud.get_multi_by_user(test_db_session, user_id=test_user.id)
        assert len(user_chats) >= 1
        assert any(c.id == chat.id for c in user_chats)

    async def test_create_messages_in_chat(self, test_db_session, test_user):
        """Test adding user and assistant messages to a chat."""
        chat = await chat_crud.create(
            test_db_session,
            obj_in={"title": "Q&A Session", "user_id": test_user.id}
        )

        user_msg = await message_crud.create(
            test_db_session,
            obj_in={
                "chat_id": chat.id,
                "content": "What is causal inference?",
                "role": MessageRole.USER
            }
        )
        assert user_msg.id is not None
        assert user_msg.role == MessageRole.USER

        assistant_msg = await message_crud.create(
            test_db_session,
            obj_in={
                "chat_id": chat.id,
                "content": "Causal inference estimates cause-and-effect relationships.",
                "role": MessageRole.ASSISTANT
            }
        )
        assert assistant_msg.id is not None
        assert assistant_msg.role == MessageRole.ASSISTANT

        # Retrieve messages
        messages = await message_crud.get_multi_by_chat(test_db_session, chat_id=chat.id)
        assert len(messages) == 2
