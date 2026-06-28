from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User, Wallet
from app.schemas.auth import UserResponse, WalletResponse
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

SUPPORTED_LANGUAGES = ["en", "es", "fr", "pt", "ar", "sw", "hi", "yo", "ig", "ha"]


class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    preferred_language: str | None = None


@router.get("/me", response_model=UserResponse)
async def get_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.full_name is not None:
        user.full_name = req.full_name.strip() or None
    if req.preferred_language is not None:
        if req.preferred_language not in SUPPORTED_LANGUAGES:
            raise HTTPException(status_code=400, detail="Unsupported language code")
        user.preferred_language = req.preferred_language
    user.updated_at = datetime.now(timezone.utc)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/me/wallet", response_model=WalletResponse)
async def get_wallet(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return {"address": wallet.address, "created_at": wallet.created_at}
