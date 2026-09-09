"""Authentication router."""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database.database import get_db
from app.models.models import User, AuditLog
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from app.auth.auth import hash_password, verify_password, create_access_token, get_current_user
from app.config import get_settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    """Register a new user account."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        preferred_language=payload.preferred_language,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit log
    log = AuditLog(user_id=user.id, action="user_registered",
                   details={"email": user.email},
                   ip_address=request.client.host if request.client else None)
    db.add(log)
    db.commit()

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = db.query(User).filter(User.email == payload.email, User.is_active == True).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Audit log
    log = AuditLog(user_id=user.id, action="user_login",
                   details={"email": user.email},
                   ip_address=request.client.host if request.client else None)
    db.add(log)
    db.commit()

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/logout")
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout user (client should discard token)."""
    log = AuditLog(user_id=current_user.id, action="user_logout",
                   details={}, ip_address=request.client.host if request.client else None)
    db.add(log)
    db.commit()
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update current user profile."""
    allowed_fields = {"name", "preferred_language"}
    for field, value in payload.items():
        if field in allowed_fields:
            setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
