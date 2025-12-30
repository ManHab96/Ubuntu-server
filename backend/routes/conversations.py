from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import Conversation, Message
from database import conversations_collection, messages_collection
from auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

@router.get("/", response_model=List[Conversation])
async def get_conversations(agency_id: str = None, customer_id: str = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if agency_id:
        query["agency_id"] = agency_id
    if customer_id:
        query["customer_id"] = customer_id
    
    conversations = await conversations_collection.find(query, {"_id": 0}).sort("last_message_at", -1).to_list(1000)
    return [Conversation(**conv) for conv in conversations]

@router.get("/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    conversation = await conversations_collection.find_one({"id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return Conversation(**conversation)

@router.get("/{conversation_id}/messages", response_model=List[Message])
async def get_conversation_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    messages = await messages_collection.find({"conversation_id": conversation_id}, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    return [Message(**msg) for msg in messages]

# Additional endpoint to get messages directly
@router.get("/")
async def get_messages_by_conversation(conversation_id: str = None, current_user: dict = Depends(get_current_user)):
    if not conversation_id:
        return []
    messages = await messages_collection.find({"conversation_id": conversation_id}, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    return [Message(**msg) for msg in messages]
