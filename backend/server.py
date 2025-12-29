from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
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

# Mount uploads directory for serving files
uploads_dir = Path("/app/backend/uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(agencies.router)
app.include_router(cars.router)
app.include_router(files.router)
app.include_router(promotions.router)
app.include_router(customers.router)
app.include_router(appointments.router)
app.include_router(conversations.router)
app.include_router(config.router)
app.include_router(whatsapp.router)
app.include_router(dashboard.router)

# Root endpoint
@app.get("/api/")
async def root():
    return {"message": "Automotive Agency API", "status": "running"}

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()