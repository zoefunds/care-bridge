"""
Care Bridge — GenLayer Client

Uses genlayer-py SDK (>=0.8.1) with write_contract / read_contract.
All write calls go on-chain to the deployed CareBridgeIntelligence contract.
Results are polled via eth_getTransactionByHash until FINALIZED or failed,
then fetched from the contract store via the matching read method.
"""

import asyncio
import functools
import hashlib
import json
import uuid
from typing import Any, Optional

import httpx
from app.core.config import settings
from app.core.logging import logger

GENLAYER_RPC = "https://studio.genlayer.com/api"

_sdk_client = None


def _get_sdk_client():
    global _sdk_client
    if _sdk_client is None:
        from genlayer_py.chains.studionet import studionet
        from genlayer_py.client.genlayer_client import GenLayerClient as SDKClient
        _sdk_client = SDKClient(chain_config=studionet, account=_signer_account())
    return _sdk_client


def _signer_account():
    from eth_account import Account
    pk = (settings.GENLAYER_PRIVATE_KEY or "").strip()
    if pk:
        return Account.from_key(pk)
    # Deterministic fallback — no real funds needed on StudioNet
    return Account.from_key(
        "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
    )


async def _run_sync(fn, *args, **kwargs):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, functools.partial(fn, *args, **kwargs))


async def _poll_finalized(tx_hash: str, label: str, timeout: int = 180) -> bool:
    """Poll until FINALIZED, UNDETERMINED, or timeout. Returns True only on FINALIZED."""
    TERMINAL_FAIL = {"UNDETERMINED", "CANCELED", "VALIDATORS_TIMEOUT", "LEADER_TIMEOUT"}
    polls = timeout // 6
    for i in range(polls):
        await asyncio.sleep(6)
        try:
            async with httpx.AsyncClient(timeout=15) as c:
                resp = await c.post(GENLAYER_RPC, json={
                    "jsonrpc": "2.0", "id": 1,
                    "method": "eth_getTransactionByHash",
                    "params": [tx_hash],
                })
                tx = resp.json().get("result")
                if not tx:
                    continue
                status = str(tx.get("status") or "").upper()
                logger.info("genlayer_poll", label=label, hash=tx_hash[:16], status=status, attempt=i + 1)
                if status == "FINALIZED":
                    return True
                if status in TERMINAL_FAIL:
                    logger.warning("genlayer_failed", label=label, status=status)
                    return False
        except Exception as exc:
            logger.warning("genlayer_poll_error", label=label, error=str(exc))
    logger.error("genlayer_timeout", label=label, tx_hash=tx_hash)
    return False


def _make_record_id() -> str:
    return uuid.uuid4().hex  # 32 hex chars — unique per call


def _payload_hash(*parts: str) -> str:
    material = ":".join(parts)
    return hashlib.sha256(material.encode()).hexdigest()


def _parse_result(raw: Any) -> dict:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8", errors="replace")
    if isinstance(raw, str):
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(l for l in lines if not l.strip().startswith("```")).strip()
        try:
            return json.loads(text)
        except Exception:
            start, end = text.find("{"), text.rfind("}") + 1
            if start != -1 and end > start:
                try:
                    return json.loads(text[start:end])
                except Exception:
                    pass
        return {"raw": raw}
    return raw or {}


class GenLayerClient:

    def __init__(self):
        self.contract_address = settings.GENLAYER_CONTRACT_ADDRESS

    def _account(self):
        return _signer_account()

    async def _write(self, method: str, args: list, label: str) -> Optional[str]:
        if not self.contract_address:
            logger.warning("genlayer_no_contract", method=method)
            return None
        try:
            sdk = _get_sdk_client()
            account = self._account()
            tx_hash = await _run_sync(
                sdk.write_contract,
                self.contract_address,
                method,
                account,
                None,   # consensus_max_rotations
                0,      # value
                False,  # leader_only
                args,
                None,   # kwargs
            )
            tx_str = tx_hash.hex() if hasattr(tx_hash, "hex") else str(tx_hash)
            logger.info("genlayer_tx_sent", method=method, tx=tx_str)
            return tx_str
        except Exception as exc:
            logger.error("genlayer_write_error", method=method, error=str(exc))
            return None

    async def _read(self, method: str, args: list) -> Any:
        if not self.contract_address:
            return None
        try:
            sdk = _get_sdk_client()
            account = self._account()
            result = await _run_sync(
                sdk.read_contract,
                self.contract_address,
                method,
                args,
                None,
                account,
            )
            return _parse_result(result)
        except Exception as exc:
            logger.error("genlayer_read_error", method=method, error=str(exc))
            return None

    # ── Feature 1: Lab Analysis ──────────────────────────────────────────────

    async def analyze_lab_results(
        self, user_ref: str, markers: list, context: dict
    ) -> tuple[str, dict]:
        record_id = _make_record_id()
        markers_json = json.dumps(markers)
        context_json = json.dumps(context or {})
        ph = _payload_hash(record_id, user_ref, markers_json)

        tx = await self._write(
            "analyze_lab_results",
            [record_id, user_ref, markers_json, context_json, ph],
            label="lab_analysis",
        )
        if not tx:
            return "", {"error": "Contract call failed — no transaction hash"}

        finalized = await _poll_finalized(tx, "lab_analysis")
        if not finalized:
            return tx, {"error": "Consensus not reached (undetermined/timeout)", "tx_hash": tx}

        result = await self._read("get_lab_analysis", [record_id])
        return tx, result or {}

    # ── Feature 2: Symptom Analysis ─────────────────────────────────────────

    async def analyze_symptoms(
        self, user_ref: str, symptoms: list, context: dict
    ) -> tuple[str, dict]:
        record_id = _make_record_id()
        symptoms_json = json.dumps(symptoms)
        context_json = json.dumps(context or {})
        ph = _payload_hash(record_id, user_ref, symptoms_json)

        tx = await self._write(
            "analyze_symptoms",
            [record_id, user_ref, symptoms_json, context_json, ph],
            label="symptom_analysis",
        )
        if not tx:
            return "", {"error": "Contract call failed"}

        finalized = await _poll_finalized(tx, "symptom_analysis")
        if not finalized:
            return tx, {"error": "Consensus not reached", "tx_hash": tx}

        result = await self._read("get_symptom_analysis", [record_id])
        return tx, result or {}

    # ── Feature 3: Report Summarizer ────────────────────────────────────────

    async def summarize_report(
        self, user_ref: str, report_text: str, context: dict
    ) -> tuple[str, dict]:
        record_id = _make_record_id()
        report_type = (context or {}).get("report_type", "other")
        ph = _payload_hash(record_id, user_ref, report_text[:200])

        tx = await self._write(
            "summarize_report",
            [record_id, user_ref, report_text, report_type, ph],
            label="report_summary",
        )
        if not tx:
            return "", {"error": "Contract call failed"}

        finalized = await _poll_finalized(tx, "report_summary")
        if not finalized:
            return tx, {"error": "Consensus not reached", "tx_hash": tx}

        result = await self._read("get_report_summary", [record_id])
        return tx, result or {}

    # ── Feature 4: Medication Explainer ─────────────────────────────────────

    async def analyze_medication(
        self, user_ref: str, medications: list
    ) -> tuple[str, dict]:
        record_id = _make_record_id()
        meds_json = json.dumps(medications)
        ph = _payload_hash(record_id, user_ref, meds_json)

        tx = await self._write(
            "explain_medications",
            [record_id, user_ref, meds_json, "{}", ph],
            label="medication_explain",
        )
        if not tx:
            return "", {"error": "Contract call failed"}

        finalized = await _poll_finalized(tx, "medication_explain")
        if not finalized:
            return tx, {"error": "Consensus not reached", "tx_hash": tx}

        result = await self._read("get_medication_analysis", [record_id])
        return tx, result or {}

    # ── Feature 5: Doctor Visit Prep ────────────────────────────────────────

    async def prepare_doctor_visit(
        self, user_ref: str, context: dict
    ) -> tuple[str, dict]:
        record_id = _make_record_id()
        context_json = json.dumps(context or {})
        ph = _payload_hash(record_id, user_ref, context_json[:200])

        tx = await self._write(
            "prepare_doctor_visit",
            [record_id, user_ref, context_json, ph],
            label="doctor_visit_prep",
        )
        if not tx:
            return "", {"error": "Contract call failed"}

        finalized = await _poll_finalized(tx, "doctor_visit_prep")
        if not finalized:
            return tx, {"error": "Consensus not reached", "tx_hash": tx}

        result = await self._read("get_doctor_visit_prep", [record_id])
        return tx, result or {}

    # ── Feature 7: Triage Engine ────────────────────────────────────────────

    async def health_triage(
        self, user_ref: str, input_data: dict
    ) -> tuple[str, dict]:
        record_id = _make_record_id()
        input_json = json.dumps(input_data or {})
        ph = _payload_hash(record_id, user_ref, input_json[:200])

        tx = await self._write(
            "triage_patient",
            [record_id, user_ref, input_json, ph],
            label="triage",
        )
        if not tx:
            return "", {"error": "Contract call failed"}

        finalized = await _poll_finalized(tx, "triage")
        if not finalized:
            return tx, {"error": "Consensus not reached", "tx_hash": tx}

        result = await self._read("get_triage", [record_id])
        return tx, result or {}

    # ── Feature 10: Telemedicine Routing ────────────────────────────────────

    async def route_to_care(
        self, user_ref: str, situation: dict
    ) -> tuple[str, dict]:
        record_id = _make_record_id()
        situation_json = json.dumps(situation or {})
        ph = _payload_hash(record_id, user_ref, situation_json[:200])

        tx = await self._write(
            "route_to_care",
            [record_id, user_ref, situation_json, ph],
            label="telemedicine_route",
        )
        if not tx:
            return "", {"error": "Contract call failed"}

        finalized = await _poll_finalized(tx, "telemedicine_route")
        if not finalized:
            return tx, {"error": "Consensus not reached", "tx_hash": tx}

        result = await self._read("get_routing_result", [record_id])
        return tx, result or {}


genlayer_client = GenLayerClient()
