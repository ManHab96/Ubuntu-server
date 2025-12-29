from fastapi import APIRouter, HTTPException, Depends, Request, Query
from database import (
    system_config_collection, conversations_collection, messages_collection,
    customers_collection, cars_collection, promotions_collection, agencies_collection,
    appointments_collection
)
from auth import get_current_user
import httpx
import uuid
from datetime import datetime
from openai import AsyncOpenAI
import os

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

# WhatsApp webhook verification (GET)
@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_challenge: str = Query(alias="hub.challenge"),
    hub_verify_token: str = Query(alias="hub.verify_token")
):
    # This should match the verify token configured in system config
    # For now, we'll accept any token and verify later per agency
    return int(hub_challenge)

# WhatsApp webhook receiver (POST)
@router.post("/webhook")
async def receive_whatsapp_message(request: Request):
    try:
        data = await request.json()
        
        # Extract message data from WhatsApp Cloud API format
        if "entry" not in data:
            return {"status": "ok"}
        
        for entry in data["entry"]:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                messages = value.get("messages", [])
                
                for message in messages:
                    # Extract message details
                    from_phone = message.get("from")
                    message_text = message.get("text", {}).get("body", "")
                    message_id = message.get("id")
                    
                    if not from_phone or not message_text:
                        continue
                    
                    # Find agency by phone number (you'll need to match this)
                    # For now, use first active agency
                    agency = await agencies_collection.find_one({"is_active": True})
                    if not agency:
                        continue
                    
                    agency_id = agency["id"]
                    
                    # Process message
                    await process_incoming_message(agency_id, from_phone, message_text, message_id)
        
        return {"status": "ok"}
    
    except Exception as e:
        print(f"Error processing webhook: {e}")
        return {"status": "error", "message": str(e)}

async def process_incoming_message(agency_id: str, from_phone: str, message_text: str, message_id: str):
    # Get or create customer
    customer = await customers_collection.find_one({"phone": from_phone, "agency_id": agency_id})
    if not customer:
        customer_id = str(uuid.uuid4())
        customer = {
            "id": customer_id,
            "agency_id": agency_id,
            "name": from_phone,
            "phone": from_phone,
            "source": "organic",
            "created_at": datetime.utcnow()
        }
        await customers_collection.insert_one(customer)
    else:
        customer_id = customer["id"]
    
    # Get or create conversation
    conversation = await conversations_collection.find_one({
        "agency_id": agency_id,
        "customer_id": customer_id
    })
    
    if not conversation:
        conversation_id = str(uuid.uuid4())
        conversation = {
            "id": conversation_id,
            "agency_id": agency_id,
            "customer_id": customer_id,
            "whatsapp_phone": from_phone,
            "last_message": message_text,
            "last_message_at": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
        await conversations_collection.insert_one(conversation)
    else:
        conversation_id = conversation["id"]
        await conversations_collection.update_one(
            {"id": conversation_id},
            {"$set": {"last_message": message_text, "last_message_at": datetime.utcnow()}}
        )
    
    # Save incoming message
    incoming_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "from_customer": True,
        "message_text": message_text,
        "timestamp": datetime.utcnow()
    }
    await messages_collection.insert_one(incoming_msg)
    
    # Generate AI response
    response_text = await generate_ai_response(agency_id, conversation_id, message_text)
    
    # Save outgoing message
    outgoing_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "from_customer": False,
        "message_text": response_text,
        "timestamp": datetime.utcnow()
    }
    await messages_collection.insert_one(outgoing_msg)
    
    # Send response via WhatsApp
    await send_whatsapp_message(agency_id, from_phone, response_text)

async def generate_ai_response(agency_id: str, conversation_id: str, user_message: str) -> str:
    try:
        # Get system config
        config = await system_config_collection.find_one({"agency_id": agency_id})
        if not config:
            return "Lo siento, no puedo procesar tu mensaje en este momento."
        
        # Get AI system prompt
        system_prompt = config.get("ai_system_prompt", "Eres un asistente de ventas automotriz.")
        
        # Get conversation history
        conv_messages = await messages_collection.find(
            {"conversation_id": conversation_id},
            {"_id": 0}
        ).sort("timestamp", -1).limit(10).to_list(10)
        conv_messages.reverse()
        
        # Get available cars
        cars = await cars_collection.find(
            {"agency_id": agency_id, "is_available": True},
            {"_id": 0}
        ).to_list(100)
        
        # Get active promotions
        now = datetime.utcnow()
        promotions = await promotions_collection.find({
            "agency_id": agency_id,
            "is_active": True,
            "start_date": {"$lte": now},
            "end_date": {"$gte": now}
        }, {"_id": 0}).to_list(100)
        
        # Get agency info
        agency = await agencies_collection.find_one({"id": agency_id}, {"_id": 0})
        
        # Build context for system message
        context = f"""{system_prompt}

Información de la agencia:
Nombre: {agency.get('name', '')}
Dirección: {agency.get('address', '')}
Teléfono: {agency.get('phone', '')}
Horarios: {agency.get('business_hours', '')}

Autos disponibles:
"""
        
        for car in cars[:10]:  # Limit to first 10 cars
            context += f"\n- {car.get('brand', '')} {car.get('model', '')} {car.get('year', '')}"
            if car.get('price'):
                context += f" - ${car['price']:,.2f}"
            if car.get('description'):
                context += f" ({car['description']})"
        
        if promotions:
            context += "\n\nPromociones activas:\n"
            for promo in promotions:
                context += f"\n- {promo['title']}: {promo['description']}"
        
        context += "\n\nInstrucciones: Responde de forma profesional, clara y orientando al cliente a agendar una cita."
        
        # Get API key (use EMERGENT_LLM_KEY)
        api_key = config.get("gemini_api_key") or os.environ.get('EMERGENT_LLM_KEY')
        
        # Si el usuario configuró EMERGENT_LLM_KEY como string, usar la key del entorno
        if api_key == "EMERGENT_LLM_KEY":
            api_key = os.environ.get('EMERGENT_LLM_KEY')
        
        if not api_key:
            # If no API key, use smart fallback response
            return await generate_fallback_response(user_message, cars, promotions, agency)
        
        # Use OpenAI-compatible API with EMERGENT_LLM_KEY
        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.emergent.sh/v1"
        )
        
        # Build message history for OpenAI format
        openai_messages = [{"role": "system", "content": context}]
        
        for msg in conv_messages[-5:]:  # Last 5 messages
            role = "user" if msg.get('from_customer') else "assistant"
            openai_messages.append({
                "role": role,
                "content": msg.get('message_text', '')
            })
        
        # Add current user message
        openai_messages.append({"role": "user", "content": user_message})
        
        # Call OpenAI-compatible API with timeout
        response = await asyncio.wait_for(
            client.chat.completions.create(
                model="gpt-4o-mini",
                messages=openai_messages,
                max_tokens=500,
                temperature=0.7
            ),
            timeout=15.0
        )
            temperature=0.7
        )
        
        return response.choices[0].message.content
    
    except Exception as e:
        print(f"Error generating AI response: {e}")
        return "Gracias por tu mensaje. Un asesor se comunicará contigo pronto."

async def send_whatsapp_message(agency_id: str, to_phone: str, message: str):
    try:
        config = await system_config_collection.find_one({"agency_id": agency_id})
        if not config:
            return
        
        access_token = config.get("whatsapp_access_token")
        phone_number_id = config.get("whatsapp_phone_number_id")
        
        if not access_token or not phone_number_id:
            print("WhatsApp credentials not configured")
            return
        
        url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        data = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "text",
            "text": {"body": message}
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=data)
            if response.status_code != 200:
                print(f"Error sending WhatsApp message: {response.text}")
    
    except Exception as e:
        print(f"Error sending WhatsApp message: {e}")

# Manual send message endpoint
@router.post("/send")
async def send_message(
    agency_id: str,
    to_phone: str,
    message: str,
    current_user: dict = Depends(get_current_user)
):
    await send_whatsapp_message(agency_id, to_phone, message)
    return {"status": "sent"}

# Test chat endpoint (without WhatsApp)
@router.post("/test-chat")
async def test_chat(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Test endpoint to chat with AI without WhatsApp
    """
    message = request.get("message")
    phone = request.get("phone", "+521234567890")
    agency_id = request.get("agency_id")
    
    if not message or not agency_id:
        raise HTTPException(status_code=400, detail="Message and agency_id are required")
    
    # Get or create test customer
    customer = await customers_collection.find_one({"phone": phone, "agency_id": agency_id})
    if not customer:
        customer_id = str(uuid.uuid4())
        customer = {
            "id": customer_id,
            "agency_id": agency_id,
            "name": "Usuario de Prueba",
            "phone": phone,
            "source": "organic",
            "created_at": datetime.utcnow()
        }
        await customers_collection.insert_one(customer)
    else:
        customer_id = customer["id"]
    
    # Get or create test conversation
    conversation = await conversations_collection.find_one({
        "agency_id": agency_id,
        "customer_id": customer_id
    })
    
    if not conversation:
        conversation_id = str(uuid.uuid4())
        conversation = {
            "id": conversation_id,
            "agency_id": agency_id,
            "customer_id": customer_id,
            "whatsapp_phone": phone,
            "last_message": message,
            "last_message_at": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
        await conversations_collection.insert_one(conversation)
    else:
        conversation_id = conversation["id"]
        await conversations_collection.update_one(
            {"id": conversation_id},
            {"$set": {"last_message": message, "last_message_at": datetime.utcnow()}}
        )
    
    # Save user message
    user_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "from_customer": True,
        "message_text": message,
        "timestamp": datetime.utcnow()
    }
    await messages_collection.insert_one(user_msg)
    
    # Generate AI response
    response_text = await generate_ai_response(agency_id, conversation_id, message)
    
    # Save AI response
    ai_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "from_customer": False,
        "message_text": response_text,
        "timestamp": datetime.utcnow()
    }
    await messages_collection.insert_one(ai_msg)
    
    return {
        "status": "success",
        "response": response_text,
        "conversation_id": conversation_id
    }
