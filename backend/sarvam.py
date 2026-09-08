import base64
import os

import httpx
from fastapi import HTTPException

ASR_LANGUAGES = {"as-IN", "mni-IN", "hi-IN", "bn-IN", "en-IN"}
# Bulbul v3 TTS does not support Assamese (as-IN) or Manipuri/Meitei (mni-IN).
TTS_LANGUAGES = {"hi-IN", "bn-IN", "en-IN"}


def _base_url() -> str:
    return os.getenv("SARVAM_BASE_URL", "https://api.sarvam.ai")


def _headers() -> dict:
    key = os.environ.get("SARVAM_API_KEY", "")
    if not key:
        raise HTTPException(503, "Voice service not configured")
    return {"api-subscription-key": key}


async def transcribe(audio_base64: str, source_language: str) -> dict:
    if source_language not in ASR_LANGUAGES:
        raise HTTPException(422, f"Unsupported ASR language: {source_language}")
    try:
        audio = base64.b64decode(audio_base64, validate=True)
    except Exception:
        raise HTTPException(422, "audio_base64 must be standard base64")
    files = {"file": ("recording.m4a", audio, "audio/mp4")}
    data = {"model": "saaras:v3", "language_code": source_language}
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                f"{_base_url()}/speech-to-text",
                headers=_headers(),
                files=files,
                data=data,
            )
        except httpx.RequestError:
            raise HTTPException(504, "Voice service unreachable")
    if resp.status_code != 200:
        raise HTTPException(502, f"Sarvam ASR failed ({resp.status_code})")
    payload = resp.json()
    return {
        "transcribed_text": payload.get("transcript", ""),
        "language_code": payload.get("language_code"),
    }


async def synthesize(text: str, target_language: str) -> dict:
    if target_language not in TTS_LANGUAGES:
        raise HTTPException(
            422,
            "Sarvam TTS does not support Assamese/Manipuri. Use hi-IN, bn-IN, or en-IN.",
        )
    body = {
        "text": text[:2500],
        "language_code": target_language,
        "model": "bulbul:v3",
        "speaker": "shubh",
        "output_audio_codec": "wav",
        "speech_sample_rate": 24000,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                f"{_base_url()}/text-to-speech",
                headers={**_headers(), "Content-Type": "application/json"},
                json=body,
            )
        except httpx.RequestError:
            raise HTTPException(504, "Voice service unreachable")
    if resp.status_code != 200:
        raise HTTPException(502, f"Sarvam TTS failed ({resp.status_code})")
    payload = resp.json()
    audios = payload.get("audios") or []
    if not audios:
        raise HTTPException(502, "Sarvam TTS returned no audio")
    return {"audio_base64": audios[0]}
