import asyncio
import json
import httpx
from typing import Any
from app.core.config import settings
from app.core.logging import logger


class GenLayerClient:
    def __init__(self):
        self.node_url = settings.GENLAYER_NODE_URL
        self.contract_address = settings.GENLAYER_CONTRACT_ADDRESS

    async def _rpc(self, method: str, params: list) -> Any:
        payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(self.node_url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            if "error" in data:
                raise RuntimeError(f"GenLayer RPC error: {data['error']}")
            return data.get("result")

    async def call_contract(self, from_address: str, method: str, args: dict) -> str:
        call_data = json.dumps({"method": method, "args": args})
        result = await self._rpc(
            "eth_sendTransaction",
            [{"from": from_address, "to": self.contract_address, "data": call_data}],
        )
        logger.info("genlayer_tx_submitted", tx_hash=result, method=method)
        return result

    async def get_result(self, tx_hash: str, max_wait: int = 120) -> dict | None:
        for attempt in range(max_wait // 5):
            await asyncio.sleep(5)
            try:
                receipt = await self._rpc("eth_getTransactionReceipt", [tx_hash])
                if receipt and receipt.get("status") == "0x1":
                    output = receipt.get("output") or receipt.get("logs", [{}])[0].get("data")
                    if isinstance(output, str):
                        try:
                            return json.loads(output)
                        except json.JSONDecodeError:
                            return {"raw": output}
                    return output
            except Exception as e:
                logger.warning("genlayer_poll_error", attempt=attempt, error=str(e))
        logger.warning("genlayer_timeout", tx_hash=tx_hash)
        return None

    async def analyze_lab_results(
        self, from_address: str, markers: list, context: dict
    ) -> tuple[str, dict | None]:
        tx_hash = await self.call_contract(
            from_address, "analyze_lab_results", {"markers": markers, "context": context}
        )
        result = await self.get_result(tx_hash)
        return tx_hash, result

    async def analyze_symptoms(
        self, from_address: str, symptoms: list, context: dict
    ) -> tuple[str, dict | None]:
        tx_hash = await self.call_contract(
            from_address, "analyze_symptoms", {"symptoms": symptoms, "context": context}
        )
        result = await self.get_result(tx_hash)
        return tx_hash, result

    async def summarize_report(
        self, from_address: str, text: str, context: dict
    ) -> tuple[str, dict | None]:
        tx_hash = await self.call_contract(
            from_address, "summarize_report", {"text": text, "context": context}
        )
        result = await self.get_result(tx_hash)
        return tx_hash, result

    async def analyze_medication(
        self, from_address: str, medications: list
    ) -> tuple[str, dict | None]:
        tx_hash = await self.call_contract(
            from_address, "analyze_medication", {"medications": medications}
        )
        result = await self.get_result(tx_hash)
        return tx_hash, result

    async def health_triage(
        self, from_address: str, input_data: dict
    ) -> tuple[str, dict | None]:
        tx_hash = await self.call_contract(
            from_address, "health_triage", {"input": input_data}
        )
        result = await self.get_result(tx_hash)
        return tx_hash, result


genlayer_client = GenLayerClient()
