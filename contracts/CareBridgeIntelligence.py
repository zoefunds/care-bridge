# { "Depends": "gl-0.1.0" }
"""
CareBridge Intelligence Contract
GenLayer Intelligent Contract — StudioNet

Provides multi-model consensus medical analysis:
- Lab result interpretation
- Symptom assessment
- Medical report summarization
- Medication analysis
- Health triage

DISCLAIMER: Educational purposes only. Not medical advice.
"""

import json
from typing import Any
from genlayer import *


DISCLAIMER = (
    "This analysis is for educational and informational purposes only. "
    "It does not constitute medical advice, diagnosis, or treatment. "
    "Always consult a qualified healthcare professional for medical decisions."
)

TRIAGE_DISCLAIMER = (
    "Triage level is guidance only. If you are experiencing a medical emergency, "
    "call emergency services immediately. Do not delay seeking medical care."
)


@gl.contract
class CareBridgeIntelligence:

    analysis_count: uint256
    owner: address

    def __init__(self) -> None:
        self.analysis_count = uint256(0)
        self.owner = gl.message.sender_address

    @gl.public.write
    def analyze_lab_results(self, markers: Any, context: Any) -> Any:
        """
        Multi-model consensus interpretation of lab biomarkers.
        markers: list of {name, value, unit, reference_range}
        context: dict with patient context (age, gender, conditions, etc.)
        Returns consensus risk level, per-marker analysis, recommendations.
        """
        self.analysis_count = self.analysis_count + uint256(1)

        markers_json = json.dumps(markers)
        context_json = json.dumps(context)

        prompt = f"""You are a medical informatics assistant providing educational health information.

Analyze the following laboratory results and provide structured interpretation.

Lab Markers:
{markers_json}

Patient Context:
{context_json}

Instructions:
- Interpret each marker relative to standard reference ranges
- Identify markers that are HIGH, LOW, or NORMAL
- Note potential non-diagnostic causes for abnormal values
- Assess overall risk level: green (all normal), yellow (mild concern), red (significant concern)
- Provide educational context for each abnormal marker
- Suggest follow-up considerations (not diagnoses)
- Never diagnose conditions
- Always recommend consulting a healthcare provider

Return a valid JSON object with this exact structure:
{{
  "risk_level": "green|yellow|red",
  "markers_analysis": [
    {{
      "name": "marker name",
      "value": "value with unit",
      "status": "normal|high|low",
      "reference_range": "expected range",
      "explanation": "plain English explanation",
      "potential_causes": ["cause1", "cause2"],
      "flag": true|false
    }}
  ],
  "overall_summary": "2-3 sentence plain language summary",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "flags": ["any critical flags"],
  "confidence": 0.0-1.0,
  "disclaimer": "{DISCLAIMER}"
}}"""

        result = gl.exec_prompt(prompt)

        try:
            parsed = json.loads(result)
            parsed["disclaimer"] = DISCLAIMER
            return parsed
        except (json.JSONDecodeError, Exception):
            return {
                "risk_level": "yellow",
                "overall_summary": result[:500] if result else "Analysis pending",
                "markers_analysis": [],
                "recommendations": ["Please consult a healthcare provider for interpretation"],
                "flags": [],
                "confidence": 0.5,
                "disclaimer": DISCLAIMER,
            }

    @gl.public.write
    def analyze_symptoms(self, symptoms: Any, context: Any) -> Any:
        """
        Multi-model consensus symptom intelligence.
        symptoms: list of symptom strings
        context: dict with duration, severity, history
        Returns severity, risk level, care recommendation, warnings.
        """
        self.analysis_count = self.analysis_count + uint256(1)

        symptoms_json = json.dumps(symptoms)
        context_json = json.dumps(context)

        prompt = f"""You are a medical informatics assistant providing educational health guidance.

A user has reported the following symptoms:
{symptoms_json}

Additional Context:
{context_json}

Instructions:
- Assess symptom patterns and their possible categories
- Determine urgency level: low, moderate, high, emergency
- Assign risk level: green (self-care), yellow (see doctor soon), red (urgent care needed)
- Provide care recommendation appropriate to the risk level
- List warning signs that would escalate urgency
- NEVER provide a diagnosis
- NEVER name specific diseases as definitive conclusions
- Always recommend professional medical evaluation
- If any symptoms suggest emergency (chest pain, difficulty breathing, stroke signs, etc.),
  immediately flag as red and recommend emergency services

Return a valid JSON object:
{{
  "risk_level": "green|yellow|red",
  "urgency": "low|moderate|high|emergency",
  "severity": "mild|moderate|severe",
  "symptom_categories": ["category1", "category2"],
  "care_recommendation": "clear action recommendation",
  "warning_signs": ["sign that would escalate concern"],
  "self_care_tips": ["tip1", "tip2"],
  "when_to_seek_care": "specific guidance on timing",
  "emergency_flag": true|false,
  "confidence": 0.0-1.0,
  "disclaimer": "{DISCLAIMER}"
}}"""

        result = gl.exec_prompt(prompt)

        try:
            parsed = json.loads(result)
            parsed["disclaimer"] = DISCLAIMER
            return parsed
        except (json.JSONDecodeError, Exception):
            return {
                "risk_level": "yellow",
                "urgency": "moderate",
                "care_recommendation": "Please consult a healthcare provider for evaluation",
                "emergency_flag": False,
                "confidence": 0.5,
                "disclaimer": DISCLAIMER,
            }

    @gl.public.write
    def summarize_report(self, text: str, context: Any) -> Any:
        """
        Multi-model consensus medical report summarization.
        Converts clinical language to patient-friendly plain English.
        """
        self.analysis_count = self.analysis_count + uint256(1)

        context_json = json.dumps(context)
        report_excerpt = text[:3000] if len(text) > 3000 else text

        prompt = f"""You are a medical communication specialist helping patients understand their medical reports.

Medical Report:
{report_excerpt}

Context:
{context_json}

Instructions:
- Convert clinical/medical terminology to plain patient-friendly language
- Identify and explain key findings
- Extract the most important information for the patient
- Generate questions the patient could ask their doctor
- Do NOT add diagnoses or interpretations not present in the report
- Do NOT omit concerning findings — explain them clearly but calmly
- Use simple language (grade 8 reading level)

Return a valid JSON object:
{{
  "plain_language_summary": "Complete patient-friendly summary in 3-5 paragraphs",
  "key_findings": ["finding 1", "finding 2"],
  "important_values": [
    {{"item": "name", "value": "value", "what_it_means": "plain explanation"}}
  ],
  "next_steps": ["step 1", "step 2"],
  "doctor_questions": ["Question to ask your doctor 1", "Question 2"],
  "glossary": [
    {{"term": "medical term", "definition": "plain English definition"}}
  ],
  "confidence": 0.0-1.0,
  "disclaimer": "{DISCLAIMER}"
}}"""

        result = gl.exec_prompt(prompt)

        try:
            parsed = json.loads(result)
            parsed["disclaimer"] = DISCLAIMER
            return parsed
        except (json.JSONDecodeError, Exception):
            return {
                "plain_language_summary": result[:1000] if result else "Unable to process report",
                "key_findings": [],
                "doctor_questions": ["Please ask your doctor to explain this report to you"],
                "confidence": 0.5,
                "disclaimer": DISCLAIMER,
            }

    @gl.public.write
    def analyze_medication(self, medications: Any) -> Any:
        """
        Multi-model consensus medication intelligence.
        medications: list of medication name strings
        Returns purpose, side effects, interactions, warnings.
        """
        self.analysis_count = self.analysis_count + uint256(1)

        meds_json = json.dumps(medications)

        prompt = f"""You are a pharmaceutical information specialist providing patient education.

Medications to analyze:
{meds_json}

Instructions:
- For each medication, provide educational information
- Identify potential drug-drug interactions between listed medications
- Note important food interactions
- List common and serious side effects
- Provide missed dose guidance
- Include storage and handling notes
- NEVER recommend stopping or changing medications
- Always advise consulting pharmacist or prescriber

Return a valid JSON object:
{{
  "medications": [
    {{
      "name": "medication name",
      "drug_class": "class of drug",
      "common_uses": ["use 1", "use 2"],
      "how_it_works": "plain English mechanism",
      "common_side_effects": ["effect 1", "effect 2"],
      "serious_side_effects": ["serious effect — seek care if occurs"],
      "food_interactions": ["food/drink to avoid"],
      "missed_dose": "what to do if a dose is missed",
      "storage": "storage instructions",
      "warnings": ["important warning"]
    }}
  ],
  "drug_interactions": [
    {{
      "medications": ["med A", "med B"],
      "severity": "minor|moderate|major",
      "description": "what may happen",
      "recommendation": "what to do"
    }}
  ],
  "general_recommendations": ["recommendation"],
  "confidence": 0.0-1.0,
  "disclaimer": "{DISCLAIMER}"
}}"""

        result = gl.exec_prompt(prompt)

        try:
            parsed = json.loads(result)
            parsed["disclaimer"] = DISCLAIMER
            return parsed
        except (json.JSONDecodeError, Exception):
            return {
                "medications": [],
                "drug_interactions": [],
                "general_recommendations": [
                    "Consult your pharmacist or prescriber for medication information"
                ],
                "confidence": 0.5,
                "disclaimer": DISCLAIMER,
            }

    @gl.public.write
    def health_triage(self, input: Any) -> Any:
        """
        Multi-model consensus health risk triage.
        Synthesizes symptoms, history, and context into triage guidance.
        Green = self-care, Yellow = medical review, Red = urgent care.
        """
        self.analysis_count = self.analysis_count + uint256(1)

        input_json = json.dumps(input)

        prompt = f"""You are a clinical triage support assistant providing educational health guidance.

Patient Health Information:
{input_json}

Instructions:
- Assess the overall health situation based on all provided information
- Assign a triage level: green, yellow, or red
  * GREEN: Likely manageable with self-care; no urgent medical attention needed
  * YELLOW: Medical review recommended within 24-72 hours
  * RED: Urgent medical attention recommended; do not delay
- Provide clear, actionable guidance appropriate to the triage level
- If ANY emergency symptoms are present (severe chest pain, difficulty breathing,
  sudden confusion, severe allergic reaction, signs of stroke), immediately assign RED
  and recommend calling emergency services
- Be conservative — when in doubt, recommend higher care level
- Never diagnose
- Never recommend delaying emergency care

Return a valid JSON object:
{{
  "triage_level": "green|yellow|red",
  "triage_summary": "Clear 2-3 sentence explanation of the triage decision",
  "primary_concerns": ["concern 1", "concern 2"],
  "immediate_actions": ["action 1", "action 2"],
  "timeframe": "when to seek care / how urgently",
  "emergency_services": true|false,
  "follow_up": "recommended follow-up guidance",
  "monitoring": ["what to watch for that would change triage level"],
  "confidence": 0.0-1.0,
  "disclaimer": "{TRIAGE_DISCLAIMER}"
}}"""

        result = gl.exec_prompt(prompt)

        try:
            parsed = json.loads(result)
            parsed["disclaimer"] = TRIAGE_DISCLAIMER
            return parsed
        except (json.JSONDecodeError, Exception):
            return {
                "triage_level": "yellow",
                "triage_summary": "Unable to complete automated triage. Please consult a healthcare provider.",
                "emergency_services": False,
                "immediate_actions": ["Contact a healthcare provider for evaluation"],
                "confidence": 0.0,
                "disclaimer": TRIAGE_DISCLAIMER,
            }

    @gl.public.view
    def get_analysis_count(self) -> uint256:
        return self.analysis_count

    @gl.public.view
    def get_owner(self) -> address:
        return self.owner
