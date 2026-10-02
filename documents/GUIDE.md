# TimeTrack v2.0.0

Personal attendance app. React, saved in the browser, synced to Google Sheets.

Live site: https://aditya6371.github.io/timetrack/

The sidebar shows **v2.0.0**.

---

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually http://localhost:5173/.

| Screen | Address |
|---|---|
| Home | http://localhost:5173/#/ |
| Calendar | http://localhost:5173/#/calendar |
| Reports | http://localhost:5173/#/reports |
| Settings | http://localhost:5173/#/settings |

| Command | What it does |
|---|---|
| `npm run dev` | Local app. Reloads when you save. |
| `npm run deploy:docs` | Builds the site you deploy. |
| `npm run preview` | Opens the build so you can check it first. |

---

## Deploy

GitHub Actions already publishes the site when you push `main`. You build first, then push.

```bash
npm run deploy:docs
git add .
git commit -m "TimeTrack v2.0.0"
git push origin main
```

`npm run deploy:docs` writes the site into `dist/`. That folder is not committed. The action on `main` builds and publishes it.

When the action is green, hard-refresh https://aditya6371.github.io/timetrack/.

Do not commit `.env.local`, `node_modules`, or `dist`.

---

## If something breaks

Open the browser console with **Option + Command + I**, or read the terminal where `npm run dev` is running.

| What you see | What to do |
|---|---|
| Blank page locally | Fix the red error in the terminal, save, refresh. |
| Old site still showing | Unregister the service worker: Application → Service Workers → Unregister. Then hard-refresh. |
| Badge says Local | Put the Apps Script URL in `src/config.js` (`API_URL`) or in `.env.local` as `VITE_API_URL`. Restart `npm run dev`. |
| Sync fails on the live site | In Apps Script, set access to **Anyone** and deploy a new version. The URL must end with `/exec`. |
| Live site is 404 or still the old app | Open the Actions tab on GitHub and read the failed step. Push `main` again after `npm run deploy:docs` succeeds locally. |
| `npm run deploy:docs` fails | Fix the error it prints. Do not push until the build finishes. |

Sheet setup is in [SETUP.md](SETUP.md).

---

## What changed in v2.0.0

- React app: Home, Calendar, Reports, Settings.
- Statuses: Present, Work from home, Absent, Half day, Leave, Holiday, Checked in, Weekend. Each has its own calendar color.
- Dark theme is black with a light gradient. Light and System are in Settings.
- Check-in is blocked on weekends and on a day already marked Holiday.
- Weekend, Absent, Leave, and Holiday pay 0 hours. Future days are not counted as absent.
- Excel download from Reports: `Timesheet for {Month} {Year}.xlsx`.
- Same browser storage as before, so existing attendance on this computer stays.
