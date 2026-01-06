from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
RESET_TOKEN_EXPIRE_MINUTES = 30  # 30 minutes

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# In-memory store for reset tokens (prod: usar DB o Redis)
reset_tokens = {}

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta
        if expires_delta
        else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

def create_reset_token(email: str) -> str:
    token = str(uuid.uuid4())
    reset_tokens[token] = {
        "email": email,
        "expires_at": datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    }
    return token

def verify_reset_token(token: str) -> Optional[str]:
    token_data = reset_tokens.get(token)
    if not token_data:
        return None

    if datetime.utcnow() > token_data["expires_at"]:
        del reset_tokens[token]
        return None

    email = token_data["email"]
    del reset_tokens[token]
    return email

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return {"id": user_id, **payload}
