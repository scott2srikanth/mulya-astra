# Google Sheets submission workflow

1. Create a Google Sheet and open **Extensions → Apps Script**.
2. Paste `Code.gs` into the Apps Script editor.
3. In **Project Settings → Script properties**, add:
   - `APP_BASE_URL`: the public HTTPS URL of this application.
   - `WEBHOOK_SECRET`: the same strong secret configured as `GOOGLE_SHEETS_WEBHOOK_SECRET` on the application.
   - `DRIVE_FOLDER_ID`: the ID of the Drive folder that will hold generated reports.
   - `SHARE_REPORTS_WITH_LINK`: `true` only if link-accessible reports are acceptable under school policy.
   - Optional `ASSIGNMENT_SPEC_JSON`: an exported assignment rubric JSON shared by every row.
4. Run `setupMulyaAstra` once and approve the requested Sheets, Drive, Docs, and external-request permissions.
5. Students fill the first four columns. Adding a canonical GitHub URL starts the evaluation.

The installed edit trigger submits new links. The Status column shows **Queued**, **In Progress**, or **Completed**, and the adjacent **Queue Position** column displays `1`, `2`, `3`, and so on for waiting rows. Positions are refreshed during polling and cleared when processing starts. The application processes exactly one repository at a time by default (`EVALUATION_CONCURRENCY=1`); every additional row remains queued until the active evaluation finishes. A five-minute scheduled trigger checks evaluations, creates a Google Doc and PDF, stores them in Drive, and writes the PDF link, score, grade, and status into the sheet. Evaluation IDs make the flow idempotent; use `retrySelectedRow` to intentionally resubmit a row.

For production, use HTTPS, rotate the webhook secret, restrict Apps Script editors, keep link sharing disabled unless required, and apply the institution's Drive retention/access policy.
