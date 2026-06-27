from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.user import (
    User, Wallet, LabAnalysis, SymptomAnalysis, HealthTimeline, Medication, Document
)
from app.schemas.health import (
    LabAnalysisRequest, SymptomRequest, TimelineEntryRequest,
    MedicationRequest, ReportSummaryRequest, TriageRequest, AnalysisResponse,
)
from app.api.dependencies import get_verified_user
from app.services.ocr.ocr_service import (
    extract_text_from_pdf, extract_text_from_image, extract_lab_markers
)

router = APIRouter(prefix="/health", tags=["Health Analysis"])

DISCLAIMER = (
    "This analysis is for educational purposes only and does not constitute "
    "medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider."
)

NULL_ADDRESS = "0x0000000000000000000000000000000000000000"


@router.post("/labs/upload")
async def upload_lab_document(
    file: UploadFile = File(...),
    user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    filename = file.filename or "document"
    file_type = "pdf" if filename.lower().endswith(".pdf") else "image"

    if file_type == "pdf":
        ocr_text = await extract_text_from_pdf(content)
    else:
        ocr_text = await extract_text_from_image(content)

    markers = extract_lab_markers(ocr_text)
    now = datetime.now(timezone.utc)

    doc = Document(
        user_id=user.id,
        filename=filename,
        file_type=file_type,
        ocr_text=ocr_text,
        extracted_data={"markers": markers},
        upload_source="web",
        created_at=now,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return {
        "document_id": str(doc.id),
        "extracted_markers": markers,
        "ocr_preview": ocr_text[:500],
    }


@router.post("/labs/analyze", response_model=AnalysisResponse)
async def analyze_labs(
    req: LabAnalysisRequest,
    user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    result = req.genlayer_result or {}
    status = "complete" if req.tx_hash else "pending"

    analysis = LabAnalysis(
        user_id=user.id,
        raw_input={"markers": [m.model_dump() for m in req.markers]},
        genlayer_tx_hash=req.tx_hash,
        consensus_output=result,
        risk_level=(result).get("risk_level", "unknown"),
        status=status,
        created_at=now,
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis


@router.get("/labs", response_model=list[AnalysisResponse])
async def list_labs(
    user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LabAnalysis)
        .where(LabAnalysis.user_id == user.id)
        .order_by(desc(LabAnalysis.created_at))
        .limit(50)
    )
    return result.scalars().all()


@router.get("/labs/{analysis_id}", response_model=AnalysisResponse)
async def get_lab_analysis(
    analysis_id: UUID,
    user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LabAnalysis).where(
            LabAnalysis.id == analysis_id, LabAnalysis.user_id == user.id
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


@router.post("/symptoms/analyze")
async def analyze_symptoms(
    req: SymptomRequest,
    user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    result = req.genlayer_result or {}

    analysis = SymptomAnalysis(
        user_id=user.id,
        symptoms={
            "symptoms": req.symptoms_as_list(),
            "duration": req.duration,
            "severity": req.severity,
        },
        genlayer_tx_hash=req.tx_hash,
        consensus_output=result,
        risk_level=result.get("risk_level"),
        severity_level=result.get("severity"),
        care_recommendation=result.get("care_recommendation"),
        created_at=now,
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return {
        "id": str(analysis.id),
        "tx_hash": req.tx_hash,
        "result": result,
        "disclaimer": DISCLAIMER,
    }


@router.post("/timeline/add")
async def add_timeline_entry(
    req: TimelineEntryRequest,
    user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    entry = HealthTimeline(
        user_id=user.id,
        metric_type=req.metric_type,
        value=req.value,
        unit=req.unit,
        recorded_at=req.recorded_at,
        source=req.source,
        notes=req.notes,
        created_at=now,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/timeline")
async def get_timeline(
    metric_type: str | None = None,
    user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(HealthTimeline).where(HealthTimeline.user_id == user.id)
    if metric_type:
        query = query.where(HealthTimeline.metric_type == metric_type)
    query = query.order_by(desc(HealthTimeline.recorded_at)).limit(200)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/medications/analyze")
async def analyze_medications(
    req: MedicationRequest,
    user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    result = req.genlayer_result or {}

    med = Medication(
        user_id=user.id,
        medication_name=", ".join(req.medications),
        genlayer_tx_hash=req.tx_hash,
        consensus_output=result,
        created_at=now,
    )
    db.add(med)
    await db.commit()
    await db.refresh(med)
    return {
        "id": str(med.id),
        "tx_hash": req.tx_hash,
        "result": result,
        "disclaimer": DISCLAIMER,
    }


@router.post("/reports/summarize")
async def summarize_report(
    req: ReportSummaryRequest,
    user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    return {
        "tx_hash": req.tx_hash,
        "summary": req.genlayer_result or {},
        "disclaimer": DISCLAIMER,
    }


@router.post("/triage")
async def health_triage(
    req: TriageRequest,
    user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    return {
        "tx_hash": req.tx_hash,
        "triage": req.genlayer_result or {},
        "disclaimer": "Triage guidance only. Seek emergency care immediately if symptoms are severe.",
    }
