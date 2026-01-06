#!/bin/bash

# =============================================================================
# SCRIPT COMPLETO DE CORRECCIÓN - BACKEND + FRONTEND
# Para hacer funcionar el proyecto fuera de Emergent
# =============================================================================

set -e  # Detener si hay error

echo "🔧 CORRECCIÓN COMPLETA DEL PROYECTO"
echo "===================================="
echo ""

# Variables
PROJECT_DIR="/home/ubuntu/agencia-automotriz"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Obtener IP de la VM
VM_IP=$(hostname -I | awk '{print $1}')
echo "📍 IP detectada de la VM: $VM_IP"
echo ""

# -----------------------------------------------------------------------------
# PASO 1: Crear directorios necesarios
# -----------------------------------------------------------------------------
echo "📁 Paso 1: Creando directorios..."

mkdir -p $BACKEND_DIR/uploads
sudo mkdir -p /app/backend/uploads 2>/dev/null || true
sudo chown -R ubuntu:ubuntu /app 2>/dev/null || true

echo "✅ Directorios creados"

# -----------------------------------------------------------------------------
# PASO 2: Corregir backend/server.py
# -----------------------------------------------------------------------------
echo ""
echo "📝 Paso 2: Corrigiendo backend/server.py..."

cat > $BACKEND_DIR/server.py << 'SERVEREOF'
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

# Import routes
from routes import auth, agencies, cars, files, promotions, customers, appointments, conversations, config, whatsapp, dashboard

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'automotive_agency')]

# Create the main app
app = FastAPI(title="Automotive Agency API")

# Mount uploads directory for serving files - USE RELATIVE PATH
uploads_dir = ROOT_DIR / "uploads"
uploads_dir.mkdir(exist_ok=True)

# Route to serve uploaded files
@app.get("/api/files/serve/{filename}")
async def serve_file(filename: str):
    file_path = uploads_dir / filename
    if not file_path.exists():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# Include routers
app.include_router(auth.router)
app.include_router(agencies.router)
app.include_router(cars.router)
app.include_router(files.router)
app.include_router(promotions.router)
app.include_router(customers.router)
app.include_router(appointments.router)
app.include_router(conversations.router)
app.include_router(conversations.messages_router)
app.include_router(config.router)
app.include_router(whatsapp.router)
app.include_router(dashboard.router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
SERVEREOF

echo "✅ server.py corregido"

# -----------------------------------------------------------------------------
# PASO 3: Corregir backend/routes/files.py
# -----------------------------------------------------------------------------
echo ""
echo "📝 Paso 3: Corrigiendo backend/routes/files.py..."

cat > $BACKEND_DIR/routes/files.py << 'FILESEOF'
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Optional
import os
import uuid
import shutil
from pathlib import Path
from PIL import Image
import io
from models import MediaFile
from database import media_files_collection, cars_collection, promotions_collection
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/files", tags=["files"])

# Create uploads directory using relative path (not hardcoded /app/)
BASE_DIR = Path(__file__).parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# File validation
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
ALLOWED_PDF_TYPES = ["application/pdf"]
ALLOWED_TYPES = ALLOWED_IMAGE_TYPES + ALLOWED_PDF_TYPES

# Image optimization settings
MAX_IMAGE_WIDTH = 1920
MAX_IMAGE_HEIGHT = 1920
JPEG_QUALITY = 85
WEBP_QUALITY = 85

def optimize_image(image_bytes: bytes, filename: str) -> tuple[bytes, str]:
    """Optimize image: resize if needed and compress"""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        if img.width > MAX_IMAGE_WIDTH or img.height > MAX_IMAGE_HEIGHT:
            img.thumbnail((MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT), Image.Resampling.LANCZOS)
        output = io.BytesIO()
        img.save(output, format='WEBP', quality=WEBP_QUALITY, method=6)
        return output.getvalue(), '.webp'
    except Exception as e:
        print(f"Error optimizing image: {e}")
        return image_bytes, Path(filename).suffix.lower()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    agency_id: str = Form(...),
    category: str = Form(...),
    related_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo de archivo no soportado. Tipos permitidos: {', '.join(ALLOWED_TYPES)}")

    contents = await file.read()
    original_size = len(contents)

    if original_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"Archivo demasiado grande. Máximo: 5MB")

    if file.content_type in ALLOWED_IMAGE_TYPES:
        contents, file_ext = optimize_image(contents, file.filename)
        final_size = len(contents)
        print(f"Image optimized: {original_size} -> {final_size} bytes")
    else:
        file_ext = Path(file.filename).suffix.lower()
        final_size = original_size

    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOADS_DIR / unique_filename

    with file_path.open("wb") as buffer:
        buffer.write(contents)

    file_type = "pdf" if file.content_type == "application/pdf" else "image"

    file_id = str(uuid.uuid4())
    file_dict = {
        "id": file_id,
        "agency_id": agency_id,
        "filename": file.filename,
        "file_path": str(file_path),
        "file_url": f"/api/files/serve/{unique_filename}",
        "file_type": file_type,
        "file_size": final_size,
        "original_size": original_size,
        "category": category,
        "related_id": related_id,
        "uploaded_at": datetime.utcnow()
    }

    await media_files_collection.insert_one(file_dict)

    if category == "car" and related_id:
        await cars_collection.update_one(
            {"id": related_id},
            {"$push": {"images": file_dict["file_url"]}}
        )

    if category == "promotion" and related_id:
        await promotions_collection.update_one(
            {"id": related_id},
            {"$set": {"file_id": file_id}}
        )

    return MediaFile(**file_dict)

@router.post("/upload-multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    agency_id: str = Form(...),
    category: str = Form(...),
    related_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    uploaded_files = []
    for file in files:
        try:
            result = await upload_file(file, agency_id, category, related_id, current_user)
            uploaded_files.append(result)
        except HTTPException:
            continue
    return {"uploaded": len(uploaded_files), "files": uploaded_files}

@router.get("/")
async def get_files(
    agency_id: Optional[str] = None,
    category: Optional[str] = None,
    related_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if agency_id:
        query["agency_id"] = agency_id
    if category:
        query["category"] = category
    if related_id:
        query["related_id"] = related_id
    files = await media_files_collection.find(query, {"_id": 0}).to_list(1000)
    return [MediaFile(**file) for file in files]

@router.get("/{file_id}")
async def get_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file = await media_files_collection.find_one({"id": file_id}, {"_id": 0})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return MediaFile(**file)

@router.delete("/{file_id}")
async def delete_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file = await media_files_collection.find_one({"id": file_id})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    file_path = Path(file["file_path"])
    if file_path.exists():
        file_path.unlink()
    if file.get("category") == "car" and file.get("related_id"):
        await cars_collection.update_one(
            {"id": file["related_id"]},
            {"$pull": {"images": file.get("file_url")}}
        )
    if file.get("category") == "promotion" and file.get("related_id"):
        await promotions_collection.update_one(
            {"id": file["related_id"]},
            {"$set": {"file_id": None}}
        )
    await media_files_collection.delete_one({"id": file_id})
    return {"message": "File deleted successfully"}
FILESEOF

echo "✅ files.py corregido"

# -----------------------------------------------------------------------------
# PASO 4: Corregir backend/routes/whatsapp.py
# -----------------------------------------------------------------------------
echo ""
echo "📝 Paso 4: Corrigiendo backend/routes/whatsapp.py..."

cat > $BACKEND_DIR/routes/whatsapp.py << 'WHATSAPPEOF'
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

# Import Google Generative AI directly (replaces emergentintegrations)
import google.generativeai as genai

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

DEFAULT_VERIFY_TOKEN = "Ventas123"

DAYS_MAP = {
    'lunes': 0, 'martes': 1, 'miércoles': 2, 'miercoles': 2,
    'jueves': 3, 'viernes': 4, 'sábado': 5, 'sabado': 5, 'domingo': 6
}

MONTHS_MAP = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
    'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
}

async def detect_and_create_appointment(agency_id: str, customer_id: str, user_message: str, conversation_id: str) -> dict:
    message_lower = user_message.lower()
    appointment_keywords = ['cita', 'agendar', 'reservar', 'apartar', 'ir', 'visitar', 'voy', 'iré', 'ire', 'paso', 'llego']
    time_keywords = ['hora', 'mañana', 'tarde', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

    has_appointment_intent = any(kw in message_lower for kw in appointment_keywords)
    has_time_reference = any(kw in message_lower for kw in time_keywords) or re.search(r'\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs?)?', message_lower)

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

    date_match = re.search(r'(\d{1,2})\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)', message_lower)
    if date_match:
        day = int(date_match.group(1))
        month = MONTHS_MAP.get(date_match.group(2), now.month)
        year = now.year if month >= now.month else now.year + 1
        try:
            appointment_date = datetime(year, month, day)
        except ValueError:
            pass

    time_match = re.search(r'(\d{1,2})(?::(\d{2}))?\s*(am|pm|hrs?|horas?)?', message_lower)
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
                appointment_datetime = appointment_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            else:
                appointment_datetime = appointment_date.replace(hour=10, minute=0, second=0, microsecond=0)

            appointment_id = str(uuid.uuid4())
            appointment_data = {
                "id": appointment_id,
                "customer_id": customer_id,
                "agency_id": agency_id,
                "appointment_date": appointment_datetime,
                "status": "pending",
                "source": "whatsapp_ai",
                "notes": f"Cita agendada automáticamente por IA. Mensaje: {user_message[:100]}",
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
        return PlainTextResponse(content="Invalid verify token", status_code=403)
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

async def process_incoming_message(agency_id: str, from_phone: str, message_text: str, message_id: str):
    customer = await customers_collection.find_one({"phone": from_phone, "agency_id": agency_id})
    if not customer:
        customer_id = str(uuid.uuid4())
        customer = {"id": customer_id, "agency_id": agency_id, "name": from_phone, "phone": from_phone, "source": "whatsapp", "created_at": datetime.utcnow()}
        await customers_collection.insert_one(customer)
    else:
        customer_id = customer["id"]

    conversation = await conversations_collection.find_one({"agency_id": agency_id, "customer_id": customer_id})
    if not conversation:
        conversation_id = str(uuid.uuid4())
        conversation = {"id": conversation_id, "agency_id": agency_id, "customer_id": customer_id, "whatsapp_phone": from_phone, "last_message": message_text, "last_message_at": datetime.utcnow(), "created_at": datetime.utcnow()}
        await conversations_collection.insert_one(conversation)
    else:
        conversation_id = conversation["id"]
        await conversations_collection.update_one({"id": conversation_id}, {"$set": {"last_message": message_text, "last_message_at": datetime.utcnow()}})

    incoming_msg = {"id": str(uuid.uuid4()), "conversation_id": conversation_id, "from_customer": True, "message_text": message_text, "timestamp": datetime.utcnow()}
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

    outgoing_msg = {"id": str(uuid.uuid4()), "conversation_id": conversation_id, "from_customer": False, "message_text": response_text, "timestamp": datetime.utcnow()}
    await messages_collection.insert_one(outgoing_msg)
    await send_whatsapp_message(agency_id, from_phone, response_text)

async def generate_fallback_response(user_message: str, cars: list, promotions: list, agency: dict) -> str:
    message_lower = user_message.lower()
    agency_name = agency.get('name', 'nuestra agencia') if agency else 'nuestra agencia'

    if any(word in message_lower for word in ['hola', 'buenos', 'buenas', 'hi', 'hey']):
        return f"¡Hola! Bienvenido a {agency_name}. ¿Te gustaría conocer nuestros autos disponibles, promociones, o agendar una cita?"
    if any(word in message_lower for word in ['auto', 'autos', 'carro', 'carros', 'vehículo', 'vehiculo']):
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
    if any(word in message_lower for word in ['promoción', 'promocion', 'oferta', 'descuento']):
        if promotions:
            response = "¡Promociones especiales!\n\n"
            for promo in promotions[:3]:
                response += f"🎉 {promo.get('title', '')}: {promo.get('description', '')}\n\n"
            return response
        return "No tenemos promociones activas ahora. ¿Puedo ayudarte a encontrar un auto?"
    if any(word in message_lower for word in ['cita', 'agendar', 'visitar']):
        return "¡Excelente! ¿Qué día y hora te funcionaría para visitarnos?"
    if any(word in message_lower for word in ['precio', 'costo', 'cuanto', 'financiamiento']):
        return "Tenemos precios competitivos y opciones de financiamiento. ¿Qué modelo te interesa?"
    if any(word in message_lower for word in ['horario', 'ubicación', 'direccion', 'donde']):
        response = "Nuestra información:\n\n"
        if agency:
            if agency.get('address'):
                response += f"📍 {agency['address']}\n"
            if agency.get('phone'):
                response += f"📞 {agency['phone']}\n"
            if agency.get('business_hours'):
                response += f"🕐 {agency['business_hours']}\n"
        return response
    if any(word in message_lower for word in ['gracias', 'ok', 'vale', 'perfecto']):
        return "¡Con gusto! ¿Algo más en que pueda ayudarte? 🚗"
    return f"Gracias por contactar a {agency_name}. Puedo ayudarte con:\n• Autos disponibles\n• Promociones\n• Agendar cita\n• Ubicación\n\n¿Qué necesitas?"

async def generate_ai_response(agency_id: str, conversation_id: str, user_message: str) -> str:
    try:
        config = await system_config_collection.find_one({"agency_id": agency_id})
        if not config:
            return "Lo siento, no puedo procesar tu mensaje ahora."

        cars = await cars_collection.find({"agency_id": agency_id, "is_available": True}, {"_id": 0}).to_list(100)
        now = datetime.utcnow()
        promotions = await promotions_collection.find({"agency_id": agency_id, "is_active": True, "start_date": {"$lte": now}, "end_date": {"$gte": now}}, {"_id": 0}).to_list(100)
        agency = await agencies_collection.find_one({"id": agency_id}, {"_id": 0})

        api_key = config.get("gemini_api_key", "")
        # EMERGENT_LLM_KEY only works inside Emergent platform - use fallback outside
        if not api_key or api_key == "EMERGENT_LLM_KEY" or "emergent" in api_key.lower():
            return await generate_fallback_response(user_message, cars, promotions, agency)

        system_prompt = config.get("ai_system_prompt", "Eres un asistente de ventas automotriz.")
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

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash', generation_config={'temperature': 0.7, 'max_output_tokens': 1024})
        response = await asyncio.wait_for(asyncio.to_thread(model.generate_content, full_prompt), timeout=30.0)
        return response.text

    except Exception as e:
        print(f"Error AI response: {e}")
        try:
            cars = await cars_collection.find({"agency_id": agency_id, "is_available": True}, {"_id": 0}).to_list(100)
            agency = await agencies_collection.find_one({"id": agency_id}, {"_id": 0})
            promotions = await promotions_collection.find({"agency_id": agency_id, "is_active": True}, {"_id": 0}).to_list(100)
            return await generate_fallback_response(user_message, cars, promotions, agency)
        except:
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
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        data = {"messaging_product": "whatsapp", "to": to_phone, "type": "text", "text": {"body": message}}
        async with httpx.AsyncClient() as client:
            await client.post(url, headers=headers, json=data)
    except Exception as e:
        print(f"Error sending WhatsApp: {e}")

@router.post("/send")
async def send_message(agency_id: str, to_phone: str, message: str, current_user: dict = Depends(get_current_user)):
    await send_whatsapp_message(agency_id, to_phone, message)
    return {"status": "sent"}

@router.post("/test-chat")
async def test_chat(request: dict, current_user: dict = Depends(get_current_user)):
    message = request.get("message")
    phone = request.get("phone", "+521234567890")
    agency_id = request.get("agency_id")
    if not message or not agency_id:
        raise HTTPException(status_code=400, detail="Message and agency_id required")

    customer = await customers_collection.find_one({"phone": phone, "agency_id": agency_id})
    if not customer:
        customer_id = str(uuid.uuid4())
        customer = {"id": customer_id, "agency_id": agency_id, "name": "Usuario Prueba", "phone": phone, "source": "organic", "created_at": datetime.utcnow()}
        await customers_collection.insert_one(customer)
    else:
        customer_id = customer["id"]

    conversation = await conversations_collection.find_one({"agency_id": agency_id, "customer_id": customer_id})
    if not conversation:
        conversation_id = str(uuid.uuid4())
        conversation = {"id": conversation_id, "agency_id": agency_id, "customer_id": customer_id, "whatsapp_phone": phone, "last_message": message, "last_message_at": datetime.utcnow(), "created_at": datetime.utcnow()}
        await conversations_collection.insert_one(conversation)
    else:
        conversation_id = conversation["id"]
        await conversations_collection.update_one({"id": conversation_id}, {"$set": {"last_message": message, "last_message_at": datetime.utcnow()}})

    user_msg = {"id": str(uuid.uuid4()), "conversation_id": conversation_id, "from_customer": True, "message_text": message, "timestamp": datetime.utcnow()}
    await messages_collection.insert_one(user_msg)
    response_text = await generate_ai_response(agency_id, conversation_id, message)
    ai_msg = {"id": str(uuid.uuid4()), "conversation_id": conversation_id, "from_customer": False, "message_text": response_text, "timestamp": datetime.utcnow()}
    await messages_collection.insert_one(ai_msg)
    return {"status": "success", "response": response_text, "conversation_id": conversation_id}
WHATSAPPEOF

echo "✅ whatsapp.py corregido"

# -----------------------------------------------------------------------------
# PASO 5: Corregir requirements.txt
# -----------------------------------------------------------------------------
echo ""
echo "📝 Paso 5: Corrigiendo requirements.txt..."

cat > $BACKEND_DIR/requirements.txt << 'REQEOF'
fastapi==0.110.1
uvicorn==0.25.0
starlette==0.37.2
motor==3.3.1
pymongo==4.5.0
bcrypt==4.1.3
python-jose[cryptography]==3.5.0
passlib==1.7.4
PyJWT==2.10.1
pydantic==2.12.5
email-validator==2.3.0
python-dateutil==2.9.0.post0
httpx==0.28.1
requests==2.32.5
google-generativeai==0.8.6
google-api-core==2.28.1
google-auth==2.45.0
python-dotenv==1.2.1
python-multipart==0.0.21
typing_extensions==4.15.0
anyio==4.12.0
Pillow==10.2.0
REQEOF

echo "✅ requirements.txt corregido"

# -----------------------------------------------------------------------------
# PASO 6: Crear .env del backend
# -----------------------------------------------------------------------------
echo ""
echo "📝 Paso 6: Creando .env del backend..."

cat > $BACKEND_DIR/.env << ENVEOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=automotive_agency
CORS_ORIGINS=*
JWT_SECRET_KEY=clave_secreta_segura_cambiar_en_produccion_$(date +%s)
ENVEOF

echo "✅ .env del backend creado"

# -----------------------------------------------------------------------------
# PASO 7: Crear .env del frontend
# -----------------------------------------------------------------------------
echo ""
echo "📝 Paso 7: Creando .env del frontend..."

cat > $FRONTEND_DIR/.env << ENVEOF
REACT_APP_BACKEND_URL=http://${VM_IP}:8001
ENVEOF

echo "✅ .env del frontend creado con IP: $VM_IP"

# -----------------------------------------------------------------------------
# PASO 8: Corregir frontend/src/pages/Config.jsx
# -----------------------------------------------------------------------------
echo ""
echo "📝 Paso 8: Corrigiendo frontend Config.jsx..."

# Reemplazar la URL del webhook hardcodeada y referencias a Emergent
sed -i "s|https://autodealer-ai.preview.emergentagent.com/api/whatsapp/webhook|http://${VM_IP}:8001/api/whatsapp/webhook|g" $FRONTEND_DIR/src/pages/Config.jsx

# Modificar el texto sobre Emergent Key para indicar que no funciona fuera de la plataforma
sed -i 's|Opción 1: Usar Emergent Universal Key (Recomendado)|Opción 1: Usar tu propia API Key de Google (Recomendado)|g' $FRONTEND_DIR/src/pages/Config.jsx
sed -i 's|Clave universal que funciona con Gemini|Obtén tu API Key gratis en Google AI Studio. La Emergent Key solo funciona dentro de la plataforma Emergent|g' $FRONTEND_DIR/src/pages/Config.jsx

echo "✅ Config.jsx corregido"

# -----------------------------------------------------------------------------
# PASO 9: Reinstalar dependencias del backend
# -----------------------------------------------------------------------------
echo ""
echo "📦 Paso 9: Reinstalando dependencias del backend..."

cd $BACKEND_DIR

# Eliminar entorno virtual existente
rm -rf venv

# Crear nuevo entorno virtual
python3.11 -m venv venv

# Activar
source venv/bin/activate

# Actualizar pip
pip install --upgrade pip

# Instalar dependencias
pip install -r requirements.txt

echo "✅ Dependencias del backend instaladas"

# -----------------------------------------------------------------------------
# PASO 10: Reconstruir frontend
# -----------------------------------------------------------------------------
echo ""
echo "📦 Paso 10: Reconstruyendo frontend..."

cd $FRONTEND_DIR

# Instalar dependencias
yarn install

# Construir
yarn build

echo "✅ Frontend reconstruido"

# -----------------------------------------------------------------------------
# PASO 11: Configurar PM2
# -----------------------------------------------------------------------------
echo ""
echo "📝 Paso 11: Configurando PM2..."

cd $PROJECT_DIR

cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/home/ubuntu/agencia-automotriz/backend',
      script: 'venv/bin/uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8001',
      interpreter: 'none',
      env: {
        MONGO_URL: 'mongodb://localhost:27017',
        DB_NAME: 'automotive_agency'
      }
    },
    {
      name: 'frontend',
      cwd: '/home/ubuntu/agencia-automotriz/frontend',
      script: 'node_modules/.bin/serve',
      args: '-s build -l 3000',
      interpreter: 'none'
    }
  ]
};
PM2EOF

# Instalar serve si no está
cd $FRONTEND_DIR
yarn add serve 2>/dev/null || true

# Detener procesos anteriores
pm2 delete all 2>/dev/null || true

# Iniciar todo
cd $PROJECT_DIR
pm2 start ecosystem.config.js
pm2 save

echo "✅ PM2 configurado"

# -----------------------------------------------------------------------------
# FIN
# -----------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "🎉 ¡CORRECCIÓN COMPLETADA!"
echo "=============================================="
echo ""
echo "📍 Accede a tu aplicación:"
echo "   Frontend: http://${VM_IP}:3000"
echo "   Backend:  http://${VM_IP}:8001/docs"
echo ""
echo "🔑 Credenciales:"
echo "   Email: admin@agencia.com"
echo "   Contraseña: admin123"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - La Emergent LLM Key NO funciona fuera de Emergent"
echo "   - Obtén tu API Key de Google en: https://aistudio.google.com/apikey"
echo "   - Configúrala en: Configuración → IA"
echo ""
echo "📋 Comandos útiles:"
echo "   pm2 status        - Ver estado"
echo "   pm2 logs          - Ver logs"
echo "   pm2 restart all   - Reiniciar"
echo ""
echo "=============================================="
