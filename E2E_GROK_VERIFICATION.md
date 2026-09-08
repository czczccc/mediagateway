# Grok Video End-to-End Verification

## Test Case

- Model: `grok-imagine-video-1.5`
- Prompt: `A red apple spinning slowly on a white background`
- Duration: `5`
- Provider API: `https://www.bb-api.com/v1`

## Environment Checks

| Check | Result | Evidence |
|---|---|---|
| Backend startup | Passed | `http://127.0.0.1:3001/health` returned `{"status":"healthy"}` after creating the runtime `backend/storage` directories. |
| Provider registration | Passed | `GET /v1/providers` returned provider `grok` and model `grok-imagine-video-1.5`. |
| Frontend startup | Passed | Vite served `http://127.0.0.1:3000/`. |
| Frontend model option | Passed | Isolated browser rendered `Grok - grok-imagine-video-1.5` with the configured Key. |
| Frontend provider request | Passed | Browser loaded `/v1/providers` and `/v1/usage/estimate` successfully. |

## Generation Verification

### Successful Retry

- The frontend sent `POST /v1/video/generations` and received HTTP 200.
- Generation ID: `gen_32cf80e386c6`
- State sequence: `queued` (creation response) → `processing` → `completed`.
- Prompt and duration were preserved: `A red apple spinning slowly on a white background`, `5` seconds.
- The completed response contained:

```json
{
  "status": "completed",
  "video": {
    "url": "http://localhost:3001/videos/gen_32cf80e386c6.mp4",
    "duration": 5.0,
    "width": 1280,
    "height": 720
  }
}
```

- The video URL returned HTTP 200 with `Content-Type: video/mp4`.
- The stored MP4 was 545,130 bytes and began with an ISO Base Media File Format header.
- In the isolated browser, the video reported `readyState=4`, `duration=5.041667`, and no media error. After a user-style click, playback advanced to `currentTime=0.298855` with `paused=false`.

### Previous Failed Attempt

The first generation attempt was blocked by Grok authentication:

- `backend/.env` contained a non-empty `GROK_VIDEO_API_KEY`.
- The frontend successfully posted one generation request and received generation ID `gen_cab0d010e20f`.
- The backend record entered `processing`, then ended as `failed` with `All connection attempts failed`.
- A direct Provider request from the same backend environment reached the API and returned HTTP 401:

```json
{"code":"INVALID_API_KEY","message":"Invalid API key"}
```

The Key was replaced before the successful retry. No code change was required for the authentication failure.

## Reproduction

Configure a valid key accepted by `https://www.bb-api.com` in `backend/.env`:

```dotenv
GROK_VIDEO_BASE_URL=https://www.bb-api.com/v1
GROK_VIDEO_API_KEY=<real-api-key>
GROK_VIDEO_MODEL=grok-imagine-video-1.5
```

Start both services, open the Playground, select the Grok model, submit the test prompt with duration `5`, and verify the task status and playable MP4 URL. Do not commit `.env` or the API key.

## Notes

The Grok `validate_key()` implementation uses `GET /videos` as the authentication probe because the supplied API contract did not define a separate key-validation endpoint.
