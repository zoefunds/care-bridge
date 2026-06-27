from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token,
    hash_token, generate_verification_token,
)
from app.core.config import settings
from app.models.user import User, Wallet, EmailVerification
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse,
    VerifyEmailRequest, ForgotPasswordRequest, ResetPasswordRequest,
)
from app.services.wallet.wallet_service import generate_wallet
from app.services.email.email_service import send_verification_email, send_password_reset_email
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    now = datetime.now(timezone.utc)
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        consent_given=True,
        consent_at=now,
        created_at=now,
    )
    db.add(user)
    await db.flush()

    wallet_data = generate_wallet(req.password)
    wallet = Wallet(
        user_id=user.id,
        address=wallet_data["address"],
        encrypted_key=wallet_data["encrypted_key"],
        key_salt=wallet_data["key_salt"],
        key_iv=wallet_data["key_iv"],
        created_at=now,
    )
    db.add(wallet)

    verify_token = generate_verification_token()
    verification = EmailVerification(
        user_id=user.id,
        token=hash_token(verify_token),
        expires_at=now + timedelta(hours=24),
        created_at=now,
    )
    db.add(verification)
    await db.commit()

    await send_verification_email(user.email, user.full_name or user.email, verify_token)

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=str(user.id),
        wallet_address=wallet_data["address"],
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = wallet_result.scalar_one_or_none()

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=str(user.id),
        wallet_address=wallet.address if wallet else "",
    )


@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hash_token(req.token)
    result = await db.execute(
        select(EmailVerification).where(
            EmailVerification.token == token_hash,
            EmailVerification.used == False,
            EmailVerification.expires_at > datetime.now(timezone.utc),
        )
    )
    verification = result.scalar_one_or_none()
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    verification.used = True
    user_result = await db.execute(select(User).where(User.id == verification.user_id))
    user = user_result.scalar_one()
    user.is_verified = True
    await db.commit()
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if user and not user.is_verified:
        now = datetime.now(timezone.utc)
        verify_token = generate_verification_token()
        verification = EmailVerification(
            user_id=user.id,
            token=hash_token(verify_token),
            expires_at=now + timedelta(hours=24),
            created_at=now,
        )
        db.add(verification)
        await db.commit()
        await send_verification_email(user.email, user.full_name or user.email, verify_token)
    return {"message": "If that email exists and is unverified, a new link has been sent"}


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if user:
        now = datetime.now(timezone.utc)
        token = generate_verification_token()
        verification = EmailVerification(
            user_id=user.id,
            token=hash_token(token),
            expires_at=now + timedelta(hours=1),
            created_at=now,
        )
        db.add(verification)
        await db.commit()
        await send_password_reset_email(user.email, user.full_name or user.email, token)
    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hash_token(req.token)
    result = await db.execute(
        select(EmailVerification).where(
            EmailVerification.token == token_hash,
            EmailVerification.used == False,
            EmailVerification.expires_at > datetime.now(timezone.utc),
        )
    )
    verification = result.scalar_one_or_none()
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user_result = await db.execute(select(User).where(User.id == verification.user_id))
    user = user_result.scalar_one()
    user.password_hash = hash_password(req.new_password)
    verification.used = True
    await db.commit()
    return {"message": "Password reset successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user
