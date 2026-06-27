from datetime import datetime
from uuid import UUID
from typing import Any
from pydantic import BaseModel, ConfigDict

DISCLAIMER = (
    "This analysis is for educational purposes only and does not constitute "
    "medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider."
)


class LabMarker(BaseModel):
    name: str
    value: float | str
    unit: str | None = None
    reference_range: str | None = None


class LabAnalysisRequest(BaseModel):
    markers: list[LabMarker]
    context: dict[str, Any] | None = None


class SymptomRequest(BaseModel):
    symptoms: list[str]
    duration: str | None = None
    severity: str | None = None
    context: dict[str, Any] | None = None


class TimelineEntryRequest(BaseModel):
    metric_type: str
    value: float
    unit: str | None = None
    recorded_at: datetime
    source: str | None = "manual"
    notes: str | None = None


class MedicationRequest(BaseModel):
    medications: list[str]


class ReportSummaryRequest(BaseModel):
    report_text: str
    report_type: str | None = None


class TriageRequest(BaseModel):
    symptoms: list[str] | None = None
    lab_analysis_id: str | None = None
    history_notes: str | None = None


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    risk_level: str | None
    genlayer_tx_hash: str | None
    consensus_output: dict[str, Any] | None
    created_at: datetime
