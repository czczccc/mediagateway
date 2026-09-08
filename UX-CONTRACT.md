# UX Contract

## Product context

- **Audience:** 中文 AI 视频创作者
- **Primary jobs:** 生成视频、掌握成本、播放和管理成片
- **Active locale:** `zh-CN`
- **Accessibility target:** WCAG 2.2 AA baseline

## Visual contract

- **Project design:** `DESIGN.md`
- **Token ownership:** Existing runtime CSS variables in `frontend/src/index.css`; `DESIGN.md` mirrors accepted semantic roles.
- **Runtime source:** Tailwind CSS variables and shared components in `frontend/src/components/ui/`
- **Supported themes:** Existing light/dark token structure; this task preserves the existing theme mechanism.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native `select` | Existing page controls | native | Build + browser keyboard check |
| Date | Native `input[type=date]` | Existing Usage page | native | Build + locale check |
| Form | Page-local React state | Existing Playground flow | create | API-preserving E2E |
| CRUD | Existing page/API flow | Backend routes | return/stay | Generation + gallery E2E |

## Component behavior

| Component | Default | Hover | Focus | Active | Disabled | Busy | Error |
|---|---|---|---|---|---|---|---|
| Button | Primary/secondary intent | Color shift | Visible ring | Darker tone | Reduced opacity | Stable size + busy label | Inline message |
| Input | Labeled field | Border emphasis | Visible ring | Native | Disabled input | Preserve value | Inline error |
| Textarea | Labeled prompt field | Border emphasis | Visible ring | Native | Disabled input | Preserve value | Form-level message |
| Video | Controls visible | Native controls | Native focus | Native | N/A | Status card before ready | Playback fallback text |

## Flow ledger

| Operation | Trigger | Pending | Success destination | Success feedback | Failure recovery |
|---|---|---|---|---|---|
| Create | 开始生成 | Button locked; status card polls | Stay on 创作中心 | Show completed state and video | Inline error; preserve prompt |
| Delete | 删除 | Confirmation dialog | Stay in 作品库 | Refresh current list | Inline error; preserve list |
| Filter | Provider/status select | List loading state | Stay in 作品库 | Updated result set | Empty/no-result message |

## Navigation and responsive behavior

- Route titles and navigation use the `zh-CN` locale.
- Desktop uses a two-column 创作中心 workspace; narrow screens use a single column.
- Video media reserves its aspect-ratio box to prevent layout shift.
- Native select/date controls remain the canonical controls for this scope.

## Async and resilience

- Generation remains queued/processing/completed/failed through the existing polling flow.
- Duplicate generation is prevented while the existing request is pending.
- Prompt and parameters remain visible until the task completes or fails.
- Existing API/server error text may be shown as a technical detail after a localized user-facing prefix.

## Validation

- Prompt is required by the existing client validation.
- Prompt input shows a localized character count, exposes an app-owned clear action when non-empty, and offers localized example prompts that replace the current draft without changing the API contract.
- API behavior and request payloads remain unchanged.
- API key fields remain masked and are not placed in URLs or client storage.

## Verification

- Required command: `npm run build`
- Type check: `npm run type-check`
- Browser: generation page, video library, cost display, completed video playback, and narrow viewport.
- Generation status cards provide localized queued/processing/completed/failed labels and a short next-step hint.
