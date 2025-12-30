from fastapi import APIRouter, HTTPException, Depends, Request, Query
from database import (
    system_config_collection, conversations_collection, messages_collection,
    customers_collection, cars_collection, promotions_collection, agencies_collection,
    appointments_collection
)
from auth import get_current_user
import httpx
import uuid
import asyncio
from datetime import datetime
import os

# Import emergentintegrations for LLM
from emergentintegrations.llm.chat import LlmChat, UserMessage

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

# Default verify token (can be overridden by agency config)
DEFAULT_VERIFY_TOKEN = "Ventas123"

# WhatsApp webhook verification (GET)
@router.get("/webhook")
async def verify_webhook(
    request: Request,
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    """
    Meta sends a GET request to verify the webhook.
    We must return the hub.challenge value as plain text.
    """
    from fastapi.responses import PlainTextResponse
    
    # Log the verification attempt
    print(f"Webhook verification attempt: mode={hub_mode}, token={hub_verify_token}, challenge={hub_challenge}")
    
    # Check if this is a verification request
    if hub_mode == "subscribe" and hub_challenge:
        # Validate the verify token
        if hub_verify_token == DEFAULT_VERIFY_TOKEN:
            print(f"Webhook verified successfully with token: {hub_verify_token}")
            return PlainTextResponse(content=hub_challenge, status_code=200)
        else:
            print(f"Invalid verify token: {hub_verify_token}, expected: {DEFAULT_VERIFY_TOKEN}")
            return PlainTextResponse(content="Invalid verify token", status_code=403)
    
    # If not a valid verification request
    return PlainTextResponse(content="Invalid request", status_code=400)

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


async def generate_fallback_response(user_message: str, cars: list, promotions: list, agency: dict) -> str:
    """Generate smart fallback responses based on keywords when AI is unavailable"""
    message_lower = user_message.lower()
    agency_name = agency.get('name', 'nuestra agencia') if agency else 'nuestra agencia'
    
    # Greetings
    if any(word in message_lower for word in ['hola', 'buenos', 'buenas', 'hi', 'hey']):
        return f"¡Hola! Bienvenido a {agency_name}. Soy el asistente virtual y estoy aquí para ayudarte. ¿Te gustaría conocer nuestros autos disponibles, promociones actuales, o agendar una cita?"
    
    # Car inquiries
    if any(word in message_lower for word in ['auto', 'autos', 'carro', 'carros', 'vehículo', 'vehiculo', 'disponible']):
        if cars:
            response = f"¡Tenemos excelentes opciones para ti! Actualmente contamos con {len(cars)} vehículos disponibles:\n\n"
            for car in cars[:5]:
                response += f"• {car.get('brand', '')} {car.get('model', '')} {car.get('year', '')}"
                if car.get('price'):
                    response += f" - ${car['price']:,.2f}"
                response += "\n"
            if len(cars) > 5:
                response += f"\n...y {len(cars) - 5} opciones más."
            response += "\n¿Te gustaría agendar una cita para ver alguno en persona?"
            return response
        return "Por el momento estamos actualizando nuestro inventario. ¿Te gustaría que un asesor se comunique contigo con la información más reciente?"
    
    # Promotions
    if any(word in message_lower for word in ['promoción', 'promocion', 'oferta', 'descuento', 'promociones']):
        if promotions:
            response = "¡Tenemos promociones especiales para ti!\n\n"
            for promo in promotions[:3]:
                response += f"🎉 {promo.get('title', '')}\n{promo.get('description', '')}\n\n"
            response += "¿Te interesa alguna? ¡Agenda una cita y aprovecha estos beneficios!"
            return response
        return "Actualmente no tenemos promociones activas, pero puedo ayudarte a encontrar el auto perfecto para ti. ¿Qué tipo de vehículo buscas?"
    
    # Appointment scheduling
    if any(word in message_lower for word in ['cita', 'agendar', 'visitar', 'visita', 'ver', 'conocer']):
        address = agency.get('address', '') if agency else ''
        hours = agency.get('business_hours', 'Lunes a Sábado 9:00 - 18:00') if agency else ''
        response = "¡Excelente! Me encantaría ayudarte a agendar una cita.\n\n"
        if address:
            response += f"📍 Estamos ubicados en: {address}\n"
        if hours:
            response += f"🕐 Horario: {hours}\n"
        response += "\n¿Qué día y hora te funcionaría mejor para visitarnos?"
        return response
    
    # Pricing
    if any(word in message_lower for word in ['precio', 'costo', 'cuanto', 'cuánto', 'vale', 'financiamiento']):
        return "Manejamos precios muy competitivos y contamos con opciones de financiamiento. Para darte información precisa, ¿podrías indicarme qué modelo te interesa? También puedo agendarte una cita con un asesor especializado."
    
    # Contact/Hours
    if any(word in message_lower for word in ['horario', 'hora', 'abierto', 'cerrado', 'ubicación', 'ubicacion', 'donde', 'dónde', 'dirección', 'direccion']):
        address = agency.get('address', 'Consulta con un asesor') if agency else ''
        phone = agency.get('phone', '') if agency else ''
        hours = agency.get('business_hours', 'Lunes a Sábado 9:00 - 18:00') if agency else ''
        response = f"¡Con gusto te comparto nuestra información!\n\n"
        if address:
            response += f"📍 Dirección: {address}\n"
        if phone:
            response += f"📞 Teléfono: {phone}\n"
        if hours:
            response += f"🕐 Horario: {hours}\n"
        response += "\n¿Te gustaría agendar una visita?"
        return response
    
    # Thanks
    if any(word in message_lower for word in ['gracias', 'thank', 'ok', 'vale', 'perfecto']):
        return "¡Con mucho gusto! Si tienes alguna otra pregunta o deseas agendar una cita, estoy aquí para ayudarte. 🚗"
    
    # Default response
    return f"Gracias por contactar a {agency_name}. Puedo ayudarte con:\n\n• Información de autos disponibles\n• Promociones actuales\n• Agendar una cita\n• Horarios y ubicación\n\n¿En qué puedo asistirte?"

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
        
        context += "\n\nInstrucciones: Responde de forma profesional, clara y orientando al cliente a agendar una cita. Responde en español."
        
        # Get API key from config
        # Priority: 1) User's own Google API key, 2) EMERGENT_LLM_KEY
        user_api_key = config.get("gemini_api_key", "")
        use_emergent_key = not user_api_key or user_api_key == "EMERGENT_LLM_KEY"
        
        if use_emergent_key:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
        else:
            api_key = user_api_key
        
        if not api_key:
            # If no API key, use smart fallback response
            return await generate_fallback_response(user_message, cars, promotions, agency)
        
        # Build conversation history text
        history_text = ""
        for msg in conv_messages[-5:]:
            role = "Cliente" if msg.get('from_customer') else "Asistente"
            history_text += f"{role}: {msg.get('message_text', '')}\n"
        
        # Full prompt with context and history
        full_prompt = f"{history_text}Cliente: {user_message}"
        
        # Initialize LlmChat with emergentintegrations
        chat = LlmChat(
            api_key=api_key,
            session_id=f"agency_{agency_id}_{conversation_id}",
            system_message=context
        )
        
        # Configure model based on key type
        if use_emergent_key:
            # Use Gemini with Emergent key
            chat.with_model("gemini", "gemini-2.5-flash")
        else:
            # User's own Google API key - use Gemini directly
            chat.with_model("gemini", "gemini-2.5-flash")
        
        # Create user message
        user_msg = UserMessage(text=full_prompt)
        
        # Send message and get response with timeout
        response = await asyncio.wait_for(
            chat.send_message(user_msg),
            timeout=30.0
        )
        
        return response
    
    except Exception as e:
        print(f"Error generating AI response: {e}")
        # Use fallback when AI fails
        try:
            cars = await cars_collection.find({"agency_id": agency_id, "is_available": True}, {"_id": 0}).to_list(100)
            agency = await agencies_collection.find_one({"id": agency_id}, {"_id": 0})
            promotions = await promotions_collection.find({"agency_id": agency_id, "is_active": True}, {"_id": 0}).to_list(100)
            return await generate_fallback_response(user_message, cars, promotions, agency)
        except:
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
