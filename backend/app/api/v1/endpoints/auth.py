from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import APIKeyCookie
from pydantic import BaseModel
from jose import JWTError, jwt

from app.config import settings

router = APIRouter()

# Simple hardcoded credentials
VALID_USERNAME = "Volemby"
VALID_PASSWORD = "Volemby"

# Security scheme (just for OpenAPI documentation mainly, and dependency injection)
cookie_scheme = APIKeyCookie(name="access_token", auto_error=False)

class LoginRequest(BaseModel):
    username: str
    password: str

class User(BaseModel):
    username: str

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

async def get_current_user(token: str | None = Depends(cookie_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    if not token:
         raise credentials_exception
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None or username != VALID_USERNAME:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return User(username=username)

@router.post("/login")
async def login(response: Response, login_data: LoginRequest):
    if login_data.username == VALID_USERNAME and login_data.password == VALID_PASSWORD:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": login_data.username}, expires_delta=access_token_expires
        )
        # Set HttpOnly cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            samesite="lax",
            secure=False, # Set to True in production with HTTPS
        )
        return {"message": "Logged in successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
