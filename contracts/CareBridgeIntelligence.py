# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""
Care Bridge Intelligence Contract
GenLayer Intelligent Contract — Production v1.0

10 health intelligence features powered by multi-model LLM consensus:
  1. Lab Analysis       — interpret blood/urine/metabolic panels
  2. Symptom Analysis   — structured triage from symptom input
  3. Report Summarizer  — plain-language medical report summaries
  4. Medication Explainer — drug info, interactions, side effects
  5. Doctor Visit Prep  — pre-visit question generation
  6. Preventive Coach   — personalised prevention recommendations
  7. Triage Engine      — urgency classification with routing
  8. Multilingual       — health query answering in any language
  9. Health Trend       — timeline metric interpretation
 10. Telemedicine Route — match patient to correct care channel

DISCLAIMER: Care Bridge provides educational health information only.
It does not diagnose, prescribe, or replace professional medical advice.
Always consult a qualified healthcare professional for medical decisions.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha256
import json

from genlayer import *


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DISCLAIMER = (
    "Care Bridge provides educational health information only and does not "
    "constitute medical diagnosis, prescription, or professional medical advice. "
    "Always consult a qualified healthcare professional."
)

RISK_LEVELS = ("LOW", "MODERATE", "HIGH", "CRITICAL")
URGENCY_LEVELS = ("ROUTINE", "SOON", "URGENT", "EMERGENCY")
CARE_CHANNELS = ("SELF_CARE", "TELEHEALTH", "PRIMARY_CARE", "URGENT_CARE", "EMERGENCY_ROOM", "SPECIALIST")
CONTRACT_VERSION = "1.0.0"


# ---------------------------------------------------------------------------
# Storage dataclasses
# ---------------------------------------------------------------------------

@allow_storage
@dataclass
class LabRecord:
    record_id: str
    user_ref: str
    markers_json: str
    analysis_json: str
    risk_level: str
    flags_json: str
    created_at: str
    disclaimer: str


@allow_storage
@dataclass
class SymptomRecord:
    record_id: str
    user_ref: str
    symptoms_json: str
    analysis_json: str
    triage_level: str
    urgency: str
    care_channel: str
    created_at: str
    disclaimer: str


@allow_storage
@dataclass
class ReportRecord:
    record_id: str
    user_ref: str
    report_type: str
    summary: str
    key_findings_json: str
    action_items_json: str
    created_at: str
    disclaimer: str


@allow_storage
@dataclass
class MedicationRecord:
    record_id: str
    user_ref: str
    medications_json: str
    analysis_json: str
    interaction_risk: str
    created_at: str
    disclaimer: str


@allow_storage
@dataclass
class DoctorVisitRecord:
    record_id: str
    user_ref: str
    context_json: str
    questions_json: str
    prep_notes: str
    created_at: str
    disclaimer: str


@allow_storage
@dataclass
class PreventionRecord:
    record_id: str
    user_ref: str
    profile_json: str
    recommendations_json: str
    risk_factors_json: str
    priority: str
    created_at: str
    disclaimer: str


@allow_storage
@dataclass
class TriageRecord:
    record_id: str
    user_ref: str
    input_json: str
    triage_level: str
    urgency: str
    care_channel: str
    reasoning: str
    red_flags_json: str
    created_at: str
    disclaimer: str


@allow_storage
@dataclass
class MultilingualRecord:
    record_id: str
    user_ref: str
    query: str
    language: str
    response: str
    created_at: str
    disclaimer: str


@allow_storage
@dataclass
class TrendRecord:
    record_id: str
    user_ref: str
    metric_type: str
    datapoints_json: str
    trend: str
    interpretation: str
    recommendation: str
    created_at: str
    disclaimer: str


@allow_storage
@dataclass
class TelemedicineRecord:
    record_id: str
    user_ref: str
    situation_json: str
    recommended_channel: str
    reasoning: str
    estimated_wait: str
    alternatives_json: str
    created_at: str
    disclaimer: str


@allow_storage
@dataclass
class AuditEntry:
    entry_id: str
    record_id: str
    feature: str
    actor: Address
    action: str
    created_at: str
    payload_hash: str


# ---------------------------------------------------------------------------
# Main contract
# ---------------------------------------------------------------------------

class CareBridgeIntelligence(gl.Contract):
    owner: Address
    contract_version: str
    total_analyses: u32

    lab_records: DynArray[LabRecord]
    lab_index: TreeMap[str, u32]

    symptom_records: DynArray[SymptomRecord]
    symptom_index: TreeMap[str, u32]

    report_records: DynArray[ReportRecord]
    report_index: TreeMap[str, u32]

    medication_records: DynArray[MedicationRecord]
    medication_index: TreeMap[str, u32]

    doctor_visit_records: DynArray[DoctorVisitRecord]
    doctor_visit_index: TreeMap[str, u32]

    prevention_records: DynArray[PreventionRecord]
    prevention_index: TreeMap[str, u32]

    triage_records: DynArray[TriageRecord]
    triage_index: TreeMap[str, u32]

    multilingual_records: DynArray[MultilingualRecord]
    multilingual_index: TreeMap[str, u32]

    trend_records: DynArray[TrendRecord]
    trend_index: TreeMap[str, u32]

    telemedicine_records: DynArray[TelemedicineRecord]
    telemedicine_index: TreeMap[str, u32]

    audit_log: DynArray[AuditEntry]

    def __init__(self) -> None:
        self.owner = gl.message.sender_address
        self.contract_version = CONTRACT_VERSION
        self.total_analyses = u32(0)

    # =======================================================================
    # FEATURE 1 — Lab Analysis
    # =======================================================================

    @gl.public.write
    def analyze_lab_results(
        self,
        record_id: str,
        user_ref: str,
        markers_json: str,
        patient_context_json: str,
        payload_hash: str,
    ) -> dict:
        """
        Interpret a blood/urine/metabolic panel against reference ranges.

        markers_json: JSON array of {name, value, unit, reference_range}
        patient_context_json: JSON object with age, sex, known_conditions (all optional)
        """
        self._require_unique("lab", record_id)
        self._validate_inputs(record_id, user_ref, payload_hash)
        if len(markers_json) < 2:
            raise gl.UserError("markers_json is required.")
        if len(markers_json) > 15000:
            raise gl.UserError("markers_json exceeds 15 000 character limit.")

        prompt = f"""You are Care Bridge, an educational medical intelligence system.
A user has submitted laboratory results for educational interpretation.

{self._safety_preamble()}

Patient context (may be empty): {patient_context_json}
Laboratory markers: {markers_json}

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "summary": "2-4 sentence plain-language overview of the overall pattern",
  "risk_level": "one of: LOW, MODERATE, HIGH, CRITICAL",
  "flagged_markers": [
    {{
      "name": "marker name",
      "value": "reported value",
      "unit": "unit",
      "reference_range": "normal range",
      "status": "HIGH or LOW or NORMAL",
      "educational_note": "what this marker measures and why it might be flagged"
    }}
  ],
  "patterns": ["educational pattern or trend observed"],
  "follow_up_suggestions": ["what a patient might discuss with their doctor"],
  "lifestyle_notes": ["general wellness notes related to these markers"],
  "disclaimer": "{DISCLAIMER}"
}}

Rules:
- Never say the patient has or definitely has a disease.
- Use "may suggest", "can be associated with", "worth discussing" language.
- risk_level reflects overall marker deviation pattern, not a diagnosis.
- If all markers are within normal range, risk_level must be LOW.
- Always include the exact disclaimer string.
- Return ONLY the JSON object, no markdown, no extra text."""

        def analyze() -> str:
            return gl.nondet.exec_prompt(prompt)

        result_str = gl.eq_principle.prompt_comparative(
            analyze,
            (
                "Both are valid educational lab result responses. They are equivalent "
                "if both classify the overall risk the same way: either both say the "
                "results are broadly normal (LOW risk) or both say there are noteworthy "
                "deviations (MODERATE, HIGH, or CRITICAL). Any differences in JSON "
                "structure, field names, wording, number of flagged markers, or "
                "specific comments are acceptable and do not affect equivalence."
            ),
        )

        result = self._parse_json_safe(result_str, "lab analysis")
        risk_level = self._coerce_risk(result.get("risk_level", "MODERATE"))
        timestamp = self._now()

        record = LabRecord(
            record_id=record_id,
            user_ref=user_ref,
            markers_json=markers_json,
            analysis_json=json.dumps(result),
            risk_level=risk_level,
            flags_json=json.dumps(result.get("flagged_markers", [])),
            created_at=timestamp,
            disclaimer=DISCLAIMER,
        )
        idx = u32(len(self.lab_records))
        self.lab_records.append(record)
        self.lab_index[record_id] = idx
        self._inc_total()
        self._audit(record_id, "LAB_ANALYSIS", payload_hash)

        return {
            "record_id": record_id,
            "risk_level": risk_level,
            "summary": result.get("summary", ""),
            "flagged_markers": result.get("flagged_markers", []),
            "patterns": result.get("patterns", []),
            "follow_up_suggestions": result.get("follow_up_suggestions", []),
            "lifestyle_notes": result.get("lifestyle_notes", []),
            "disclaimer": DISCLAIMER,
            "created_at": timestamp,
        }

    @gl.public.view
    def get_lab_analysis(self, record_id: str) -> dict:
        idx = self._require_exists("lab", record_id)
        r = self.lab_records[idx]
        return {
            "record_id": r.record_id,
            "user_ref": r.user_ref,
            "risk_level": r.risk_level,
            "analysis": json.loads(r.analysis_json),
            "flags": json.loads(r.flags_json),
            "created_at": r.created_at,
            "disclaimer": DISCLAIMER,
        }

    # =======================================================================
    # FEATURE 2 — Symptom Intelligence
    # =======================================================================

    @gl.public.write
    def analyze_symptoms(
        self,
        record_id: str,
        user_ref: str,
        symptoms_json: str,
        patient_context_json: str,
        payload_hash: str,
    ) -> dict:
        """
        Structured symptom interpretation with care-channel guidance.

        symptoms_json: JSON array of {name, duration, severity (1-10), notes}
        patient_context_json: age, sex, known_conditions, current_medications
        """
        self._require_unique("symptom", record_id)
        self._validate_inputs(record_id, user_ref, payload_hash)
        if len(symptoms_json) < 2:
            raise gl.UserError("symptoms_json is required.")
        if len(symptoms_json) > 12000:
            raise gl.UserError("symptoms_json exceeds 12 000 character limit.")

        prompt = f"""You are Care Bridge, an educational medical intelligence system.
A user has submitted symptoms for educational triage guidance.

{self._safety_preamble()}

Patient context (may be partial or empty): {patient_context_json}
Reported symptoms: {symptoms_json}

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "triage_level": "one of: LOW, MODERATE, HIGH, CRITICAL",
  "urgency": "one of: ROUTINE, SOON, URGENT, EMERGENCY",
  "care_channel": "one of: SELF_CARE, TELEHEALTH, PRIMARY_CARE, URGENT_CARE, EMERGENCY_ROOM, SPECIALIST",
  "summary": "2-3 sentence overview of the symptom pattern",
  "possible_causes": ["educational list of common causes for this symptom cluster — not diagnoses"],
  "red_flags": ["symptoms or features that would escalate urgency if present"],
  "home_care_tips": ["general wellness and comfort measures appropriate for this level"],
  "questions_for_doctor": ["questions to ask if seeking care"],
  "when_to_seek_care": "plain-language description of when to seek professional help",
  "disclaimer": "{DISCLAIMER}"
}}

Rules:
- NEVER say the patient has a specific condition.
- Use educational language: "may be associated with", "common causes include".
- If any symptom suggests life-threatening emergency (chest pain, difficulty breathing, stroke signs, severe trauma), urgency must be EMERGENCY and care_channel must be EMERGENCY_ROOM.
- Return ONLY the JSON object, no markdown, no commentary."""

        def analyze() -> str:
            return gl.nondet.exec_prompt(prompt)

        result_str = gl.eq_principle.prompt_comparative(
            analyze,
            (
                "Both are valid educational symptom guidance responses. They are "
                "equivalent if they agree on the broad urgency level: both routine "
                "(LOW/ROUTINE), both moderate/soon, or both urgent/emergency. Any "
                "differences in JSON structure, field names, list of possible causes, "
                "home care advice, or specific wording are acceptable and do not "
                "affect equivalence."
            ),
        )

        result = self._parse_json_safe(result_str, "symptom analysis")
        triage_level = self._coerce_risk(result.get("triage_level", "MODERATE"))
        urgency = self._coerce_urgency(result.get("urgency", "SOON"))
        care_channel = self._coerce_channel(result.get("care_channel", "PRIMARY_CARE"))
        timestamp = self._now()

        record = SymptomRecord(
            record_id=record_id,
            user_ref=user_ref,
            symptoms_json=symptoms_json,
            analysis_json=json.dumps(result),
            triage_level=triage_level,
            urgency=urgency,
            care_channel=care_channel,
            created_at=timestamp,
            disclaimer=DISCLAIMER,
        )
        idx = u32(len(self.symptom_records))
        self.symptom_records.append(record)
        self.symptom_index[record_id] = idx
        self._inc_total()
        self._audit(record_id, "SYMPTOM_ANALYSIS", payload_hash)

        return {
            "record_id": record_id,
            "triage_level": triage_level,
            "urgency": urgency,
            "care_channel": care_channel,
            "summary": result.get("summary", ""),
            "possible_causes": result.get("possible_causes", []),
            "red_flags": result.get("red_flags", []),
            "home_care_tips": result.get("home_care_tips", []),
            "questions_for_doctor": result.get("questions_for_doctor", []),
            "when_to_seek_care": result.get("when_to_seek_care", ""),
            "disclaimer": DISCLAIMER,
            "created_at": timestamp,
        }

    @gl.public.view
    def get_symptom_analysis(self, record_id: str) -> dict:
        idx = self._require_exists("symptom", record_id)
        r = self.symptom_records[idx]
        analysis = json.loads(r.analysis_json)
        return {
            "record_id": r.record_id,
            "triage_level": r.triage_level,
            "urgency": r.urgency,
            "care_channel": r.care_channel,
            "analysis": analysis,
            "created_at": r.created_at,
            "disclaimer": DISCLAIMER,
        }

    # =======================================================================
    # FEATURE 3 — Report Summarizer
    # =======================================================================

    @gl.public.write
    def summarize_report(
        self,
        record_id: str,
        user_ref: str,
        report_text: str,
        report_type: str,
        payload_hash: str,
    ) -> dict:
        """
        Convert medical report text into plain-language summary.

        report_type: e.g. "radiology", "pathology", "discharge_summary",
                          "blood_panel", "ecg", "specialist_letter", "other"
        """
        self._require_unique("report", record_id)
        self._validate_inputs(record_id, user_ref, payload_hash)
        if len(report_text.strip()) < 20:
            raise gl.UserError("report_text is too short to summarize.")
        if len(report_text) > 20000:
            raise gl.UserError("report_text exceeds 20 000 character limit.")

        prompt = f"""You are Care Bridge, an educational medical intelligence system.
A user has submitted a medical report for plain-language educational summarization.

{self._safety_preamble()}

Report type: {report_type}
Report text:
---
{report_text}
---

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "summary": "3-5 sentence plain-language summary a non-medical person can understand",
  "key_findings": ["each significant finding mentioned in the report, in plain language"],
  "normal_items": ["items mentioned that are within normal limits"],
  "abnormal_items": ["items mentioned that are outside normal limits or flagged"],
  "action_items": ["what the report recommends the patient do or follow up on"],
  "medical_terms_explained": [
    {{
      "term": "medical term used in the report",
      "plain_english": "plain language explanation"
    }}
  ],
  "questions_for_provider": ["questions a patient might ask their provider after reading this"],
  "urgency_signal": "NONE or LOW or MODERATE or HIGH — based on language in the report",
  "disclaimer": "{DISCLAIMER}"
}}

Rules:
- Translate medical jargon into everyday language.
- Do NOT add diagnoses not mentioned in the report.
- Do NOT change or reinterpret numerical values.
- urgency_signal reflects language used in the report (e.g. "urgent follow-up required").
- Return ONLY the JSON object, no markdown."""

        def summarize() -> str:
            return gl.nondet.exec_prompt(prompt)

        result_str = gl.eq_principle.prompt_comparative(
            summarize,
            (
                "Both are valid educational medical report summaries. They are "
                "equivalent if both convey the same overall clinical picture: either "
                "both indicate the report is broadly normal/unremarkable, or both "
                "indicate there are findings that warrant attention. Differences in "
                "JSON structure, field names, wording, number of bullet points, "
                "action items, or specific phrasing are acceptable."
            ),
        )

        result = self._parse_json_safe(result_str, "report summarization")
        timestamp = self._now()

        record = ReportRecord(
            record_id=record_id,
            user_ref=user_ref,
            report_type=report_type,
            summary=result.get("summary", ""),
            key_findings_json=json.dumps(result.get("key_findings", [])),
            action_items_json=json.dumps(result.get("action_items", [])),
            created_at=timestamp,
            disclaimer=DISCLAIMER,
        )
        idx = u32(len(self.report_records))
        self.report_records.append(record)
        self.report_index[record_id] = idx
        self._inc_total()
        self._audit(record_id, "REPORT_SUMMARY", payload_hash)

        return {
            "record_id": record_id,
            "report_type": report_type,
            "summary": result.get("summary", ""),
            "key_findings": result.get("key_findings", []),
            "normal_items": result.get("normal_items", []),
            "abnormal_items": result.get("abnormal_items", []),
            "action_items": result.get("action_items", []),
            "medical_terms_explained": result.get("medical_terms_explained", []),
            "questions_for_provider": result.get("questions_for_provider", []),
            "urgency_signal": result.get("urgency_signal", "NONE"),
            "disclaimer": DISCLAIMER,
            "created_at": timestamp,
        }

    @gl.public.view
    def get_report_summary(self, record_id: str) -> dict:
        idx = self._require_exists("report", record_id)
        r = self.report_records[idx]
        return {
            "record_id": r.record_id,
            "report_type": r.report_type,
            "summary": r.summary,
            "key_findings": json.loads(r.key_findings_json),
            "action_items": json.loads(r.action_items_json),
            "created_at": r.created_at,
            "disclaimer": DISCLAIMER,
        }

    # =======================================================================
    # FEATURE 4 — Medication Explainer
    # =======================================================================

    @gl.public.write
    def explain_medications(
        self,
        record_id: str,
        user_ref: str,
        medications_json: str,
        patient_context_json: str,
        payload_hash: str,
    ) -> dict:
        """
        Provide educational information about medications and potential interactions.

        medications_json: JSON array of {name, dose, frequency, indication}
        """
        self._require_unique("medication", record_id)
        self._validate_inputs(record_id, user_ref, payload_hash)
        if len(medications_json) < 2:
            raise gl.UserError("medications_json is required.")
        if len(medications_json) > 10000:
            raise gl.UserError("medications_json exceeds 10 000 character limit.")

        prompt = f"""You are Care Bridge, an educational medical intelligence system.
A user has submitted a medication list for educational review.

{self._safety_preamble()}

Patient context (optional): {patient_context_json}
Medications: {medications_json}

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "medications": [
    {{
      "name": "medication name",
      "drug_class": "pharmacological class",
      "common_uses": ["what this drug is commonly prescribed for"],
      "how_it_works": "brief mechanism of action in plain language",
      "common_side_effects": ["most common side effects — educational only"],
      "important_warnings": ["important warnings patients should know"],
      "food_interactions": ["notable food or drink interactions"],
      "timing_tips": ["general tips on timing with food, other meds, etc."]
    }}
  ],
  "potential_interactions": [
    {{
      "drugs": ["drug A", "drug B"],
      "interaction_type": "brief type label (e.g. additive CNS depression)",
      "educational_note": "plain-language note about why this combination warrants discussion with a pharmacist or physician",
      "severity_concern": "LOW or MODERATE or HIGH"
    }}
  ],
  "overall_interaction_risk": "LOW or MODERATE or HIGH",
  "pharmacist_questions": ["questions worth raising with a pharmacist or prescribing physician"],
  "general_notes": ["other educational notes about this medication regimen"],
  "disclaimer": "{DISCLAIMER}"
}}

Rules:
- This is EDUCATIONAL. Never tell the patient to start, stop, or change a medication.
- For interactions, use "worth discussing with your pharmacist/doctor" framing.
- overall_interaction_risk must be HIGH if any pair has severity_concern HIGH.
- Return ONLY the JSON object, no markdown."""

        def explain() -> str:
            return gl.nondet.exec_prompt(prompt)

        result_str = gl.eq_principle.prompt_comparative(
            explain,
            (
                "Both are valid educational medication information responses. They are "
                "equivalent if they agree on the overall interaction risk category "
                "(both LOW, both MODERATE, or both HIGH). Any differences in JSON "
                "structure, field names, which specific side effects are listed, "
                "number of pharmacist questions, exact wording of warnings, or which "
                "individual drug class details are included are all acceptable."
            ),
        )

        result = self._parse_json_safe(result_str, "medication explanation")
        interaction_risk = self._coerce_risk_3(result.get("overall_interaction_risk", "LOW"))
        timestamp = self._now()

        record = MedicationRecord(
            record_id=record_id,
            user_ref=user_ref,
            medications_json=medications_json,
            analysis_json=json.dumps(result),
            interaction_risk=interaction_risk,
            created_at=timestamp,
            disclaimer=DISCLAIMER,
        )
        idx = u32(len(self.medication_records))
        self.medication_records.append(record)
        self.medication_index[record_id] = idx
        self._inc_total()
        self._audit(record_id, "MEDICATION_EXPLAIN", payload_hash)

        return {
            "record_id": record_id,
            "medications": result.get("medications", []),
            "potential_interactions": result.get("potential_interactions", []),
            "overall_interaction_risk": interaction_risk,
            "pharmacist_questions": result.get("pharmacist_questions", []),
            "general_notes": result.get("general_notes", []),
            "disclaimer": DISCLAIMER,
            "created_at": timestamp,
        }

    @gl.public.view
    def get_medication_analysis(self, record_id: str) -> dict:
        idx = self._require_exists("medication", record_id)
        r = self.medication_records[idx]
        return {
            "record_id": r.record_id,
            "interaction_risk": r.interaction_risk,
            "analysis": json.loads(r.analysis_json),
            "created_at": r.created_at,
            "disclaimer": DISCLAIMER,
        }

    # =======================================================================
    # FEATURE 5 — Doctor Visit Assistant
    # =======================================================================

    @gl.public.write
    def prepare_doctor_visit(
        self,
        record_id: str,
        user_ref: str,
        visit_context_json: str,
        payload_hash: str,
    ) -> dict:
        """
        Generate personalised pre-visit questions and preparation notes.

        visit_context_json: {
          specialty, chief_complaint, symptoms, current_medications,
          known_conditions, visit_goals, previous_visits_summary
        }
        """
        self._require_unique("doctor_visit", record_id)
        self._validate_inputs(record_id, user_ref, payload_hash)
        if len(visit_context_json.strip()) < 10:
            raise gl.UserError("visit_context_json is required.")
        if len(visit_context_json) > 10000:
            raise gl.UserError("visit_context_json exceeds 10 000 character limit.")

        prompt = f"""You are Care Bridge, an educational medical intelligence system.
A user is preparing for a medical appointment and wants help getting ready.

{self._safety_preamble()}

Visit context: {visit_context_json}

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "priority_questions": [
    {{
      "question": "the question to ask",
      "why_important": "brief note on why this matters",
      "category": "diagnosis | treatment | medications | lifestyle | follow_up | prognosis | tests | referral"
    }}
  ],
  "symptom_timeline_to_describe": "guidance on how to describe the chief complaint chronologically",
  "bring_to_appointment": ["documents, devices, or items to bring"],
  "history_to_share": ["relevant medical history points to mention proactively"],
  "medication_list_notes": "brief note on sharing a complete medication list",
  "questions_about_tests": ["questions to ask if any tests or imaging are ordered"],
  "questions_about_treatment": ["questions to ask about any treatment plan discussed"],
  "after_visit_checklist": ["things to do or track after the appointment"],
  "communication_tips": "brief tips on communicating effectively with the provider",
  "disclaimer": "{DISCLAIMER}"
}}

Rules:
- Questions should be open-ended and patient-empowering.
- Do NOT suggest specific diagnoses or treatments.
- Aim for 8-15 priority questions covering different categories.
- Return ONLY the JSON object, no markdown."""

        def prepare() -> str:
            return gl.nondet.exec_prompt(prompt)

        result_str = gl.eq_principle.prompt_comparative(
            prepare,
            (
                "Both are valid educational doctor visit preparation responses. They "
                "are equivalent if both provide a non-empty list of patient questions "
                "or preparation tips relevant to the stated medical context. Any "
                "differences in JSON structure, field names, number of questions, "
                "exact question phrasing, items to bring, or additional advice are "
                "all acceptable and do not affect equivalence."
            ),
        )

        result = self._parse_json_safe(result_str, "doctor visit prep")
        timestamp = self._now()

        record = DoctorVisitRecord(
            record_id=record_id,
            user_ref=user_ref,
            context_json=visit_context_json,
            questions_json=json.dumps(result.get("priority_questions", [])),
            prep_notes=result.get("communication_tips", ""),
            created_at=timestamp,
            disclaimer=DISCLAIMER,
        )
        idx = u32(len(self.doctor_visit_records))
        self.doctor_visit_records.append(record)
        self.doctor_visit_index[record_id] = idx
        self._inc_total()
        self._audit(record_id, "DOCTOR_VISIT_PREP", payload_hash)

        return {
            "record_id": record_id,
            "priority_questions": result.get("priority_questions", []),
            "symptom_timeline_to_describe": result.get("symptom_timeline_to_describe", ""),
            "bring_to_appointment": result.get("bring_to_appointment", []),
            "history_to_share": result.get("history_to_share", []),
            "questions_about_tests": result.get("questions_about_tests", []),
            "questions_about_treatment": result.get("questions_about_treatment", []),
            "after_visit_checklist": result.get("after_visit_checklist", []),
            "communication_tips": result.get("communication_tips", ""),
            "disclaimer": DISCLAIMER,
            "created_at": timestamp,
        }

    @gl.public.view
    def get_doctor_visit_prep(self, record_id: str) -> dict:
        idx = self._require_exists("doctor_visit", record_id)
        r = self.doctor_visit_records[idx]
        return {
            "record_id": r.record_id,
            "questions": json.loads(r.questions_json),
            "prep_notes": r.prep_notes,
            "created_at": r.created_at,
            "disclaimer": DISCLAIMER,
        }

    # =======================================================================
    # FEATURE 6 — Preventive Health Coach
    # =======================================================================

    @gl.public.write
    def generate_prevention_plan(
        self,
        record_id: str,
        user_ref: str,
        health_profile_json: str,
        payload_hash: str,
    ) -> dict:
        """
        Generate personalised preventive health recommendations.

        health_profile_json: {
          age, sex, bmi, smoking_status, alcohol_use, exercise_level,
          family_history, known_conditions, current_medications,
          last_screenings (dict), goals
        }
        """
        self._require_unique("prevention", record_id)
        self._validate_inputs(record_id, user_ref, payload_hash)
        if len(health_profile_json.strip()) < 10:
            raise gl.UserError("health_profile_json is required.")
        if len(health_profile_json) > 10000:
            raise gl.UserError("health_profile_json exceeds 10 000 character limit.")

        prompt = f"""You are Care Bridge, an educational medical intelligence system.
A user wants personalised preventive health education.

{self._safety_preamble()}

Health profile: {health_profile_json}

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "overall_priority": "LOW or MODERATE or HIGH — overall prevention urgency based on profile",
  "risk_factors_identified": [
    {{
      "factor": "risk factor name",
      "modifiable": true or false,
      "educational_note": "brief explanation of why this matters"
    }}
  ],
  "screening_recommendations": [
    {{
      "screening": "name of screening",
      "frequency": "how often",
      "why": "brief reason",
      "discuss_with_provider": true or false
    }}
  ],
  "lifestyle_recommendations": [
    {{
      "category": "nutrition | exercise | sleep | stress | substance_use | other",
      "recommendation": "specific actionable tip",
      "evidence_basis": "brief note on why this is recommended (e.g. reduces cardiovascular risk)"
    }}
  ],
  "vaccination_reminders": ["vaccinations to discuss with provider based on age/profile"],
  "mental_health_notes": ["mental health and wellbeing suggestions"],
  "next_steps": ["prioritised list of first steps to take"],
  "disclaimer": "{DISCLAIMER}"
}}

Rules:
- Recommendations must be evidence-based general health guidance.
- Never prescribe specific drugs or diagnose conditions.
- overall_priority HIGH if multiple high-risk modifiable factors present.
- Return ONLY the JSON object, no markdown."""

        def coach() -> str:
            return gl.nondet.exec_prompt(prompt)

        result_str = gl.eq_principle.prompt_comparative(
            coach,
            (
                "Both are valid educational preventive health guidance responses. They "
                "are equivalent if they agree on the overall health priority level "
                "(both LOW, both MODERATE, or both HIGH). Any differences in JSON "
                "structure, field names, which specific risk factors are named, the "
                "number or wording of lifestyle recommendations, or any other content "
                "details are all acceptable and do not affect equivalence."
            ),
        )

        result = self._parse_json_safe(result_str, "prevention plan")
        priority = self._coerce_risk_3(result.get("overall_priority", "MODERATE"))
        timestamp = self._now()

        record = PreventionRecord(
            record_id=record_id,
            user_ref=user_ref,
            profile_json=health_profile_json,
            recommendations_json=json.dumps(result.get("lifestyle_recommendations", [])),
            risk_factors_json=json.dumps(result.get("risk_factors_identified", [])),
            priority=priority,
            created_at=timestamp,
            disclaimer=DISCLAIMER,
        )
        idx = u32(len(self.prevention_records))
        self.prevention_records.append(record)
        self.prevention_index[record_id] = idx
        self._inc_total()
        self._audit(record_id, "PREVENTION_PLAN", payload_hash)

        return {
            "record_id": record_id,
            "overall_priority": priority,
            "risk_factors_identified": result.get("risk_factors_identified", []),
            "screening_recommendations": result.get("screening_recommendations", []),
            "lifestyle_recommendations": result.get("lifestyle_recommendations", []),
            "vaccination_reminders": result.get("vaccination_reminders", []),
            "mental_health_notes": result.get("mental_health_notes", []),
            "next_steps": result.get("next_steps", []),
            "disclaimer": DISCLAIMER,
            "created_at": timestamp,
        }

    @gl.public.view
    def get_prevention_plan(self, record_id: str) -> dict:
        idx = self._require_exists("prevention", record_id)
        r = self.prevention_records[idx]
        return {
            "record_id": r.record_id,
            "priority": r.priority,
            "risk_factors": json.loads(r.risk_factors_json),
            "recommendations": json.loads(r.recommendations_json),
            "created_at": r.created_at,
            "disclaimer": DISCLAIMER,
        }

    # =======================================================================
    # FEATURE 7 — Triage Engine
    # =======================================================================

    @gl.public.write
    def triage_patient(
        self,
        record_id: str,
        user_ref: str,
        triage_input_json: str,
        payload_hash: str,
    ) -> dict:
        """
        Full triage: urgency classification, care channel routing, red flags.

        triage_input_json: {
          chief_complaint, symptom_onset, severity (1-10),
          associated_symptoms, vital_signs (optional),
          age, sex, known_conditions, current_medications,
          recent_events (injuries, travel, exposures)
        }
        """
        self._require_unique("triage", record_id)
        self._validate_inputs(record_id, user_ref, payload_hash)
        if len(triage_input_json.strip()) < 10:
            raise gl.UserError("triage_input_json is required.")
        if len(triage_input_json) > 12000:
            raise gl.UserError("triage_input_json exceeds 12 000 character limit.")

        prompt = f"""You are Care Bridge, an educational medical triage intelligence system.
A user is seeking guidance on the urgency of their healthcare situation.

{self._safety_preamble()}

Triage input: {triage_input_json}

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "triage_level": "one of: LOW, MODERATE, HIGH, CRITICAL",
  "urgency": "one of: ROUTINE, SOON, URGENT, EMERGENCY",
  "care_channel": "one of: SELF_CARE, TELEHEALTH, PRIMARY_CARE, URGENT_CARE, EMERGENCY_ROOM, SPECIALIST",
  "reasoning": "2-4 sentence explanation of the triage decision in plain language",
  "red_flags_present": ["any concerning features identified from the input that raise urgency"],
  "red_flags_to_watch": ["symptoms that, if they develop, would immediately escalate urgency"],
  "immediate_actions": ["things the patient can do RIGHT NOW while awaiting care"],
  "do_not_do": ["things to avoid until assessed by a professional"],
  "estimated_time_to_care": "e.g. within 15 minutes, within 24 hours, within 1 week",
  "call_emergency_services": true or false,
  "disclaimer": "{DISCLAIMER}"
}}

Mandatory escalation rules:
- Chest pain or pressure: urgency EMERGENCY, care_channel EMERGENCY_ROOM, call_emergency_services true
- Difficulty breathing: EMERGENCY
- Signs of stroke (facial droop, arm weakness, speech difficulty, sudden severe headache): EMERGENCY
- Severe allergic reaction or anaphylaxis: EMERGENCY
- Uncontrolled bleeding: EMERGENCY
- Loss of consciousness or altered mental status: EMERGENCY
- Suicidal ideation or active self-harm: EMERGENCY

For all other presentations, calibrate based on symptom severity and context.
Return ONLY the JSON object, no markdown."""

        def triage() -> str:
            return gl.nondet.exec_prompt(prompt)

        result_str = gl.eq_principle.prompt_comparative(
            triage,
            (
                "Both are valid educational triage guidance responses. They are "
                "equivalent if they agree on the overall urgency tier: both low/routine, "
                "both moderate/soon, both urgent, or both emergency/critical. Any "
                "differences in JSON structure, field names, care channel details, "
                "reasoning text, step lists, or specific wording are all acceptable "
                "and do not affect equivalence."
            ),
        )

        result = self._parse_json_safe(result_str, "triage")
        triage_level = self._coerce_risk(result.get("triage_level", "MODERATE"))
        urgency = self._coerce_urgency(result.get("urgency", "SOON"))
        care_channel = self._coerce_channel(result.get("care_channel", "PRIMARY_CARE"))
        timestamp = self._now()

        record = TriageRecord(
            record_id=record_id,
            user_ref=user_ref,
            input_json=triage_input_json,
            triage_level=triage_level,
            urgency=urgency,
            care_channel=care_channel,
            reasoning=result.get("reasoning", ""),
            red_flags_json=json.dumps(result.get("red_flags_present", [])),
            created_at=timestamp,
            disclaimer=DISCLAIMER,
        )
        idx = u32(len(self.triage_records))
        self.triage_records.append(record)
        self.triage_index[record_id] = idx
        self._inc_total()
        self._audit(record_id, "TRIAGE", payload_hash)

        return {
            "record_id": record_id,
            "triage_level": triage_level,
            "urgency": urgency,
            "care_channel": care_channel,
            "reasoning": result.get("reasoning", ""),
            "red_flags_present": result.get("red_flags_present", []),
            "red_flags_to_watch": result.get("red_flags_to_watch", []),
            "immediate_actions": result.get("immediate_actions", []),
            "do_not_do": result.get("do_not_do", []),
            "estimated_time_to_care": result.get("estimated_time_to_care", ""),
            "call_emergency_services": result.get("call_emergency_services", False),
            "disclaimer": DISCLAIMER,
            "created_at": timestamp,
        }

    @gl.public.view
    def get_triage(self, record_id: str) -> dict:
        idx = self._require_exists("triage", record_id)
        r = self.triage_records[idx]
        return {
            "record_id": r.record_id,
            "triage_level": r.triage_level,
            "urgency": r.urgency,
            "care_channel": r.care_channel,
            "reasoning": r.reasoning,
            "red_flags": json.loads(r.red_flags_json),
            "created_at": r.created_at,
            "disclaimer": DISCLAIMER,
        }

    # =======================================================================
    # FEATURE 8 — Multilingual Health Assistant
    # =======================================================================

    @gl.public.write
    def answer_health_query(
        self,
        record_id: str,
        user_ref: str,
        query: str,
        language_code: str,
        payload_hash: str,
    ) -> dict:
        """
        Answer a general health education question in the user's language.

        language_code: ISO 639-1 code (e.g. "en", "fr", "es", "pt", "sw", "ar", "zh", "hi")
        """
        self._require_unique("multilingual", record_id)
        self._validate_inputs(record_id, user_ref, payload_hash)
        if len(query.strip()) < 5:
            raise gl.UserError("query is too short.")
        if len(query) > 2000:
            raise gl.UserError("query exceeds 2 000 character limit.")
        if len(language_code.strip()) < 2:
            raise gl.UserError("language_code is required (ISO 639-1).")

        prompt = f"""You are Care Bridge, an educational health intelligence assistant.
The user is writing in language code: {language_code}

{self._safety_preamble()}

User's health question: {query}

Instructions:
1. Respond in the SAME language as the question (language code: {language_code}).
2. Provide factual, educational health information.
3. If the question implies urgency (emergency symptoms), direct the user to seek immediate professional care.
4. Do NOT diagnose. Use educational framing throughout.
5. End with the disclaimer translated into the response language.

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "response": "your full educational answer in language {language_code}",
  "language_detected": "the language code you responded in",
  "key_points": ["2-5 key points from the answer, in the same language"],
  "when_to_seek_care": "brief note on when professional care is needed, in the same language",
  "is_emergency_query": true or false,
  "disclaimer_translated": "the Care Bridge disclaimer translated into the response language",
  "disclaimer": "{DISCLAIMER}"
}}

Return ONLY the JSON object, no markdown."""

        def answer() -> str:
            return gl.nondet.exec_prompt(prompt)

        result_str = gl.eq_principle.prompt_comparative(
            answer,
            (
                "Both are valid educational health query responses. They are equivalent "
                "if both provide a non-empty educational answer to the user's question "
                "and both agree on whether the query represents an emergency situation. "
                "Any differences in response length, wording, language style, JSON "
                "structure, or additional fields included are all acceptable."
            ),
        )

        result = self._parse_json_safe(result_str, "multilingual health query")
        timestamp = self._now()

        record = MultilingualRecord(
            record_id=record_id,
            user_ref=user_ref,
            query=query,
            language=language_code,
            response=result.get("response", ""),
            created_at=timestamp,
            disclaimer=DISCLAIMER,
        )
        idx = u32(len(self.multilingual_records))
        self.multilingual_records.append(record)
        self.multilingual_index[record_id] = idx
        self._inc_total()
        self._audit(record_id, "MULTILINGUAL_QUERY", payload_hash)

        return {
            "record_id": record_id,
            "response": result.get("response", ""),
            "language_detected": result.get("language_detected", language_code),
            "key_points": result.get("key_points", []),
            "when_to_seek_care": result.get("when_to_seek_care", ""),
            "is_emergency_query": result.get("is_emergency_query", False),
            "disclaimer_translated": result.get("disclaimer_translated", ""),
            "disclaimer": DISCLAIMER,
            "created_at": timestamp,
        }

    @gl.public.view
    def get_health_query_response(self, record_id: str) -> dict:
        idx = self._require_exists("multilingual", record_id)
        r = self.multilingual_records[idx]
        return {
            "record_id": r.record_id,
            "query": r.query,
            "language": r.language,
            "response": r.response,
            "created_at": r.created_at,
            "disclaimer": DISCLAIMER,
        }

    # =======================================================================
    # FEATURE 9 — Health Trend Interpreter
    # =======================================================================

    @gl.public.write
    def interpret_health_trend(
        self,
        record_id: str,
        user_ref: str,
        metric_type: str,
        datapoints_json: str,
        patient_context_json: str,
        payload_hash: str,
    ) -> dict:
        """
        Interpret a time-series health metric for trends and educational insights.

        metric_type: e.g. "blood_pressure", "weight", "blood_glucose",
                          "heart_rate", "cholesterol", "hba1c", "bmi", "steps"
        datapoints_json: JSON array of {date, value, unit, notes}
        """
        self._require_unique("trend", record_id)
        self._validate_inputs(record_id, user_ref, payload_hash)
        if len(metric_type.strip()) < 2:
            raise gl.UserError("metric_type is required.")
        if len(datapoints_json) < 5:
            raise gl.UserError("datapoints_json is required.")
        if len(datapoints_json) > 15000:
            raise gl.UserError("datapoints_json exceeds 15 000 character limit.")

        prompt = f"""You are Care Bridge, an educational medical intelligence system.
A user wants to understand the trend in their tracked health metric.

{self._safety_preamble()}

Metric type: {metric_type}
Patient context (may be empty): {patient_context_json}
Data points (chronological): {datapoints_json}

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "trend": "one of: IMPROVING, STABLE, WORSENING, FLUCTUATING, INSUFFICIENT_DATA",
  "trend_description": "2-3 sentence plain-language description of the trend pattern",
  "interpretation": "what this trend might mean educationally for this metric type",
  "statistical_notes": "brief notes on variability, outliers, or data quality",
  "within_typical_range": true or false,
  "concerning_readings": [
    {{
      "date": "date of reading",
      "value": "the value",
      "concern": "brief educational note on why this reading stands out"
    }}
  ],
  "positive_observations": ["encouraging patterns or improvements noticed"],
  "recommendations": ["educational suggestions for managing or tracking this metric"],
  "discuss_with_provider": true or false,
  "provider_discussion_points": ["specific points worth raising with a provider if discuss_with_provider is true"],
  "disclaimer": "{DISCLAIMER}"
}}

Rules:
- Never diagnose based on readings alone.
- discuss_with_provider must be true if the trend is WORSENING or readings are significantly outside typical ranges.
- If fewer than 2 data points, trend must be INSUFFICIENT_DATA.
- Return ONLY the JSON object, no markdown."""

        def interpret() -> str:
            return gl.nondet.exec_prompt(prompt)

        result_str = gl.eq_principle.prompt_comparative(
            interpret,
            (
                "Both are valid educational health trend interpretations. They are "
                "equivalent if they agree on the overall trend direction (both "
                "improving, both stable, both worsening, etc.) and both agree on "
                "whether the data warrants discussing with a provider. Any differences "
                "in JSON structure, field names, wording, number of recommendations, "
                "or specific interpretive comments are all acceptable."
            ),
        )

        result = self._parse_json_safe(result_str, "health trend interpretation")
        trend = result.get("trend", "STABLE")
        if trend not in ("IMPROVING", "STABLE", "WORSENING", "FLUCTUATING", "INSUFFICIENT_DATA"):
            trend = "STABLE"
        timestamp = self._now()

        record = TrendRecord(
            record_id=record_id,
            user_ref=user_ref,
            metric_type=metric_type,
            datapoints_json=datapoints_json,
            trend=trend,
            interpretation=result.get("interpretation", ""),
            recommendation=json.dumps(result.get("recommendations", [])),
            created_at=timestamp,
            disclaimer=DISCLAIMER,
        )
        idx = u32(len(self.trend_records))
        self.trend_records.append(record)
        self.trend_index[record_id] = idx
        self._inc_total()
        self._audit(record_id, "HEALTH_TREND", payload_hash)

        return {
            "record_id": record_id,
            "metric_type": metric_type,
            "trend": trend,
            "trend_description": result.get("trend_description", ""),
            "interpretation": result.get("interpretation", ""),
            "within_typical_range": result.get("within_typical_range", True),
            "concerning_readings": result.get("concerning_readings", []),
            "positive_observations": result.get("positive_observations", []),
            "recommendations": result.get("recommendations", []),
            "discuss_with_provider": result.get("discuss_with_provider", False),
            "provider_discussion_points": result.get("provider_discussion_points", []),
            "disclaimer": DISCLAIMER,
            "created_at": timestamp,
        }

    @gl.public.view
    def get_health_trend(self, record_id: str) -> dict:
        idx = self._require_exists("trend", record_id)
        r = self.trend_records[idx]
        return {
            "record_id": r.record_id,
            "metric_type": r.metric_type,
            "trend": r.trend,
            "interpretation": r.interpretation,
            "recommendations": json.loads(r.recommendation),
            "created_at": r.created_at,
            "disclaimer": DISCLAIMER,
        }

    # =======================================================================
    # FEATURE 10 — Telemedicine Routing Engine
    # =======================================================================

    @gl.public.write
    def route_to_care(
        self,
        record_id: str,
        user_ref: str,
        situation_json: str,
        payload_hash: str,
    ) -> dict:
        """
        Match a patient's situation to the most appropriate care channel.

        situation_json: {
          chief_complaint, urgency_self_assessed (1-10),
          mobility (can travel / cannot travel / limited),
          location (urban / rural / remote),
          insurance_status (insured / uninsured / unknown),
          time_of_day, age, known_conditions,
          preferred_language, available_channels (array, optional)
        }
        """
        self._require_unique("telemedicine", record_id)
        self._validate_inputs(record_id, user_ref, payload_hash)
        if len(situation_json.strip()) < 10:
            raise gl.UserError("situation_json is required.")
        if len(situation_json) > 10000:
            raise gl.UserError("situation_json exceeds 10 000 character limit.")

        prompt = f"""You are Care Bridge, an educational medical routing intelligence system.
A user needs guidance on which care channel best fits their situation.

{self._safety_preamble()}

Patient situation: {situation_json}

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "recommended_channel": "one of: SELF_CARE, TELEHEALTH, PRIMARY_CARE, URGENT_CARE, EMERGENCY_ROOM, SPECIALIST",
  "confidence": "HIGH or MODERATE or LOW",
  "reasoning": "2-4 sentence explanation of why this channel is recommended",
  "alternative_channels": [
    {{
      "channel": "channel name",
      "when_appropriate": "brief note on when this alternative would be better"
    }}
  ],
  "estimated_wait": "rough estimate e.g. 15-30 minutes, 1-3 days, same day",
  "cost_considerations": "brief general note on cost implications (not financial advice)",
  "preparation_tips": ["what to prepare before using the recommended channel"],
  "questions_to_answer_when_calling": ["information to have ready when contacting the provider"],
  "if_situation_worsens": "what to do and when to escalate to a higher level of care",
  "language_accommodation_note": "brief note if language support may be needed",
  "disclaimer": "{DISCLAIMER}"
}}

Rules:
- Emergency presentations (chest pain, stroke, uncontrolled bleeding, anaphylaxis, altered consciousness) must always recommend EMERGENCY_ROOM.
- Consider mobility, location, and time of day in the routing decision.
- Return ONLY the JSON object, no markdown."""

        def route() -> str:
            return gl.nondet.exec_prompt(prompt)

        result_str = gl.eq_principle.prompt_comparative(
            route,
            (
                "Both are valid educational care routing responses. They are equivalent "
                "if they recommend the same level of care urgency: both self-care/home, "
                "both telehealth/primary care, both urgent care, or both emergency room. "
                "Any differences in JSON structure, field names, reasoning text, "
                "confidence scores, alternative channels listed, or specific wording "
                "are all acceptable and do not affect equivalence."
            ),
        )

        result = self._parse_json_safe(result_str, "telemedicine routing")
        channel = self._coerce_channel(result.get("recommended_channel", "PRIMARY_CARE"))
        timestamp = self._now()

        record = TelemedicineRecord(
            record_id=record_id,
            user_ref=user_ref,
            situation_json=situation_json,
            recommended_channel=channel,
            reasoning=result.get("reasoning", ""),
            estimated_wait=result.get("estimated_wait", ""),
            alternatives_json=json.dumps(result.get("alternative_channels", [])),
            created_at=timestamp,
            disclaimer=DISCLAIMER,
        )
        idx = u32(len(self.telemedicine_records))
        self.telemedicine_records.append(record)
        self.telemedicine_index[record_id] = idx
        self._inc_total()
        self._audit(record_id, "TELEMEDICINE_ROUTE", payload_hash)

        return {
            "record_id": record_id,
            "recommended_channel": channel,
            "confidence": result.get("confidence", "MODERATE"),
            "reasoning": result.get("reasoning", ""),
            "alternative_channels": result.get("alternative_channels", []),
            "estimated_wait": result.get("estimated_wait", ""),
            "cost_considerations": result.get("cost_considerations", ""),
            "preparation_tips": result.get("preparation_tips", []),
            "questions_to_answer_when_calling": result.get("questions_to_answer_when_calling", []),
            "if_situation_worsens": result.get("if_situation_worsens", ""),
            "disclaimer": DISCLAIMER,
            "created_at": timestamp,
        }

    @gl.public.view
    def get_routing_result(self, record_id: str) -> dict:
        idx = self._require_exists("telemedicine", record_id)
        r = self.telemedicine_records[idx]
        return {
            "record_id": r.record_id,
            "recommended_channel": r.recommended_channel,
            "reasoning": r.reasoning,
            "estimated_wait": r.estimated_wait,
            "alternatives": json.loads(r.alternatives_json),
            "created_at": r.created_at,
            "disclaimer": DISCLAIMER,
        }

    # =======================================================================
    # Global view methods
    # =======================================================================

    @gl.public.view
    def get_disclaimer(self) -> str:
        return DISCLAIMER

    @gl.public.view
    def get_contract_version(self) -> str:
        return self.contract_version

    @gl.public.view
    def get_total_analyses(self) -> int:
        return int(self.total_analyses)

    @gl.public.view
    def get_audit_log(self) -> list:
        return [
            {
                "entry_id": e.entry_id,
                "record_id": e.record_id,
                "feature": e.feature,
                "actor": str(e.actor),
                "action": e.action,
                "created_at": e.created_at,
                "payload_hash": e.payload_hash,
            }
            for e in self.audit_log
        ]

    @gl.public.view
    def get_user_records(self, user_ref: str) -> dict:
        lab_ids = [r.record_id for r in self.lab_records if r.user_ref == user_ref]
        symptom_ids = [r.record_id for r in self.symptom_records if r.user_ref == user_ref]
        report_ids = [r.record_id for r in self.report_records if r.user_ref == user_ref]
        medication_ids = [r.record_id for r in self.medication_records if r.user_ref == user_ref]
        doctor_visit_ids = [r.record_id for r in self.doctor_visit_records if r.user_ref == user_ref]
        prevention_ids = [r.record_id for r in self.prevention_records if r.user_ref == user_ref]
        triage_ids = [r.record_id for r in self.triage_records if r.user_ref == user_ref]
        multilingual_ids = [r.record_id for r in self.multilingual_records if r.user_ref == user_ref]
        trend_ids = [r.record_id for r in self.trend_records if r.user_ref == user_ref]
        telemedicine_ids = [r.record_id for r in self.telemedicine_records if r.user_ref == user_ref]
        return {
            "user_ref": user_ref,
            "lab_analyses": lab_ids,
            "symptom_analyses": symptom_ids,
            "report_summaries": report_ids,
            "medication_analyses": medication_ids,
            "doctor_visit_preps": doctor_visit_ids,
            "prevention_plans": prevention_ids,
            "triages": triage_ids,
            "multilingual_queries": multilingual_ids,
            "health_trends": trend_ids,
            "routing_results": telemedicine_ids,
            "total": (
                len(lab_ids) + len(symptom_ids) + len(report_ids) +
                len(medication_ids) + len(doctor_visit_ids) + len(prevention_ids) +
                len(triage_ids) + len(multilingual_ids) + len(trend_ids) +
                len(telemedicine_ids)
            ),
        }

    # =======================================================================
    # Internal helpers
    # =======================================================================

    def _safety_preamble(self) -> str:
        return (
            "IMPORTANT SAFETY RULES:\n"
            "1. You are an educational system — never diagnose, prescribe, or replace a healthcare professional.\n"
            "2. Use phrases like 'may suggest', 'can be associated with', 'worth discussing with your doctor'.\n"
            "3. For any life-threatening emergency, always direct the user to call emergency services immediately.\n"
            f"4. Always include this exact disclaimer: {DISCLAIMER}\n"
            "5. Return ONLY valid JSON — no markdown code fences, no commentary, no preamble."
        )

    def _validate_inputs(self, record_id: str, user_ref: str, payload_hash: str) -> None:
        if len(record_id.strip()) < 8:
            raise gl.UserError("record_id must be at least 8 characters.")
        if len(user_ref.strip()) < 8:
            raise gl.UserError("user_ref must be at least 8 characters.")
        if len(payload_hash.strip()) < 16:
            raise gl.UserError("payload_hash must be a content hash of at least 16 characters.")

    def _require_unique(self, feature: str, record_id: str) -> None:
        index_map = self._get_index(feature)
        sentinel = u32(4294967295)
        if index_map.get(record_id, sentinel) != sentinel:
            raise gl.UserError(f"record_id '{record_id}' already exists for feature '{feature}'.")

    def _require_exists(self, feature: str, record_id: str) -> u32:
        index_map = self._get_index(feature)
        sentinel = u32(4294967295)
        idx = index_map.get(record_id, sentinel)
        if idx == sentinel:
            raise gl.UserError(f"record_id '{record_id}' not found for feature '{feature}'.")
        return idx

    def _get_index(self, feature: str):
        if feature == "lab":
            return self.lab_index
        if feature == "symptom":
            return self.symptom_index
        if feature == "report":
            return self.report_index
        if feature == "medication":
            return self.medication_index
        if feature == "doctor_visit":
            return self.doctor_visit_index
        if feature == "prevention":
            return self.prevention_index
        if feature == "triage":
            return self.triage_index
        if feature == "multilingual":
            return self.multilingual_index
        if feature == "trend":
            return self.trend_index
        if feature == "telemedicine":
            return self.telemedicine_index
        raise gl.UserError(f"Unknown feature: {feature}")

    def _parse_json_safe(self, raw: str, context: str) -> dict:
        if isinstance(raw, dict):
            return raw
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(
                line for line in lines
                if not line.strip().startswith("```")
            ).strip()
        try:
            return json.loads(text)
        except Exception:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end > start:
                try:
                    return json.loads(text[start:end])
                except Exception:
                    pass
            raise gl.UserError(f"Care Bridge could not parse the AI response for {context}.")

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _inc_total(self) -> None:
        self.total_analyses = u32(int(self.total_analyses) + 1)

    def _audit(self, record_id: str, feature: str, payload_hash: str) -> None:
        timestamp = self._now()
        material = f"{record_id}:{feature}:{payload_hash}:{timestamp}:{str(gl.message.sender_address)}"
        entry_id = sha256(material.encode("utf-8")).hexdigest()[:16]
        self.audit_log.append(
            AuditEntry(
                entry_id=entry_id,
                record_id=record_id,
                feature=feature,
                actor=gl.message.sender_address,
                action="WRITE",
                created_at=timestamp,
                payload_hash=payload_hash,
            )
        )

    def _coerce_risk(self, value: str) -> str:
        v = str(value).upper().strip()
        return v if v in RISK_LEVELS else "MODERATE"

    def _coerce_risk_3(self, value: str) -> str:
        v = str(value).upper().strip()
        return v if v in ("LOW", "MODERATE", "HIGH") else "MODERATE"

    def _coerce_urgency(self, value: str) -> str:
        v = str(value).upper().strip()
        return v if v in URGENCY_LEVELS else "SOON"

    def _coerce_channel(self, value: str) -> str:
        v = str(value).upper().strip()
        return v if v in CARE_CHANNELS else "PRIMARY_CARE"
