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
import re
from datetime import datetime, timedelta
from dateutil import parser as date_parser
import os

# Import emergentintegrations for LLM
from emergentintegrations.llm.chat import LlmChat, UserMessage

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

# Default verify token (can be overridden by agency config)
DEFAULT_VERIFY_TOKEN = "Ventas123"

# Appointment detection patterns
APPOINTMENT_PATTERNS = [
    r'(?:el\s+)?(?:día\s+)?(\d{1,2})\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)',
    r'(?:el\s+)?(?:próximo\s+)?(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)',
    r'(?:a\s+las?\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:hrs?|horas?|am|pm)?',
    r'mañana|pasado\s+mañana|hoy',
]

DAYS_MAP = {
    'lunes': 0, 'martes': 1, 'miércoles': 2, 'miercoles': 2, 
    'jueves': 3, 'viernes': 4, 'sábado': 5, 'sabado': 5, 'domingo': 6
}

MONTHS_MAP = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
    'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
}

async def detect_and_create_appointment(agency_id: str, customer_id: str, user_message: str, conversation_id: str) -> dict:
    """
    Detect appointment intent and extract date/time from user message.
    Returns appointment info if created, None otherwise.
    """
    message_lower = user_message.lower()
    
    # Check if message contains appointment-related keywords
    appointment_keywords = ['cita', 'agendar', 'reservar', 'apartar', 'ir', 'visitar', 'voy', 'iré', 'ire', 'paso', 'llego']
    time_keywords = ['hora', 'mañana', 'tarde', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
    
    has_appointment_intent = any(kw in message_lower for kw in appointment_keywords)
    has_time_reference = any(kw in message_lower for kw in time_keywords) or re.search(r'\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs?)?', message_lower)
    
    if not (has_appointment_intent and has_time_reference):
        return None
    
    # Try to extract date and time
    appointment_date = None
    appointment_time = None
    now = datetime.utcnow()
    
    # Check for relative dates
    if 'mañana' in message_lower and 'pasado' not in message_lower:
        appointment_date = now + timedelta(days=1)
    elif 'pasado mañana' in message_lower:
        appointment_date = now + timedelta(days=2)
    elif 'hoy' in message_lower:
        appointment_date = now
    
    # Check for day names
    for day_name, day_num in DAYS_MAP.items():
        if day_name in message_lower:
            days_ahead = day_num - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            appointment_date = now + timedelta(days=days_ahead)
            break
    
    # Check for specific date (e.g., "15 de enero")
    date_match = re.search(r'(\d{1,2})\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)', message_lower)
    if date_match:
        day = int(date_match.group(1))
        month = MONTHS_MAP.get(date_match.group(2), now.month)
        year = now.year if month >= now.month else now.year + 1
        try:
            appointment_date = datetime(year, month, day)
        except ValueError:
            pass
    
    # Extract time
    time_match = re.search(r'(\d{1,2})(?::(\d{2}))?\s*(am|pm|hrs?|horas?)?', message_lower)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2)) if time_match.group(2) else 0
        period = time_match.group(3) or ''
        
        if 'pm' in period.lower() and hour < 12:
            hour += 12
        elif 'am' in period.lower() and hour == 12:
            hour = 0
        
        # Assume PM for business hours if no period specified
        if hour < 9 and not period:
            hour += 12
        
        appointment_time = f"{hour:02d}:{minute:02d}"
    
    # Default time if not specified
    if appointment_date and not appointment_time:
        appointment_time = "10:00"  # Default to 10 AM
    
    # If we have both date and time, create the appointment
    if appointment_date:
        try:
            # Combine date and time
            if appointment_time:
                hour, minute = map(int, appointment_time.split(':'))
                appointment_datetime = appointment_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            else:
                appointment_datetime = appointment_date.replace(hour=10, minute=0, second=0, microsecond=0)
            
            # Create appointment in database
            appointment_id = str(uuid.uuid4())
            appointment_data = {
                "id": appointment_id,
                "customer_id": customer_id,
                "agency_id": agency_id,
                "appointment_date": appointment_datetime,
                "status": "pending",
                "source": "whatsapp_ai",
                "notes": f"Cita agendada automáticamente por IA desde WhatsApp. Mensaje original: {user_message[:100]}",
                "created_at": datetime.utcnow()
            }
            
            await appointments_collection.insert_one(appointment_data)
            
            return {
                "created": True,
                "appointment_id": appointment_id,
                "date": appointment_datetime.strftime("%d/%m/%Y"),
                "time": appointment_datetime.strftime("%H:%M"),
                "datetime": appointment_datetime
            }
        except Exception as e:
            print(f"Error creating appointment: {e}")
            return None
    
    return None

# WhatsApp webhook verification (GET and HEAD)
@router.api_route("/webhook", methods=["GET", "HEAD"])
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
    from fastapi.responses import PlainTextResponse, Response
    
    # Log the verification attempt
    print(f"Webhook verification: method={request.method}, mode={hub_mode}, token={hub_verify_token}, challenge={hub_challenge}")
    
    # Handle HEAD request
    if request.method == "HEAD":
        return Response(status_code=200)
    
    # Check if this is a verification request
    if hub_mode == "subscribe" and hub_challenge:
        # Validate the verify token
        if hub_verify_token == DEFAULT_VERIFY_TOKEN:
            print(f"Webhook verified successfully with token: {hub_verify_token}")
            return PlainTextResponse(content=hub_challenge, status_code=200)
        else:
            print(f"Invalid verify token: {hub_verify_token}, expected: {DEFAULT_VERIFY_TOKEN}")
            return PlainTextResponse(content="Invalid verify token", status_code=403)
    
    # If no parameters, return OK (for health checks)
    if not hub_mode and not hub_challenge and not hub_verify_token:
        return PlainTextResponse(content="Webhook is active", status_code=200)
    
    # If not a valid verification request
    return PlainTextResponse(content="Invalid request", status_code=400)

# WhatsApp webhook receiver (POST)
@router.post("/webhook")
async def receive_whatsapp_message(request: Request):
    try:
        data = await request.json()
        print(f"📩 Webhook POST received: {data}")
        
        # Extract message data from WhatsApp Cloud API format
        if "entry" not in data:
            print("No 'entry' in webhook data")
            return {"status": "ok"}
        
        for entry in data["entry"]:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                messages = value.get("messages", [])
                
                print(f"📨 Processing {len(messages)} messages")
                
                for message in messages:
                    # Extract message details
                    from_phone = message.get("from")
                    message_text = message.get("text", {}).get("body", "")
                    message_id = message.get("id")
                    
                    print(f"📱 Message from {from_phone}: {message_text}")
                    
                    if not from_phone or not message_text:
                        print("Missing from_phone or message_text, skipping")
                        continue
                    
                    # Find agency by phone number (you'll need to match this)
                    # For now, use first active agency
                    agency = await agencies_collection.find_one({"is_active": True}, {"_id": 0})
                    if not agency:
                        # Try to get any agency
                        agency = await agencies_collection.find_one({}, {"_id": 0})
                    
                    if not agency:
                        print("No agency found!")
                        continue
                    
                    agency_id = agency["id"]
                    print(f"🏢 Using agency: {agency.get('name')} ({agency_id})")
                    
                    # Process message
                    await process_incoming_message(agency_id, from_phone, message_text, message_id)
        
        return {"status": "ok"}
    
    except Exception as e:
        print(f"❌ Error processing webhook: {e}")
        import traceback
        traceback.print_exc()
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
