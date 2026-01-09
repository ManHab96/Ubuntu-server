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
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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
