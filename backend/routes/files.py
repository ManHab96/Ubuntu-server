from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Optional
import os
import uuid
import shutil
from pathlib import Path
from models import MediaFile
from database import media_files_collection
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/files", tags=["files"])

# Create uploads directory if it doesn't exist
UPLOADS_DIR = Path("/app/backend/uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    agency_id: str = Form(...),
    category: str = Form(...),
    related_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not supported")
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOADS_DIR / unique_filename
    
    # Save file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Determine file type
    file_type = "pdf" if file.content_type == "application/pdf" else "image"
    
    # Create database record
    file_id = str(uuid.uuid4())
    file_dict = {
        "id": file_id,
        "agency_id": agency_id,
        "filename": file.filename,
        "file_path": str(file_path),
        "file_type": file_type,
        "category": category,
        "related_id": related_id,
        "uploaded_at": datetime.utcnow()
    }
    
    await media_files_collection.insert_one(file_dict)
    
    return MediaFile(**file_dict)

@router.get("/", response_model=List[MediaFile])
async def get_files(
    agency_id: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if agency_id:
        query["agency_id"] = agency_id
    if category:
        query["category"] = category
    
    files = await media_files_collection.find(query, {"_id": 0}).to_list(1000)
    return [MediaFile(**file) for file in files]

@router.get("/{file_id}", response_model=MediaFile)
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
    
    # Delete physical file
    file_path = Path(file["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    # Delete database record
    await media_files_collection.delete_one({"id": file_id})
    
    return {"message": "File deleted successfully"}
