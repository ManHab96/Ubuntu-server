# routes/test_chat.py

from fastapi import APIRouter
from pydantic import BaseModel
from services.chat_engine import handle_chat_message

router = APIRouter(prefix="/api/test-chat", tags=["test-chat"])

class TestChatPayload(BaseModel):
    agency_id: str
    message: str
    conversation_id: str | None = None

@router.post("")
async def test_chat(payload: TestChatPayload):
    response, conversation_id = await handle_chat_message(
        agency_id=payload.agency_id,
        customer_identifier=payload.conversation_id or "test-user",
        message_text=payload.message,
        is_test=True
    )

    return {
        "status": "success",
        "response": response,
        "conversation_id": conversation_id
    }
