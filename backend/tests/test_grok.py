import asyncio
import os
import unittest
from unittest.mock import patch

import httpx

from src.providers.base import VideoRequest
from src.providers.grok import GrokProvider


class FakeAsyncClient:
    response = None
    requests = []

    def __init__(self, *args, **kwargs):
        self.timeout = kwargs.get("timeout")

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return False

    async def post(self, url, **kwargs):
        self.__class__.requests.append(("POST", url, kwargs))
        return self.__class__.response

    async def get(self, url, **kwargs):
        self.__class__.requests.append(("GET", url, kwargs))
        return self.__class__.response


class GrokProviderTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(
            os.environ,
            {
                "GROK_VIDEO_BASE_URL": "https://example.test/v1",
                "GROK_VIDEO_MODEL": "grok-imagine-video-1.5",
            },
            clear=False,
        )
        self.env.start()
        self.client = patch("src.providers.grok.httpx.AsyncClient", FakeAsyncClient)
        self.client.start()
        FakeAsyncClient.requests = []

    def tearDown(self):
        self.env.stop()
        self.client.stop()

    def test_generate_video_creates_task_and_returns_request_id(self):
        FakeAsyncClient.response = httpx.Response(
            200,
            json={"request_id": "request-123"},
            request=httpx.Request("POST", "https://example.test/v1/videos"),
        )
        provider = GrokProvider("test-key")

        result = asyncio.run(
            provider.generate_video(
                VideoRequest(prompt="A paper boat on a lake", duration=5)
            )
        )

        self.assertEqual(result.job_id, "request-123")
        self.assertEqual(result.status, "processing")
        method, url, kwargs = FakeAsyncClient.requests[0]
        self.assertEqual(method, "POST")
        self.assertEqual(url, "https://example.test/v1/videos")
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer test-key")
        self.assertEqual(
            kwargs["json"],
            {
                "model": "grok-imagine-video-1.5",
                "prompt": "A paper boat on a lake",
                "duration": 5,
            },
        )

    def test_check_status_maps_done_and_resolves_content_url(self):
        FakeAsyncClient.response = httpx.Response(
            200,
            json={
                "status": "done",
                "progress": 100,
                "video": {
                    "duration": 5,
                    "url": "/v1/videos/request-123/content",
                },
            },
            request=httpx.Request("GET", "https://example.test/v1/videos/request-123"),
        )
        provider = GrokProvider("test-key")

        result = asyncio.run(provider.check_status("request-123"))

        self.assertEqual(result.job_id, "request-123")
        self.assertEqual(result.status, "completed")
        self.assertEqual(
            result.video_url,
            "https://example.test/v1/videos/request-123/content",
        )
        self.assertEqual(result.metadata["progress"], 100)


if __name__ == "__main__":
    unittest.main()
