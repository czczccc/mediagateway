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
| Frontend model option | Passed with temporary placeholder configuration | Isolated browser rendered `Grok - grok-imagine-video-1.5` after `GROK_VIDEO_API_KEY` was set to a non-secret local placeholder. The placeholder was not used for generation. |
| Frontend provider request | Passed | Browser loaded `/v1/providers` and `/v1/usage/estimate` successfully. |

## Generation Verification

The full generation test is **blocked** because no real Grok API key was available in the environment:

- Root `.env` and `backend/.env` were absent.
- The database contained no active Grok key.
- The uncredentialed create request returned HTTP 400:

```json
{"detail":"No active API key found for provider: grok"}
```

Consequently, these acceptance checks were not executed against the external API:

- task creation with a valid key
- `queued → processing → completed`
- authenticated content download
- final `video_url` access
- browser MP4 playback

## How to Complete the Test

Set the real key in `backend/.env`:

```dotenv
GROK_VIDEO_BASE_URL=https://www.bb-api.com/v1
GROK_VIDEO_API_KEY=<real-api-key>
GROK_VIDEO_MODEL=grok-imagine-video-1.5
```

Start both services, open the Playground, select the Grok model, submit the test prompt with duration `5`, and verify the task status and playable MP4 URL. Do not commit `.env` or the API key.

## Notes

The Grok `validate_key()` implementation uses `GET /videos` as the authentication probe because the supplied API contract did not define a separate key-validation endpoint.
