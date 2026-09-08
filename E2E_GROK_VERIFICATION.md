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

The first generation attempt was **blocked by Grok authentication**:

- `backend/.env` contained a non-empty `GROK_VIDEO_API_KEY`.
- The frontend successfully posted one generation request and received generation ID `gen_cab0d010e20f`.
- The backend record entered `processing`, then ended as `failed` with `All connection attempts failed`.
- A direct Provider request from the same backend environment reached the API and returned HTTP 401:

```json
{"code":"INVALID_API_KEY","message":"Invalid API key"}
```

The browser showed the expected failed state and no video element was rendered. Consequently, these acceptance checks were not completed against the external API:

- task creation with a valid key
- `queued → processing → completed`
- authenticated content download
- final `video_url` access
- browser MP4 playback

## How to Complete the Test

Replace the current key in `backend/.env` with a valid key accepted by `https://www.bb-api.com`:

```dotenv
GROK_VIDEO_BASE_URL=https://www.bb-api.com/v1
GROK_VIDEO_API_KEY=<real-api-key>
GROK_VIDEO_MODEL=grok-imagine-video-1.5
```

Start both services, open the Playground, select the Grok model, submit the test prompt with duration `5`, and verify the task status and playable MP4 URL. Do not commit `.env` or the API key.

## Notes

The Grok `validate_key()` implementation uses `GET /videos` as the authentication probe because the supplied API contract did not define a separate key-validation endpoint.
