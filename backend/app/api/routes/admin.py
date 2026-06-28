from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User, LabAnalysis, SymptomAnalysis, HealthTimeline, Medication
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar()
    verified_users = (await db.execute(select(func.count()).select_from(User).where(User.is_verified == True))).scalar()
    total_labs = (await db.execute(select(func.count()).select_from(LabAnalysis))).scalar()
    total_symptoms = (await db.execute(select(func.count()).select_from(SymptomAnalysis))).scalar()
    total_timeline = (await db.execute(select(func.count()).select_from(HealthTimeline))).scalar()
    total_meds = (await db.execute(select(func.count()).select_from(Medication))).scalar()

    return {
        "users": {"total": total_users, "verified": verified_users},
        "analyses": {
            "lab": total_labs,
            "symptoms": total_symptoms,
            "timeline": total_timeline,
            "medications": total_meds,
        },
    }


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


class UpdateUserRequest(BaseModel):
    role: str | None = None
    is_active: bool | None = None
    is_verified: bool | None = None
    new_password: str | None = None


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    req: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    from uuid import UUID
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.role is not None:
        user.role = req.role
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.is_verified is not None:
        user.is_verified = req.is_verified
    if req.new_password is not None:
        user.password_hash = hash_password(req.new_password)
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "User updated"}
