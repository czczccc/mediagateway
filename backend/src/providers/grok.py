"""Grok Imagine video provider implementation."""
from typing import Optional
from urllib.parse import urljoin

import httpx

from ..config import get_settings
from .base import ProviderFeatures, VideoProvider, VideoRequest, VideoResponse


class GrokProvider(VideoProvider):
    """Provider adapter for the Grok Imagine video API."""

    DEFAULT_BASE_URL = "https://www.bb-api.com/v1"
    DEFAULT_MODEL = "grok-imagine-video-1.5"

    def __init__(self, api_key: Optional[str] = None):
        settings = get_settings()
        super().__init__(api_key or settings.grok_video_api_key or "")
        self.base_url = (
            settings.grok_video_base_url or self.DEFAULT_BASE_URL
        ).rstrip("/")
        self.model = settings.grok_video_model or self.DEFAULT_MODEL

    @property
    def name(self) -> str:
        return "grok"

    @property
    def models(self) -> list[str]:
        return [self.model]

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def validate_key(self) -> bool:
        """Validate the key using the provider's video listing endpoint."""
        if not self.api_key:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/videos",
                    headers=self._headers(),
                )
                return response.status_code == 200
        except httpx.HTTPError:
            return False

    async def generate_video(self, request: VideoRequest) -> VideoResponse:
        """Create an asynchronous Grok video generation request."""
        payload = {
            "model": getattr(request, "model", None) or self.model,
            "prompt": request.prompt,
        }
        if request.duration is not None:
            payload["duration"] = request.duration

        image_url = getattr(request, "image_url", None)
        if image_url:
            payload["image_url"] = image_url

        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{self.base_url}/videos",
                    headers=self._headers(),
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                request_id = data.get("request_id")

                if not request_id:
                    return VideoResponse(
                        job_id="",
                        status="failed",
                        error="Grok API response did not include request_id",
                        metadata=data,
                    )

                return VideoResponse(
                    job_id=request_id,
                    status="processing",
                    metadata=data,
                )
        except httpx.HTTPStatusError as exc:
            return VideoResponse(
                job_id="",
                status="failed",
                error=f"HTTP {exc.response.status_code}: {exc.response.text}",
            )
        except httpx.HTTPError as exc:
            return VideoResponse(job_id="", status="failed", error=str(exc))
        except Exception as exc:
            return VideoResponse(job_id="", status="failed", error=str(exc))

    async def check_status(self, job_id: str) -> VideoResponse:
        """Get and normalize the status of a Grok video request."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/videos/{job_id}",
                    headers=self._headers(),
                )
                response.raise_for_status()
                data = response.json()

                status_map = {
                    "queued": "processing",
                    "pending": "processing",
                    "processing": "processing",
                    "running": "processing",
                    "done": "completed",
                    "completed": "completed",
                    "failed": "failed",
                    "error": "failed",
                    "cancelled": "failed",
                    "canceled": "failed",
                }
                raw_status = str(data.get("status", "processing")).lower()
                status = status_map.get(raw_status, "processing")

                video_url = None
                if status == "completed":
                    video = data.get("video") or {}
                    source_url = video.get("url")
                    if source_url:
                        video_url = urljoin(f"{self.base_url}/", source_url)

                return VideoResponse(
                    job_id=job_id,
                    status=status,
                    video_url=video_url,
                    metadata=data,
                )
        except httpx.HTTPStatusError as exc:
            return VideoResponse(
                job_id=job_id,
                status="failed",
                error=f"HTTP {exc.response.status_code}: {exc.response.text}",
            )
        except httpx.HTTPError as exc:
            return VideoResponse(job_id=job_id, status="failed", error=str(exc))
        except Exception as exc:
            return VideoResponse(job_id=job_id, status="failed", error=str(exc))

    def get_supported_features(self) -> ProviderFeatures:
        """Return capabilities exposed by the Grok video API contract."""
        return ProviderFeatures(
            supports_duration=True,
            supports_aspect_ratio=False,
            supports_seed=False,
            supports_fps=False,
            supports_image_to_video=True,
            supports_video_to_video=False,
            max_duration=10,
            available_aspect_ratios=[],
        )
