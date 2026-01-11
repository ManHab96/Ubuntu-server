from fastapi import APIRouter, HTTPException, Depends, Request, Query
from database import (
    system_config_collection,
    conversations_collection,
    messages_collection,
    customers_collection,
    cars_collection,
    promotions_collection,
    agencies_collection,
    appointments_collection)
from auth import get_current_user
import httpx
import uuid
import asyncio
import re
from datetime import datetime, timedelta
from dateutil import parser as date_parser
import os
from models import LeadSource


# esto es  la citas con IA
from services.ai_service import handle_ai_action
from pydantic import BaseModel

# Import Google Generative AI directly (replaces emergentintegrations)
from google import genai

# estructura de JSON
import json

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

DEFAULT_VERIFY_TOKEN = "Ventas123"

DAYS_MAP = {
    'lunes': 0, 'martes': 1, 'miércoles': 2, 'miercoles': 2,
    'jueves': 3, 'viernes': 4, 'sábado': 5, 'sabado': 5, 'domingo': 6
}

MONTHS_MAP = {
    'enero': 1,
    'febrero': 2,
    'marzo': 3,
    'abril': 4,
    'mayo': 5,
    'junio': 6,
    'julio': 7,
    'agosto': 8,
    'septiembre': 9,
    'octubre': 10,
    'noviembre': 11,
    'diciembre': 12}


async def detect_and_create_appointment(
        agency_id: str,
        customer_id: str,
        user_message: str,
        conversation_id: str) -> dict:
    message_lower = user_message.lower()
    appointment_keywords = [
        'cita',
        'agendar',
        'reservar',
        'apartar',
        'ir',
        'visitar',
        'voy',
        'iré',
        'ire',
        'paso',
        'llego']
    time_keywords = [
        'hora',
        'mañana',
        'tarde',
        'lunes',
        'martes',
        'miércoles',
        'jueves',
        'viernes',
        'sábado',
        'domingo']

    has_appointment_intent = any(
        kw in message_lower for kw in appointment_keywords)
    has_time_reference = any(
        kw in message_lower for kw in time_keywords) or re.search(
        r'\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs?)?', message_lower)

    if not (has_appointment_intent and has_time_reference):
        return None

    appointment_date = None
    appointment_time = None
    now = datetime.utcnow()

    if 'mañana' in message_lower and 'pasado' not in message_lower:
        appointment_date = now + timedelta(days=1)
    elif 'pasado mañana' in message_lower:
        appointment_date = now + timedelta(days=2)
    elif 'hoy' in message_lower:
        appointment_date = now

    for day_name, day_num in DAYS_MAP.items():
        if day_name in message_lower:
            days_ahead = day_num - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            appointment_date = now + timedelta(days=days_ahead)
            break

    date_match = re.search(
        r'(\d{1,2})\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)',
        message_lower)
    if date_match:
        day = int(date_match.group(1))
        month = MONTHS_MAP.get(date_match.group(2), now.month)
        year = now.year if month >= now.month else now.year + 1
        try:
            appointment_date = datetime(year, month, day)
        except ValueError:
            pass

    time_match = re.search(
        r'(\d{1,2})(?::(\d{2}))?\s*(am|pm|hrs?|horas?)?',
        message_lower)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2)) if time_match.group(2) else 0
        period = time_match.group(3) or ''
        if 'pm' in period.lower() and hour < 12:
            hour += 12
        elif 'am' in period.lower() and hour == 12:
            hour = 0
        if hour < 9 and not period:
            hour += 12
        appointment_time = f"{hour:02d}:{minute:02d}"

    if appointment_date and not appointment_time:
        appointment_time = "10:00"

    if appointment_date:
        try:
            if appointment_time:
                hour, minute = map(int, appointment_time.split(':'))
                appointment_datetime = appointment_date.replace(
                    hour=hour, minute=minute, second=0, microsecond=0)
            else:
                appointment_datetime = appointment_date.replace(
                    hour=10, minute=0, second=0, microsecond=0)

            appointment_id = str(uuid.uuid4())
            appointment_data = {
                "id": appointment_id,
                "customer_id": customer_id,
                "agency_id": agency_id,
                "appointment_date": appointment_datetime,
                "status": "pending",
                "source": LeadSource.WHATSAPP,
                "notes": f"Cita agendada automáticamente por IA. Mensaje: {user_message[:100]}",
                "created_at": datetime.utcnow()}
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


@router.api_route("/webhook", methods=["GET", "HEAD"])
async def verify_webhook(
    request: Request,
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    from fastapi.responses import PlainTextResponse, Response
    if request.method == "HEAD":
        return Response(status_code=200)
    if hub_mode == "subscribe" and hub_challenge:
        if hub_verify_token == DEFAULT_VERIFY_TOKEN:
            return PlainTextResponse(content=hub_challenge, status_code=200)
        return PlainTextResponse(
            content="Invalid verify token",
            status_code=403)
    if not hub_mode and not hub_challenge and not hub_verify_token:
        return PlainTextResponse(content="Webhook is active", status_code=200)
    return PlainTextResponse(content="Invalid request", status_code=400)


@router.post("/webhook")
async def receive_whatsapp_message(request: Request):
    try:
        data = await request.json()
        if "entry" not in data:
            return {"status": "ok"}
        for entry in data["entry"]:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                messages = value.get("messages", [])
                for message in messages:
                    from_phone = message.get("from")
                    message_text = message.get("text", {}).get("body", "")
                    message_id = message.get("id")
                    if not from_phone or not message_text:
                        continue
                    agency = await agencies_collection.find_one({"is_active": True}, {"_id": 0})
                    if not agency:
                        agency = await agencies_collection.find_one({}, {"_id": 0})
                    if not agency:
                        continue
                    agency_id = agency["id"]
                    await process_incoming_message(agency_id, from_phone, message_text, message_id)
        return {"status": "ok"}
    except Exception as e:
        print(f"Error processing webhook: {e}")
        return {"status": "error", "message": str(e)}


async def process_incoming_message(
        agency_id: str,
        from_phone: str,
        message_text: str,
        message_id: str):
    customer = await customers_collection.find_one({"phone": from_phone, "agency_id": agency_id})
    if not customer:
        customer_id = str(uuid.uuid4())
        customer = {
            "id": customer_id,
            "agency_id": agency_id,
            "name": from_phone,
            "phone": from_phone,
            "source": LeadSource.WHATSAPP,
            "created_at": datetime.utcnow()}
        await customers_collection.insert_one(customer)
    else:
        customer_id = customer["id"]

    conversation = await conversations_collection.find_one({"agency_id": agency_id, "customer_id": customer_id})
    if not conversation:
        conversation_id = str(uuid.uuid4())
        conversation = {
            "id": conversation_id,
            "agency_id": agency_id,
            "customer_id": customer_id,
            "whatsapp_phone": from_phone,
            "last_message": message_text,
            "last_message_at": datetime.utcnow(),
            "created_at": datetime.utcnow()}
        await conversations_collection.insert_one(conversation)
    else:
        conversation_id = conversation["id"]
        await conversations_collection.update_one({"id": conversation_id}, {"$set": {"last_message": message_text, "last_message_at": datetime.utcnow()}})

    incoming_msg = {
        "id": str(
            uuid.uuid4()),
        "conversation_id": conversation_id,
        "from_customer": True,
        "message_text": message_text,
        "timestamp": datetime.utcnow()}
    await messages_collection.insert_one(incoming_msg)

    appointment_info = await detect_and_create_appointment(agency_id, customer_id, message_text, conversation_id)

    if appointment_info and appointment_info.get("created"):
        response_text = f"✅ ¡Excelente! He agendado tu cita:\n\n📅 Fecha: {appointment_info['date']}\n🕐 Hora: {appointment_info['time']}\n\n"
        agency = await agencies_collection.find_one({"id": agency_id}, {"_id": 0})
        if agency:
            if agency.get('address'):
                response_text += f"📍 Dirección: {agency['address']}\n"
            if agency.get('phone'):
                response_text += f"📞 Teléfono: {agency['phone']}\n"
        response_text += "\n¡Te esperamos!"
    else:
        response_text = await generate_ai_response(agency_id, conversation_id, message_text)

    outgoing_msg = {
        "id": str(
            uuid.uuid4()),
        "conversation_id": conversation_id,
        "from_customer": False,
        "message_text": response_text,
        "timestamp": datetime.utcnow()}
    await messages_collection.insert_one(outgoing_msg)
    await send_whatsapp_message(agency_id, from_phone, response_text)


async def generate_fallback_response(
        user_message: str,
        cars: list,
        promotions: list,
        agency: dict) -> str:
    message_lower = user_message.lower()
    agency_name = agency.get(
        'name', 'nuestra agencia') if agency else 'nuestra agencia'

    if any(
        word in message_lower for word in [
            'hola',
            'buenos',
            'buenas',
            'hi',
            'hey']):
        return f"¡Hola! Bienvenido a {agency_name}. ¿Te gustaría conocer nuestros autos disponibles, promociones, o agendar una cita?"
    if any(
        word in message_lower for word in [
            'auto',
            'autos',
            'carro',
            'carros',
            'vehículo',
            'vehiculo']):
        if cars:
            response = f"Tenemos {len(cars)} vehículos disponibles:\n\n"
            for car in cars[:5]:
                response += f"• {car.get('brand', '')} {car.get('model', '')} {car.get('year', '')}"
                if car.get('price'):
                    response += f" - ${car['price']:,.2f}"
                response += "\n"
            response += "\n¿Te gustaría agendar una cita para verlos?"
            return response
        return "Estamos actualizando nuestro inventario. ¿Te gustaría que un asesor te contacte?"
    if any(
        word in message_lower for word in [
            'promoción',
            'promocion',
            'oferta',
            'descuento']):
        if promotions:
            response = "¡Promociones especiales!\n\n"
            for promo in promotions[:3]:
                response += f"🎉 {promo.get('title', '')}: {promo.get('description', '')}\n\n"
            return response
        return "No tenemos promociones activas ahora. ¿Puedo ayudarte a encontrar un auto?"
    if any(word in message_lower for word in ['cita', 'agendar', 'visitar']):
        return "¡Excelente! ¿Qué día y hora te funcionaría para visitarnos?"
    if any(
        word in message_lower for word in [
            'precio',
            'costo',
            'cuanto',
            'financiamiento']):
        return "Tenemos precios competitivos y opciones de financiamiento. ¿Qué modelo te interesa?"
    if any(
        word in message_lower for word in [
            'horario',
            'ubicación',
            'direccion',
            'donde']):
        response = "Nuestra información:\n\n"
        if agency:
            if agency.get('address'):
                response += f"📍 {agency['address']}\n"
            if agency.get('phone'):
                response += f"📞 {agency['phone']}\n"
            if agency.get('business_hours'):
                response += f"🕐 {agency['business_hours']}\n"
        return response
    if any(
        word in message_lower for word in [
            'gracias',
            'ok',
            'vale',
            'perfecto']):
        return "¡Con gusto! ¿Algo más en que pueda ayudarte? 🚗"
    return f"Gracias por contactar a {agency_name}. Puedo ayudarte con:\n• Autos disponibles\n• Promociones\n• Agendar cita\n• Ubicación\n\n¿Qué necesitas?"


async def generate_ai_response(
        agency_id: str,
        conversation_id: str,
        user_message: str) -> str:
    try:
        config = await system_config_collection.find_one({"agency_id": agency_id})
        if not config:
            return "Lo siento, no puedo procesar tu mensaje ahora."

        cars = await cars_collection.find({"agency_id": agency_id, "is_available": True}, {"_id": 0}).to_list(100)
        now = datetime.utcnow()
        promotions = await promotions_collection.find({"agency_id": agency_id, "is_active": True, "start_date": {"$lte": now}, "end_date": {"$gte": now}}, {"_id": 0}).to_list(100)
        agency = await agencies_collection.find_one({"id": agency_id}, {"_id": 0})

        api_key = config.get("gemini_api_key", "")
        # EMERGENT_LLM_KEY only works inside Emergent platform - use fallback
        # outside
        if not api_key or api_key == "EMERGENT_LLM_KEY" or "emergent" in api_key.lower():
            return await generate_fallback_response(user_message, cars, promotions, agency)

        system_prompt = config.get(
            "ai_system_prompt",
            "Eres un asistente de ventas automotriz.")
        conv_messages = await messages_collection.find({"conversation_id": conversation_id}, {"_id": 0}).sort("timestamp", -1).limit(10).to_list(10)
        conv_messages.reverse()

        context = f"""{system_prompt}

Agencia: {agency.get('name', '')}
Dirección: {agency.get('address', '')}
Teléfono: {agency.get('phone', '')}

Autos disponibles:"""
        for car in cars[:10]:
            context += f"\n- {car.get('brand', '')} {car.get('model', '')} {car.get('year', '')}"
            if car.get('price'):
                context += f" - ${car['price']:,.2f}"

        if promotions:
            context += "\n\nPromociones:"
            for promo in promotions:
                context += f"\n- {promo['title']}: {promo['description']}"

        context += "\n\nResponde profesionalmente en español. Orienta al cliente a agendar cita."

        history_text = ""
        for msg in conv_messages[-5:]:
            role = "Cliente" if msg.get('from_customer') else "Asistente"
            history_text += f"{role}: {msg.get('message_text', '')}\n"

        full_prompt = f"{context}\n\nHistorial:\n{history_text}\nCliente: {user_message}\n\nAsistente:"

        # === MIGRACIÓN GEMINI SDK (google.genai) ===
        client = genai.Client(api_key=api_key)

        response = await asyncio.wait_for(
            asyncio.to_thread(
                client.models.generate_content,
                model="models/gemini-2.5-flash",
                contents=full_prompt,
                config={
                    "temperature": 0.7,
                    "max_output_tokens": 1024
                }
            ),
            timeout=30.0
        )

        return response.text

    except Exception as e:
        print(f"Error AI response: {e}")
        try:
            cars = await cars_collection.find(
                {"agency_id": agency_id, "is_available": True},
                {"_id": 0}
            ).to_list(100)
            agency = await agencies_collection.find_one({"id": agency_id}, {"_id": 0})
            promotions = await promotions_collection.find(
                {"agency_id": agency_id, "is_active": True},
                {"_id": 0}
            ).to_list(100)
            return await generate_fallback_response(user_message, cars, promotions, agency)
        except BaseException:
            return "Gracias por tu mensaje. Un asesor te contactará pronto."


async def send_whatsapp_message(agency_id: str, to_phone: str, message: str):
    try:
        config = await system_config_collection.find_one({"agency_id": agency_id})
        if not config:
            return
        access_token = config.get("whatsapp_access_token")
        phone_number_id = config.get("whatsapp_phone_number_id")
        if not access_token or not phone_number_id:
            return
        url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"}
        data = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "text",
            "text": {
                "body": message}}
        async with httpx.AsyncClient() as client:
            await client.post(url, headers=headers, json=data)
    except Exception as e:
        print(f"Error sending WhatsApp: {e}")


@router.post("/send")
async def send_message(
        agency_id: str,
        to_phone: str,
        message: str,
        current_user: dict = Depends(get_current_user)):
    await send_whatsapp_message(agency_id, to_phone, message)
    return {"status": "sent"}

