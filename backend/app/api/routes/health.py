"""
Health Analysis routes.

Write transactions are signed and submitted by the user's own wallet on the frontend.
The backend:
  1. Prepares a pending DB record + call args  →  returns {job_id, record_id, method, args}
  2. Accepts the submitted tx_hash via POST /jobs/{id}/submit
  3. Polls GenLayer until finalized, reads the result, stores it
  4. Serves the result via GET /jobs/{id}  (or /labs/{id}, /symptoms/{id}, /medications/{id})
"""
import json
import uuid
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db, AsyncSessionLocal
from app.core.logging import logger
from app.models.user import (
    User, LabAnalysis, SymptomAnalysis, HealthTimeline, Medication, Document, AnalysisJob
)
from app.schemas.health import (
    LabAnalysisRequest, SymptomRequest, TimelineEntryRequest,
    MedicationRequest, ReportSummaryRequest, TriageRequest,
    GenericHealthRequest, AnalysisResponse,
)
from app.api.dependencies import get_current_user
from app.services.ocr.ocr_service import (
    extract_text_from_pdf, extract_text_from_image, extract_text_from_docx,
    extract_text_from_plain, extract_lab_markers, detect_file_type
)

EXTRACTORS = {
    "pdf": extract_text_from_pdf,
    "image": extract_text_from_image,
    "docx": extract_text_from_docx,
    "text": extract_text_from_plain,
}
from app.services.genlayer.client import genlayer_client

router = APIRouter(prefix="/health", tags=["Health Analysis"])

DISCLAIMER = (
    "This analysis is for educational purposes only and does not constitute "
    "medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider."
)

CONTRACT_ADDRESS = None  # lazy-loaded from settings


def _contract_address() -> str:
    from app.core.config import settings
    return settings.GENLAYER_CONTRACT_ADDRESS


# ─────────────────────────────────────────────────────────────────────────────
# Background readers — called after the user's tx is finalized on-chain
# ─────────────────────────────────────────────────────────────────────────────

async def _bg_read_lab(analysis_id: str, record_id: str, tx_hash: str):
    try:
        finalized = await genlayer_client._poll_finalized(tx_hash, "lab_analysis")
        if finalized:
            result = await genlayer_client._read("get_lab_analysis", [record_id])
            status = "complete"
        else:
            result = {"error": "Consensus not reached"}
            status = "error"
    except Exception as exc:
        logger.error("bg_read_lab_error", error=str(exc))
        result, status = {"error": str(exc)}, "error"
    async with AsyncSessionLocal() as db:
        row = await db.get(LabAnalysis, UUID(analysis_id))
        if row:
            row.genlayer_tx_hash = tx_hash
            row.consensus_output = result if isinstance(result, dict) else {"raw": str(result)}
            row.risk_level = (result or {}).get("risk_level") if isinstance(result, dict) else None
            row.status = status
            row.updated_at = datetime.now(timezone.utc)
            await db.commit()


async def _bg_read_symptom(analysis_id: str, record_id: str, tx_hash: str):
    try:
        finalized = await genlayer_client._poll_finalized(tx_hash, "symptom_analysis")
        result = await genlayer_client._read("get_symptom_analysis", [record_id]) if finalized else {"error": "Consensus not reached"}
        status = "complete" if finalized else "error"
    except Exception as exc:
        result, status = {"error": str(exc)}, "error"
    async with AsyncSessionLocal() as db:
        row = await db.get(SymptomAnalysis, UUID(analysis_id))
        if row:
            row.genlayer_tx_hash = tx_hash
            stored = result if isinstance(result, dict) else {"raw": str(result)}
            if "record_id" not in stored:
                stored["record_id"] = record_id
            row.consensus_output = stored
            row.status = status
            row.updated_at = datetime.now(timezone.utc)
            await db.commit()


async def _bg_read_medication(med_id: str, record_id: str, tx_hash: str):
    try:
        finalized = await genlayer_client._poll_finalized(tx_hash, "medication_explain")
        result = await genlayer_client._read("get_medication_analysis", [record_id]) if finalized else {"error": "Consensus not reached"}
        status = "complete" if finalized else "error"
    except Exception as exc:
        result, status = {"error": str(exc)}, "error"
    async with AsyncSessionLocal() as db:
        row = await db.get(Medication, UUID(med_id))
        if row:
            row.genlayer_tx_hash = tx_hash
            stored = result if isinstance(result, dict) else {"raw": str(result)}
            if "record_id" not in stored:
                stored["record_id"] = record_id
            row.consensus_output = stored
            row.status = status
            row.updated_at = datetime.now(timezone.utc)
            await db.commit()


async def _bg_read_job(job_id: str, read_method: str, record_id: str, tx_hash: str):
    try:
        finalized = await genlayer_client._poll_finalized(tx_hash, job_id[:8])
        result = await genlayer_client._read(read_method, [record_id]) if finalized else {"error": "Consensus not reached"}
        status = "complete" if finalized else "error"
    except Exception as exc:
        result, status = {"error": str(exc)}, "error"
    async with AsyncSessionLocal() as db:
        row = await db.get(AnalysisJob, UUID(job_id))
        if row:
            row.genlayer_tx_hash = tx_hash
            stored_result = result if isinstance(result, dict) else {"raw": str(result)}
            # Always preserve record_id so retry-read can use it
            old = row.result or {}
            if "record_id" not in stored_result and old.get("record_id"):
                stored_result["record_id"] = old["record_id"]
            row.result = stored_result
            row.status = status
            row.updated_at = datetime.now(timezone.utc)
            await db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# Lab file upload (no GenLayer — just OCR extraction)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/labs/upload")
async def upload_lab_document(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")
    filename = file.filename or "document"
    file_type = detect_file_type(content)
    if file_type is None:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a PDF, DOCX, plain text/CSV, "
                   "or an image (JPEG, PNG, TIFF, BMP, WEBP, HEIC).",
        )
    try:
        ocr_text = await EXTRACTORS[file_type](content)
    except Exception:
        logger.exception("ocr_extraction_failed", filename=filename)
        raise HTTPException(status_code=422, detail="Could not read this file. It may be corrupted or unsupported.")
    markers = extract_lab_markers(ocr_text)
    now = datetime.now(timezone.utc)
    doc = Document(user_id=user.id, filename=filename, file_type=file_type,
                   ocr_text=ocr_text, extracted_data={"markers": markers},
                   upload_source="web", created_at=now)
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return {"document_id": str(doc.id), "extracted_markers": markers, "ocr_preview": ocr_text[:500]}


# ─────────────────────────────────────────────────────────────────────────────
# Lab Analysis — prepare + submit
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/labs/analyze", status_code=202)
async def analyze_labs(
    req: LabAnalysisRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return call args for the frontend to sign + submit."""
    record_id = uuid.uuid4().hex
    user_ref = str(user.id)[:12]
    markers = [m.model_dump(exclude_none=True) for m in req.markers]
    markers_json = json.dumps(markers)
    context_json = json.dumps(req.context or {})
    import hashlib
    ph = hashlib.sha256(f"{record_id}:{user_ref}:{markers_json}".encode()).hexdigest()

    now = datetime.now(timezone.utc)
    analysis = LabAnalysis(
        id=uuid.uuid4(),
        user_id=user.id,
        raw_input={"markers": markers, "record_id": record_id},
        status="pending",
        created_at=now,
    )
    db.add(analysis)
    await db.commit()

    aid = str(analysis.id)
    return {
        "id": aid,
        "status": "pending",
        "contract_address": _contract_address(),
        "method": "analyze_lab_results",
        "args": [record_id, user_ref, markers_json, context_json, ph],
        "record_id": record_id,
        "submit_url": f"/health/labs/{aid}/submit",
        "poll_url": f"/health/labs/{aid}",
    }


class SubmitTxRequest(BaseModel):
    tx_hash: str
    record_id: str | None = None


@router.post("/labs/{analysis_id}/submit")
async def submit_lab_tx(
    analysis_id: UUID,
    req: SubmitTxRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(
        select(LabAnalysis).where(LabAnalysis.id == analysis_id, LabAnalysis.user_id == user.id)
    )
    analysis = row.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Not found")
    record_id = req.record_id or (analysis.raw_input or {}).get("record_id", "")
    analysis.genlayer_tx_hash = req.tx_hash
    await db.commit()
    background_tasks.add_task(_bg_read_lab, str(analysis_id), record_id, req.tx_hash)
    return {"status": "polling"}


@router.get("/labs")
async def list_labs(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LabAnalysis).where(LabAnalysis.user_id == user.id)
        .order_by(desc(LabAnalysis.created_at)).limit(50)
    )
    rows = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "status": r.status,
            "tx_hash": r.genlayer_tx_hash,
            "result": r.consensus_output,
            "created_at": r.created_at,
        }
        for r in rows
    ]


@router.get("/labs/{analysis_id}")
async def get_lab_analysis(
    analysis_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LabAnalysis).where(LabAnalysis.id == analysis_id, LabAnalysis.user_id == user.id)
    )
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": str(a.id),
        "status": a.status,
        "tx_hash": a.genlayer_tx_hash,
        "result": a.consensus_output,
        "created_at": a.created_at,
        "disclaimer": DISCLAIMER,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Symptom Analysis
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/symptoms/analyze", status_code=202)
async def analyze_symptoms(
    req: SymptomRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import hashlib
    record_id = uuid.uuid4().hex
    user_ref = str(user.id)[:12]
    symptoms = req.symptoms_as_list()
    context = {"duration": req.duration, "severity": req.severity, **(req.context or {})}
    symptoms_json = json.dumps(symptoms)
    context_json = json.dumps(context)
    ph = hashlib.sha256(f"{record_id}:{user_ref}:{symptoms_json}".encode()).hexdigest()

    now = datetime.now(timezone.utc)
    analysis = SymptomAnalysis(
        id=uuid.uuid4(),
        user_id=user.id,
        symptoms={"symptoms": symptoms, "record_id": record_id, **context},
        status="pending",
        created_at=now,
    )
    db.add(analysis)
    await db.commit()

    sid = str(analysis.id)
    return {
        "id": sid,
        "status": "pending",
        "contract_address": _contract_address(),
        "method": "analyze_symptoms",
        "args": [record_id, user_ref, symptoms_json, context_json, ph],
        "record_id": record_id,
        "submit_url": f"/health/symptoms/{sid}/submit",
        "poll_url": f"/health/symptoms/{sid}",
    }


@router.post("/symptoms/{analysis_id}/submit")
async def submit_symptom_tx(
    analysis_id: UUID,
    req: SubmitTxRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(
        select(SymptomAnalysis).where(SymptomAnalysis.id == analysis_id, SymptomAnalysis.user_id == user.id)
    )
    analysis = row.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Not found")
    record_id = req.record_id or (analysis.symptoms or {}).get("record_id", "")
    analysis.genlayer_tx_hash = req.tx_hash
    await db.commit()
    background_tasks.add_task(_bg_read_symptom, str(analysis_id), record_id, req.tx_hash)
    return {"status": "polling"}


@router.get("/symptoms")
async def list_symptom_analyses(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SymptomAnalysis).where(SymptomAnalysis.user_id == user.id)
        .order_by(desc(SymptomAnalysis.created_at)).limit(50)
    )
    rows = result.scalars().all()
    return [{"id": str(r.id), "status": r.status, "tx_hash": r.genlayer_tx_hash,
             "result": r.consensus_output, "created_at": r.created_at} for r in rows]


@router.get("/symptoms/{analysis_id}")
async def get_symptom_analysis(
    analysis_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SymptomAnalysis).where(SymptomAnalysis.id == analysis_id, SymptomAnalysis.user_id == user.id)
    )
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": str(a.id), "status": a.status, "tx_hash": a.genlayer_tx_hash,
            "result": a.consensus_output, "created_at": a.created_at, "disclaimer": DISCLAIMER}


# ─────────────────────────────────────────────────────────────────────────────
# Timeline (no GenLayer)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/timeline/add")
async def add_timeline_entry(
    req: TimelineEntryRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    entry = HealthTimeline(user_id=user.id, metric_type=req.metric_type, value=req.value,
                           unit=req.unit, recorded_at=req.recorded_at, source=req.source,
                           notes=req.notes, created_at=now)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/timeline")
async def get_timeline(
    metric_type: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(HealthTimeline).where(HealthTimeline.user_id == user.id)
    if metric_type:
        query = query.where(HealthTimeline.metric_type == metric_type)
    query = query.order_by(desc(HealthTimeline.recorded_at)).limit(200)
    result = await db.execute(query)
    return result.scalars().all()


# ─────────────────────────────────────────────────────────────────────────────
# Medications
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/medications/analyze", status_code=202)
async def analyze_medications(
    req: MedicationRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import hashlib
    record_id = uuid.uuid4().hex
    user_ref = str(user.id)[:12]
    meds_json = json.dumps(req.medications)
    ph = hashlib.sha256(f"{record_id}:{user_ref}:{meds_json}".encode()).hexdigest()

    now = datetime.now(timezone.utc)
    med = Medication(
        id=uuid.uuid4(),
        user_id=user.id,
        medication_name=", ".join(req.medications),
        status="pending",
        created_at=now,
    )
    db.add(med)
    await db.commit()

    mid = str(med.id)
    return {
        "id": mid,
        "status": "pending",
        "contract_address": _contract_address(),
        "method": "explain_medications",
        "args": [record_id, user_ref, meds_json, "{}", ph],
        "record_id": record_id,
        "submit_url": f"/health/medications/{mid}/submit",
        "poll_url": f"/health/medications/{mid}",
    }


@router.post("/medications/{med_id}/submit")
async def submit_medication_tx(
    med_id: UUID,
    req: SubmitTxRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(
        select(Medication).where(Medication.id == med_id, Medication.user_id == user.id)
    )
    med = row.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=404, detail="Not found")
    med.genlayer_tx_hash = req.tx_hash
    await db.commit()
    background_tasks.add_task(_bg_read_medication, str(med_id), req.record_id or "", req.tx_hash)
    return {"status": "polling"}


@router.get("/medications")
async def list_medications(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Medication).where(Medication.user_id == user.id)
        .order_by(desc(Medication.created_at)).limit(50)
    )
    rows = result.scalars().all()
    return [{"id": str(r.id), "status": r.status, "tx_hash": r.genlayer_tx_hash,
             "result": r.consensus_output, "medication_name": r.medication_name,
             "created_at": r.created_at} for r in rows]


@router.get("/medications/{med_id}")
async def get_medication(
    med_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Medication).where(Medication.id == med_id, Medication.user_id == user.id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": str(m.id), "status": m.status, "tx_hash": m.genlayer_tx_hash,
            "result": m.consensus_output, "created_at": m.created_at, "disclaimer": DISCLAIMER}


@router.post("/medications/{med_id}/retry-read")
async def retry_medication_read(
    med_id: UUID,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Medication).where(Medication.id == med_id, Medication.user_id == user.id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    if not m.genlayer_tx_hash:
        raise HTTPException(status_code=400, detail="No tx_hash on record")
    stored = m.consensus_output or {}
    record_id = stored.get("record_id", "")
    m.status = "pending"
    await db.commit()
    background_tasks.add_task(_bg_read_medication, str(m.id), record_id, m.genlayer_tx_hash)
    return {"status": "retrying"}


@router.post("/symptoms/{analysis_id}/retry-read")
async def retry_symptom_read(
    analysis_id: UUID,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SymptomAnalysis).where(SymptomAnalysis.id == analysis_id, SymptomAnalysis.user_id == user.id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    if not a.genlayer_tx_hash:
        raise HTTPException(status_code=400, detail="No tx_hash on record")
    stored = a.consensus_output or {}
    record_id = stored.get("record_id", "")
    a.status = "pending"
    await db.commit()
    background_tasks.add_task(_bg_read_symptom, str(a.id), record_id, a.genlayer_tx_hash)
    return {"status": "retrying"}


# ─────────────────────────────────────────────────────────────────────────────
# Generic AnalysisJob endpoints (reports, triage, doctor-visit, query, trend, prevention, route)
# ─────────────────────────────────────────────────────────────────────────────

JOB_READ_METHODS = {
    "report":        "get_report_summary",
    "triage":        "get_triage",
    "doctor_visit":  "get_doctor_visit_prep",
    "health_query":  "get_health_query_response",
    "trend":         "get_health_trend",
    "prevention":    "get_prevention_plan",
    "route":         "get_routing_result",
}


def _make_job(user_id, job_type: str, args: list, record_id: str) -> AnalysisJob:
    return AnalysisJob(
        id=uuid.uuid4(),
        user_id=user_id,
        job_type=job_type,
        status="pending",
        result={"record_id": record_id, "args": args},
        created_at=datetime.now(timezone.utc),
    )


@router.get("/jobs")
async def list_analysis_jobs(
    job_type: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(AnalysisJob).where(AnalysisJob.user_id == user.id)
    if job_type:
        query = query.where(AnalysisJob.job_type == job_type)
    query = query.order_by(desc(AnalysisJob.created_at)).limit(50)
    result = await db.execute(query)
    rows = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "job_type": r.job_type,
            "status": r.status,
            "tx_hash": r.genlayer_tx_hash,
            "result": {k: v for k, v in (r.result or {}).items() if k not in ("record_id", "args")}
                      if r.status == "complete" else None,
            "created_at": r.created_at,
        }
        for r in rows
    ]


@router.get("/jobs/{job_id}")
async def get_analysis_job(
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await db.get(AnalysisJob, UUID(job_id))
    if not row or row.user_id != user.id:
        raise HTTPException(status_code=404, detail="Job not found")
    result = row.result or {}
    # Don't expose internal record_id/args when complete
    if row.status == "complete":
        result = {k: v for k, v in result.items() if k not in ("record_id", "args")}
    return {
        "id": str(row.id),
        "status": row.status,
        "tx_hash": row.genlayer_tx_hash,
        "result": result,
        "job_type": row.job_type,
        "created_at": row.created_at,
        "contract_address": _contract_address(),
        "method": f"{row.job_type}_method",
    }


@router.post("/jobs/{job_id}/retry-read")
async def retry_job_read(
    job_id: str,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Re-fetch result from contract for a job that returned null/raw."""
    row = await db.get(AnalysisJob, UUID(job_id))
    if not row or row.user_id != user.id:
        raise HTTPException(status_code=404, detail="Job not found")
    if not row.genlayer_tx_hash:
        raise HTTPException(status_code=400, detail="No tx_hash on record")
    read_method = JOB_READ_METHODS.get(row.job_type, "")
    if not read_method:
        raise HTTPException(status_code=400, detail=f"Unknown job type: {row.job_type}")
    stored = row.result or {}
    record_id = stored.get("record_id", "")
    # Also check job args stored in result
    if not record_id:
        args = stored.get("args", [])
        record_id = args[0] if args else ""
    row.status = "pending"
    await db.commit()
    background_tasks.add_task(_bg_read_job, job_id, read_method, record_id, row.genlayer_tx_hash)
    return {"status": "retrying"}


@router.post("/jobs/{job_id}/submit")
async def submit_job_tx(
    job_id: str,
    req: SubmitTxRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await db.get(AnalysisJob, UUID(job_id))
    if not row or row.user_id != user.id:
        raise HTTPException(status_code=404, detail="Job not found")
    read_method = JOB_READ_METHODS.get(row.job_type, "")
    if not read_method:
        raise HTTPException(status_code=400, detail=f"Unknown job type: {row.job_type}")
    record_id = req.record_id or (row.result or {}).get("record_id", "")
    row.genlayer_tx_hash = req.tx_hash
    await db.commit()
    background_tasks.add_task(_bg_read_job, job_id, read_method, record_id, req.tx_hash)
    return {"status": "polling"}


# ─────────────────────────────────────────────────────────────────────────────
# Individual job-prepare endpoints — return call args for frontend to sign
# ─────────────────────────────────────────────────────────────────────────────

def _job_response(job: AnalysisJob, method: str, args: list, record_id: str):
    jid = str(job.id)
    return {
        "id": jid,
        "status": "pending",
        "contract_address": _contract_address(),
        "method": method,
        "args": args,
        "record_id": record_id,
        "submit_url": f"/health/jobs/{jid}/submit",
        "poll_url": f"/health/jobs/{jid}",
    }


@router.post("/reports/summarize", status_code=202)
async def summarize_report(
    req: ReportSummaryRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import hashlib
    record_id = uuid.uuid4().hex
    user_ref = str(user.id)[:12]
    report_type = req.report_type or "other"
    ph = hashlib.sha256(f"{record_id}:{user_ref}:{req.report_text[:200]}".encode()).hexdigest()
    args = [record_id, user_ref, req.report_text, report_type, ph]
    job = _make_job(user.id, "report", args, record_id)
    db.add(job); await db.commit()
    return _job_response(job, "summarize_report", args, record_id)


@router.post("/triage", status_code=202)
async def health_triage(
    req: TriageRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import hashlib
    record_id = uuid.uuid4().hex
    user_ref = str(user.id)[:12]
    input_data = {"symptoms": req.symptoms or [], "history_notes": req.history_notes or ""}
    input_json = json.dumps(input_data)
    ph = hashlib.sha256(f"{record_id}:{user_ref}:{input_json[:200]}".encode()).hexdigest()
    args = [record_id, user_ref, input_json, ph]
    job = _make_job(user.id, "triage", args, record_id)
    db.add(job); await db.commit()
    return _job_response(job, "triage_patient", args, record_id)


@router.post("/doctor-visit/prepare", status_code=202)
async def prepare_doctor_visit(
    req: GenericHealthRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import hashlib
    record_id = uuid.uuid4().hex
    user_ref = str(user.id)[:12]
    context_json = json.dumps(req.data or {})
    ph = hashlib.sha256(f"{record_id}:{user_ref}:{context_json[:200]}".encode()).hexdigest()
    args = [record_id, user_ref, context_json, ph]
    job = _make_job(user.id, "doctor_visit", args, record_id)
    db.add(job); await db.commit()
    return _job_response(job, "prepare_doctor_visit", args, record_id)


@router.post("/query", status_code=202)
async def health_query(
    req: GenericHealthRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import hashlib
    d = req.data or {}
    question = d.get("question", "")
    language = d.get("language", "English")
    if not question:
        raise HTTPException(status_code=400, detail="question is required")
    record_id = uuid.uuid4().hex
    user_ref = str(user.id)[:12]
    ph = hashlib.sha256(f"{record_id}:{user_ref}:{question[:200]}".encode()).hexdigest()
    args = [record_id, user_ref, question, language, ph]
    job = _make_job(user.id, "health_query", args, record_id)
    db.add(job); await db.commit()
    return _job_response(job, "answer_health_query", args, record_id)


@router.post("/trend/interpret", status_code=202)
async def interpret_trend(
    req: GenericHealthRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import hashlib
    d = req.data or {}
    record_id = uuid.uuid4().hex
    user_ref = str(user.id)[:12]
    metric_type = str(d.get("metric", d.get("metric_type", "general")))
    readings = d.get("readings", d.get("datapoints", []))
    datapoints_json = json.dumps(readings)
    patient_context_json = json.dumps({k: v for k, v in d.items() if k not in ("metric", "metric_type", "readings", "datapoints")})
    ph = hashlib.sha256(f"{record_id}:{user_ref}:{metric_type}:{datapoints_json[:200]}".encode()).hexdigest()
    args = [record_id, user_ref, metric_type, datapoints_json, patient_context_json, ph]
    job = _make_job(user.id, "trend", args, record_id)
    db.add(job); await db.commit()
    return _job_response(job, "interpret_health_trend", args, record_id)


@router.post("/prevention/plan", status_code=202)
async def prevention_plan(
    req: GenericHealthRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import hashlib
    record_id = uuid.uuid4().hex
    user_ref = str(user.id)[:12]
    input_json = json.dumps(req.data or {})
    ph = hashlib.sha256(f"{record_id}:{user_ref}:{input_json[:200]}".encode()).hexdigest()
    args = [record_id, user_ref, input_json, ph]
    job = _make_job(user.id, "prevention", args, record_id)
    db.add(job); await db.commit()
    return _job_response(job, "generate_prevention_plan", args, record_id)


@router.post("/route", status_code=202)
async def route_to_care(
    req: GenericHealthRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import hashlib
    record_id = uuid.uuid4().hex
    user_ref = str(user.id)[:12]
    situation_json = json.dumps(req.data or {})
    ph = hashlib.sha256(f"{record_id}:{user_ref}:{situation_json[:200]}".encode()).hexdigest()
    args = [record_id, user_ref, situation_json, ph]
    job = _make_job(user.id, "route", args, record_id)
    db.add(job); await db.commit()
    return _job_response(job, "route_to_care", args, record_id)


# ─────────────────────────────────────────────────────────────────────────────
# Documents
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/documents")
async def list_documents(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.user_id == user.id).order_by(desc(Document.created_at))
    )
    docs = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "filename": d.filename,
            "file_type": d.file_type,
            "created_at": d.created_at,
            "has_ocr": bool(d.ocr_text),
            "has_extracted_data": bool(d.extracted_data),
        }
        for d in docs
    ]
