# TimeTrack v2.0.0

Personal attendance app. Check in, edit a day, see the month, and download a timesheet. Data stays in the browser and syncs to Google Sheets.

The app shows **v2.0.0** next to the name in the sidebar.

Live site: https://aditya6371.github.io/timetrack/

## Run

```bash
npm install
npm run dev
```

## Deploy

GitHub Pages publishes the `docs` folder when you push `main`.

```bash
npm run deploy:docs
git add docs
git commit -m "Publish TimeTrack v2.0.0"
git push origin main
```

`npm run deploy:docs` builds the site into `docs/`. Commit that folder. Do not commit `node_modules` or `.env.local`.

## Docs

| File | What it is |
|---|---|
| [GUIDE.md](documents/GUIDE.md) | Run, deploy, and fix common problems |
| [SETUP.md](documents/SETUP.md) | Google Sheets and Apps Script setup |

## v2.0.0

React app with Home, Calendar, Reports, and Settings. Statuses are Present, Work from home, Absent, Half day, Leave, Holiday, Checked in, and Weekend, each with its own calendar color. Dark theme is black with a light gradient. Sheets is still the database.
