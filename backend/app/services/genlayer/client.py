"""
Care Bridge — GenLayer Read-Only Client

The backend NEVER signs or submits write transactions.
Write transactions are signed by the user's own wallet on the frontend.
This client only:
  - Polls eth_getTransactionByHash until a tx is FINALIZED
  - Calls read_contract to fetch results after finalization
"""

import asyncio
import functools
import json
from typing import Any

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
        from eth_account import Account
        # Dummy account — reads are free and unsigned, account is just an identifier
        dummy = Account.from_key(
            "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
        )
        _sdk_client = SDKClient(chain_config=studionet, account=dummy)
    return _sdk_client


async def _run_sync(fn, *args, **kwargs):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, functools.partial(fn, *args, **kwargs))


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

    async def _poll_finalized(self, tx_hash: str, label: str, timeout: int = 300) -> bool:
        """Poll until FINALIZED, a terminal failure, or timeout. Returns True only on FINALIZED."""
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

    async def _read(self, method: str, args: list) -> Any:
        """Call a read-only contract method (no signature required)."""
        if not self.contract_address:
            return None
        try:
            sdk = _get_sdk_client()
            result = await _run_sync(
                sdk.read_contract,
                self.contract_address,
                method,
                args,
                None,
                sdk.account,
            )
            return _parse_result(result)
        except Exception as exc:
            logger.error("genlayer_read_error", method=method, error=str(exc))
            return None


genlayer_client = GenLayerClient()
