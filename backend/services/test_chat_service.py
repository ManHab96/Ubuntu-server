# backend/services/test_chat_service.py

import re
import json
import uuid
from datetime import datetime
from pydantic import BaseModel

from routes.whatsapp import generate_ai_response
from services.ai_service import handle_ai_action


class WhatsAppTestChat(BaseModel):
    agency_id: str
    message: str
    conversation_id: str | None = None


def extract_json_from_ai(text: str):
    if not text:
        return None

    cleaned = re.sub(r"```json|```", "", text).strip()
    match = re.search(r"\{[\s\S]*\}", cleaned)

    if not match:
        return None

    try:
        return json.loads(match.group())
    except Exception:
        return None


async def process_test_chat_message(
    *,
    agency_id: str,
    conversation_id: str,
    message: str
):
    ai_response = await generate_ai_response(
        agency_id=agency_id,
        conversation_id=conversation_id,
        user_message=message
    )

    action_payload = extract_json_from_ai(ai_response)

    if action_payload and action_payload.get("action"):
        action_result = await handle_ai_action(action_payload)
        return action_result["message"]

    return ai_response
