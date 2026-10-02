# TimeTrack — Setup Guide

**TimeTrack v2.0.0.** Connect Google Sheets, then deploy with `npm run deploy:docs`.

---

## Part 1: Google Sheets + Apps Script

### Step 1 — Create the spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **Blank spreadsheet**
3. Name it **TimeTrack** (or any name you like)

You do **not** need to create tabs manually — the script does that for you.

---

### Step 2 — Add the Apps Script

1. In the spreadsheet: **Extensions → Apps Script**
2. Delete any code in `Code.gs`
3. Open `google-apps-script/Code.gs` from this project, copy all of it, paste into Apps Script
4. Click **Save** (name the project `TimeTrack API`)

---

### Step 3 — Run one-time setup

1. In Apps Script, select the function **`setupSheets`** from the dropdown
2. Click **Run**
3. Google will ask for permissions → **Review permissions → Allow**
4. Check your spreadsheet — you should see 3 tabs:
   - **Attendance** — daily records
   - **Settings** — your profile & payroll rules
   - **Shifts** — shift options

---

### Step 4 — Deploy as Web App

1. In Apps Script: **Deploy → New deployment**
2. Click the gear icon → select **Web app**
3. Set:
   | Field | Value |
   |-------|-------|
   | Description | `TimeTrack v2.0.0` |
   | Execute as | **Me** |
   | Who has access | **Anyone** |
4. Click **Deploy**
5. **Copy the Web App URL** — it looks like:
   ```text
   https://script.google.com/macros/s/AKfycb.../exec
   ```

> **Important:** Choose **Anyone**, not "Anyone with Google account". This lets your GitHub Pages app call the API without login.

---

### Step 5 — Connect the frontend

1. Open `src/config.js`
2. Paste your Web App URL into `API_URL`, or create a gitignored `.env.local`:

```bash
VITE_API_URL=https://script.google.com/macros/s/YOUR_ID_HERE/exec
```

3. Save the file
4. Refresh the app — the top badge should show **Sheets** instead of **Local**
5. Test: check in on the dashboard, then look at the **Attendance** tab in your spreadsheet

---

### Step 6 — Test the API (optional)

Open this URL in your browser (replace with your URL):

```text
https://script.google.com/macros/s/YOUR_ID/exec?action=ping
```

You should see:

```json
{"ok":true,"message":"TimeTrack API","version":"1.0"}
```

---

### Updating the script later

If you change `Code.gs`:

1. Apps Script → **Deploy → Manage deployments**
2. Click the pencil icon on your deployment
3. Change **Version** to **New version**
4. Click **Deploy**

The Web App URL stays the same — no need to update `config.js`.

---

## Part 2: Deploy

Details are in [GUIDE.md](GUIDE.md). Short version:

```bash
npm install
npm run dev
```

When you are ready to publish:

```bash
npm run deploy:docs
git add .
git commit -m "TimeTrack v2.0.0"
git push origin main
```

GitHub Actions already deploys when `main` is pushed. `npm run deploy:docs` builds the site first so you catch errors before the push.

---

## Quick reference

| What | Where |
|------|-------|
| Web App URL | `src/config.js` → `API_URL`, or `VITE_API_URL` in `.env.local` |
| Spreadsheet data | Google Sheet → Attendance / Settings / Shifts tabs |
| Live app URL | `https://aditya6371.github.io/timetrack/` |
| Apps Script code | `google-apps-script/Code.gs` |
| Version | **v2.0.0** (sidebar, and `package.json`) |
| Local testing | `npm run dev` |
| Deploy | `npm run deploy:docs`, then push `main` |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Badge still says "Local" | Set `API_URL` in `src/config.js` and restart `npm run dev` |
| API returns HTML not JSON | Redeploy Web App; ensure URL ends with `/exec` |
| Permission denied on setup | Run `setupSheets()` again and approve permissions |
| Data not syncing | Check browser console (F12); verify "Anyone" access on deployment |
| GitHub Pages 404 | Run `npm run deploy:docs`, push `main`, then check the Actions tab |
| Old data after script update | Deploy → New version in Apps Script |

---

## Security note

The Web App URL is public — anyone with the link can read/write your sheet. This is fine for personal use. Do not share the URL publicly if you want to keep data private.
