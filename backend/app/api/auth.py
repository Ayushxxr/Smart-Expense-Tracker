from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, get_current_user
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, SocialLogin, TokenResponse, UserOut
import httpx
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter(prefix="/api/auth", tags=["auth"])


def user_to_schema(user: User) -> UserOut:
    return UserOut(
        id=str(user.id),
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
        financial_health_score=user.financial_health_score or 0.0,
        created_at=user.created_at,
    )


@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=data.name,
        email=email,
        hashed_password=hash_password(data.password),
        monthly_income=data.monthly_income if data.monthly_income is not None else 50000.0
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_to_schema(user)
    )


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_to_schema(user)
    )


@router.post("/social", response_model=TokenResponse)
async def social_login(data: SocialLogin, db: Session = Depends(get_db)):
    email = None
    name = None
    social_id = None
    avatar = None

    if data.provider == "google":
        try:
            # We accept both access_token (for some libraries) or id_token. 
            # react-oauth/google provides an ID token in the 'credential' field.
            idinfo = id_token.verify_oauth2_token(
                data.token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
            email = idinfo.get("email")
            name = idinfo.get("name")
            social_id = idinfo.get("sub")
            avatar = idinfo.get("picture")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")

    elif data.provider == "facebook":
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"https://graph.facebook.com/me?fields=id,name,email,picture&access_token={data.token}"
                )
                if resp.status_code != 200:
                    raise HTTPException(status_code=400, detail="Invalid Facebook token")
                fb_data = resp.json()
                email = fb_data.get("email")
                name = fb_data.get("name")
                social_id = fb_data.get("id")
                avatar = fb_data.get("picture", {}).get("data", {}).get("url")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Facebook authentication failed: {str(e)}")

    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from social provider")

    email = email.lower()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            name=name or "Social User",
            avatar_url=avatar,
            google_id=social_id if data.provider == "google" else None,
            facebook_id=social_id if data.provider == "facebook" else None,
        )
        db.add(user)
    else:
        # Update social ID if missing
        if data.provider == "google":
            user.google_id = social_id
        else:
            user.facebook_id = social_id
        
        # Update avatar if missing
        if avatar and not user.avatar_url:
            user.avatar_url = avatar
    
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_to_schema(user)
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return user_to_schema(current_user)


class UserUpdate(BaseModel):
    name: str
    email: str
    monthly_income: float = 50000.0


@router.put("/me", response_model=TokenResponse)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check email not taken by someone else
    if data.email != current_user.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

    current_user.name = data.name
    current_user.email = data.email
    current_user.monthly_income = data.monthly_income
    db.commit()
    db.refresh(current_user)

    access_token = create_access_token({"sub": current_user.id})
    refresh_token = create_refresh_token({"sub": current_user.id})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_to_schema(current_user)
    )
