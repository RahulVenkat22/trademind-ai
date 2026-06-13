"""Ollama integration for AI trading decisions."""
import json
import logging
import re

import requests
from django.conf import settings

logger = logging.getLogger("apps.trading")


class OllamaService:
    """Thin client over the Ollama /api/generate endpoint."""

    def __init__(self):
        self.base_url = settings.OLLAMA["BASE_URL"].rstrip("/")
        self.model = settings.OLLAMA["MODEL"]
        self.timeout = settings.OLLAMA["TIMEOUT"]

    def generate(self, prompt: str) -> str:
        """Send a prompt to Ollama and return the full text response.

        Uses streaming: Ollama emits one JSON object per line and we
        accumulate the `response` fields. Streaming is more reliable than a
        single buffered response for long local generations.
        """
        url = f"{self.base_url}/api/generate"
        resp = requests.post(
            url,
            json={"model": self.model, "prompt": prompt},
            stream=True,
            timeout=self.timeout,
        )
        resp.raise_for_status()

        final_text = ""
        for line in resp.iter_lines():
            if not line:
                continue
            try:
                data = json.loads(line.decode("utf-8"))
            except json.JSONDecodeError:
                continue
            final_text += data.get("response", "")
        print(f"This was the final text : {final_text}")
        return final_text

    def generate_json(self, prompt: str) -> dict | None:
        """Generate and parse the first JSON object out of the response."""
        try:
            text = self.generate(prompt)
        except requests.RequestException as exc:
            logger.warning("Ollama request failed: %s", exc)
            return None
        return _extract_json(text)


def _extract_json(text: str) -> dict | None:
    """Best-effort extraction of a JSON object from an LLM response."""
    if not text:
        return None
    # Try a direct parse first.
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Fall back to the first {...} block.
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
    return None
