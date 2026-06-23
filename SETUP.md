# TimeTrack — Setup Guide

This guide walks you through connecting **Google Sheets** (database) and deploying to **GitHub Pages** (hosting).

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
   | Description | `TimeTrack v1` |
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

1. Open `js/config.js` in this project
2. Paste your Web App URL:

```javascript
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/YOUR_ID_HERE/exec',
  // ...
};
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

## Part 2: GitHub Pages Deployment

### Step 1 — Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `timetrack` (or `payroll`)
3. Set to **Public** (required for free GitHub Pages)
4. Do **not** add README, .gitignore, or license (we have files already)
5. Click **Create repository**

---

### Step 2 — Push your code

Run these in Terminal from the project folder:

```bash
cd /Users/adityaranjandas/Desktop/FunWorld/Projects/payroll

git init
git add .
git commit -m "Initial TimeTrack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/timetrack.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `timetrack` with your actual GitHub username and repo name.

---

### Step 3 — Enable GitHub Pages

1. On GitHub, open your repo → **Settings → Pages**
2. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** → folder **/ (root)**
3. Click **Save**
4. Wait 1–2 minutes

Your app will be live at:

```text
https://YOUR_USERNAME.github.io/timetrack/
```

---

### Step 4 — Verify after deploy

1. Open your GitHub Pages URL on your phone
2. Confirm check-in works
3. Confirm data appears in Google Sheets
4. Optional: **Add to Home Screen** (PWA) from the browser menu

---

## Quick reference

| What | Where |
|------|-------|
| Web App URL | `js/config.js` → `API_URL` |
| Spreadsheet data | Google Sheet → Attendance / Settings / Shifts tabs |
| Live app URL | `https://USERNAME.github.io/REPO/` |
| Apps Script code | `google-apps-script/Code.gs` |
| Local testing | `python3 -m http.server 8765` → `http://localhost:8765` |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Badge still says "Local" | Set `API_URL` in `js/config.js` and hard-refresh |
| API returns HTML not JSON | Redeploy Web App; ensure URL ends with `/exec` |
| Permission denied on setup | Run `setupSheets()` again and approve permissions |
| Data not syncing | Check browser console (F12); verify "Anyone" access on deployment |
| GitHub Pages 404 | Confirm branch is `main`, folder is `/ (root)`, wait 2 min |
| Old data after script update | Deploy → New version in Apps Script |

---

## Security note

The Web App URL is public — anyone with the link can read/write your sheet. This is fine for personal use. Do not share the URL publicly if you want to keep data private.
