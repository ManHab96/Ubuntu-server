# backend/services/conversation_state_service.py

from datetime import datetime
from typing import Dict


# ⚠️ Estado en memoria (por ahora)
# Luego lo pasamos a DB sin cambiar interfaces
_CONVERSATION_STATES: Dict[str, dict] = {}


async def get_or_create_conversation_state(conversation_id: str) -> dict:
    """
    Obtiene el estado actual de la conversación o lo crea si no existe.
    """
    if conversation_id not in _CONVERSATION_STATES:
        _CONVERSATION_STATES[conversation_id] = {
            "conversation_id": conversation_id,
            "step": "start",
            "data": {},
            "updated_at": datetime.utcnow()
        }

    return _CONVERSATION_STATES[conversation_id]


async def update_conversation_state(
    conversation_id: str,
    step: str | None = None,
    data: dict | None = None
) -> dict:
    """
    Actualiza el estado de la conversación.
    """
    state = await get_or_create_conversation_state(conversation_id)

    if step:
        state["step"] = step

    if data:
        state["data"].update(data)

    state["updated_at"] = datetime.utcnow()

    return state


async def reset_conversation_state(conversation_id: str) -> None:
    """
    Reinicia el estado de la conversación.
    """
    if conversation_id in _CONVERSATION_STATES:
        del _CONVERSATION_STATES[conversation_id]
