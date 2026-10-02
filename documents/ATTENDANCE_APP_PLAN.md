# Attendance Management System

**Shipped as TimeTrack v2.0.0.** This file is the original plan. The app you run is the React version in this repo. Day-to-day steps are in [GUIDE.md](GUIDE.md). Deploy with `npm run deploy:docs`, then push `main`. GitHub Actions publishes the site.

Live site: https://aditya6371.github.io/timetrack/

---

# Original plan

## Project Goal
Build a completely free attendance system with:
- Check-In / Check-Out
- Edit Check-In / Check-Out Times
- Settings (Employee ID, Name, Payable Hours, Shifts)
- Calendar View
- Monthly Excel Export (matches timesheet template)
- Mobile Responsive UI
- Modern Personal Dashboard UI
- GitHub Pages Deployment
- Google Sheets Database
- Google Apps Script API

---

# Architecture

```text
Browser
   ↓
GitHub Pages (Frontend)
   ↓
Google Apps Script (API)
   ↓
Google Sheets (Database)
   ↓
Excel Export
```

---

# Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, Vite (v2.0.0) |
| Font | Source Sans 3 |
| Calendar | Built in |
| Database | Google Sheets |
| API | Google Apps Script |
| Excel Export | SheetJS (xlsx) |
| Hosting | GitHub Pages. Deploy with `npm run deploy:docs`, then push `main` |
| Cost | $0 |

---

---

# Modern UI Design (Personal Use)

Designed as a **single-user personal dashboard** — clean, premium, and calm. Not a corporate admin panel. Think: Apple Health meets Linear — minimal chrome, beautiful typography, soft depth, and one-tap daily actions.

## Design Principles

| Principle | Application |
|-----------|-------------|
| **Personal first** | Greeting with your name, today's focus, no multi-user clutter |
| **Glanceable** | See status, hours, and month progress in under 2 seconds |
| **One-thumb friendly** | Primary actions reachable on mobile without stretching |
| **Quiet luxury** | Subtle gradients, soft shadows, no loud colors |
| **Motion with purpose** | Smooth transitions on check-in, card hover, page load — never distracting |

---

## Design System

### Color Palette

**Light theme**
```text
Background:     #F8FAFC (slate-50)
Surface:        #FFFFFF
Surface elevated: #FFFFFF + shadow
Primary:        #6366F1 (indigo-500)
Primary soft:   #EEF2FF (indigo-50)
Accent:         #14B8A6 (teal-500)
Text primary:   #0F172A (slate-900)
Text secondary: #64748B (slate-500)
Border:         #E2E8F0 (slate-200)
```

**Dark theme**
```text
Background:     #0B1120 (custom deep navy)
Surface:        #151D2E
Surface elevated: #1C2640
Primary:        #818CF8 (indigo-400)
Accent:         #2DD4BF (teal-400)
Text primary:   #F1F5F9
Text secondary: #94A3B8
Border:         #1E293B
```

### Status Colors (consistent across app)

| Status | Color | Badge style |
|--------|-------|-------------|
| Present | `#22C55E` | Soft green pill + dot |
| Absent | `#EF4444` | Soft red pill |
| Half Day | `#F59E0B` | Amber pill |
| Leave | `#3B82F6` | Blue pill |
| Weekend | `#94A3B8` | Muted gray pill |
| Checked In | `#6366F1` | Indigo pulse dot (live) |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Hero clock | Inter | 48–64px | 300 (light) |
| Page title | Inter | 24px | 600 |
| Card value | Inter | 28–32px | 700 |
| Body | Inter | 14–16px | 400 |
| Labels | Inter | 12px | 500, uppercase tracking |

### Spacing & Shape

- **Border radius:** `16px` cards, `12px` buttons, `24px` hero panel
- **Shadows:** `shadow-sm` default, `shadow-lg` on hover/hero
- **Max content width:** `480px` mobile-first, `960px` on desktop (centered)
- **Card padding:** `20–24px`
- **Gap grid:** `16px` mobile, `24px` desktop

### Components

| Component | Style |
|-----------|-------|
| **Primary button** | Full-width on mobile, indigo gradient `from-indigo-500 to-indigo-600`, white text, `h-14`, rounded-xl |
| **Secondary button** | Outline, slate border, ghost hover |
| **Stat card** | White/dark surface, soft shadow, icon top-left, big number, small label |
| **Status badge** | Rounded-full, tinted background (10% opacity of status color) |
| **Input** | Rounded-xl, focus ring indigo, floating label on settings |
| **Modal** | Bottom sheet on mobile, centered card on desktop, backdrop blur |
| **Nav bar** | Fixed bottom (mobile), sidebar (desktop), active tab = indigo + subtle glow |

---

## Dashboard Layout

### Desktop (1024px+)

```text
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] TimeTrack          [Jun 2026 ▾]     [🌙] [⚙ Settings] │
├──────────┬──────────────────────────────────────────────────────┤
│          │  Good evening, Aditya 👋                             │
│  Home ●  │  Tuesday, 23 June 2026                               │
│  Calendar│                                                      │
│  Reports │  ┌────────────────────────────────────────────────┐  │
│  Settings│  │           HERO — TODAY PANEL                   │  │
│          │  │                                                │  │
│          │  │     09:14:32          ● Checked In             │  │
│          │  │     ──────────          since 9:02 AM          │  │
│          │  │                                                │  │
│          │  │  In: 09:02 AM    Out: —        [Edit ✎]        │  │
│          │  │  Shift: General (09:00 AM - 06:00 PM)          │  │
│          │  │                                                │  │
│          │  │  [  ✓  Check Out  ]   (primary, large)         │  │
│          │  └────────────────────────────────────────────────┘  │
│          │                                                      │
│          │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│          │  │ 18 days  │ │ 142 hrs  │ │  2 days  │ │  96%   │ │
│          │  │ Present  │ │ This mo. │ │  Leave   │ │ Rate   │ │
│          │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│          │                                                      │
│          │  This Week ──────────────────────────── [See calendar]│
│          │  ┌────┬────┬────┬────┬────┬────┬────┐                │
│          │  │ M  │ T  │ W  │ T  │ F  │ S  │ S  │                │
│          │  │ 🟢 │ 🟢 │ 🟢 │ ●  │    │ ⚫ │ ⚫ │                │
│          │  └────┴────┴────┴────┴────┴────┴────┘                │
│          │                                                      │
│          │  Recent Activity                                       │
│          │  ┌────────────────────────────────────────────────┐  │
│          │  │ Mon 22 Jun   9:01 → 6:15 PM    8h   Present  │  │
│          │  │ Fri 20 Jun   9:10 → 6:05 PM    8h   Present  │  │
│          │  └────────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────┘
```

### Mobile (primary experience)

```text
┌─────────────────────────┐
│  Good evening, Aditya   │
│  Tue, 23 Jun 2026       │
│                         │
│  ┌───────────────────┐  │
│  │    09:14:32       │  │  ← live clock, light weight
│  │  ● Checked In     │  │  ← pulsing indigo dot
│  │                   │  │
│  │  In  09:02 AM     │  │
│  │  Out      —       │  │  ← tap row to edit
│  │                   │  │
│  │ [  Check Out  ]   │  │  ← full-width gradient btn
│  └───────────────────┘  │
│                         │
│  ┌─────────┐ ┌─────────┐│
│  │   18    │ │  142h   ││  ← 2x2 stat grid
│  │ Present │ │  Hours  ││
│  └─────────┘ └─────────┘│
│  ┌─────────┐ ┌─────────┐│
│  │    2    │ │   96%   ││
│  │  Leave  │ │  Rate   ││
│  └─────────┘ └─────────┘│
│                         │
│  This Week              │
│  M  T  W  T  F  S  S    │
│  🟢 🟢 🟢 ●  ·  ⚫ ⚫   │
│                         │
├─────────────────────────┤
│ 🏠   📅   📊   ⚙️        │  ← bottom nav, frosted glass
│ Home Cal  Rep  Set       │
└─────────────────────────┘
```

---

## Screen-by-Screen UI

### 1. Dashboard (Home)

**Hero panel** — gradient background (`indigo-50 → white` light / `indigo-950 → slate-900` dark)
- Live clock (updates every second)
- Dynamic greeting: Good morning / afternoon / evening + name from Settings
- Status pill with animated dot when checked in
- Today's in/out times (tappable → edit modal)
- Single dominant CTA: Check In **or** Check Out (context-aware, never both active)

**Stat cards** (4-up grid, 2x2 on mobile)
- Days Present
- Total Hours (month)
- Leave / Absent count
- Attendance Rate %

**Mini week strip** — last 7 days as colored dots, today highlighted with ring

**Recent activity** — last 3–5 days, swipeable list, tap to edit

**Empty state** (first visit)
- Friendly illustration area
- "Set up your profile" CTA → Settings
- Soft onboarding, no blocking modal

---

### 2. Calendar

- FullCalendar styled to match design system (rounded cells, no harsh borders)
- Month header with prev/next arrows + month picker dropdown
- Color-coded day cells with subtle background tint (not solid blocks)
- Today: indigo ring
- Tap date → **bottom sheet modal** (mobile) with edit form
- Legend bar at bottom: Present · Absent · Half · Leave · Weekend

---

### 3. Reports

- Month/year picker at top (pill selector)
- Large **Export Excel** button with download icon
- Preview table (scrollable) — matches export columns
- Summary row at top: total payable hours, present days, weekends
- Tap any row → edit modal

---

### 4. Settings

Grouped sections with clean dividers:

**Profile**
- Avatar placeholder (initials from name)
- Employee Name
- Employee ID *(optional, "Add later" hint)*

**Payroll**
- Default Payable Hours (number stepper: − 8 +)
- Payable Hours Rule (segmented control: Fixed | Actual | Manual)

**Shifts**
- List of shift cards with time range
- "+ Add Shift" ghost button
- Star icon on default shift

**Appearance**
- Theme toggle: Light | Dark | System (3-way segmented control)

**About**
- App version, last sync time, data source indicator

---

## Micro-interactions & Polish

| Interaction | Effect |
|-------------|--------|
| Check In tap | Button scales down → success checkmark animation → hero updates |
| Check Out tap | Brief confetti-free pulse on hours card |
| Card hover (desktop) | `translateY(-2px)` + shadow deepen |
| Page transition | Fade + slight slide up (150ms) |
| Loading | Skeleton shimmer on cards, not spinners |
| Sync indicator | Tiny cloud icon in header — synced / syncing / offline |
| Toast notifications | Bottom-center, auto-dismiss, icon + message |

---

## Personal Touch (single-user)

Since this is **your** app only:

- No login screen — open and use
- Name in greeting pulled from Settings
- No employee picker dropdown
- Optional: subtle gradient mesh background on hero (personal brand feel)
- Optional: month streak badge ("12 day streak") for motivation
- Settings accessible but tucked away — daily use is just Home

---

## Responsive Behavior

| Breakpoint | Layout change |
|------------|---------------|
| Mobile | Bottom nav, full-width hero, 2x2 stats, bottom sheet modals |
| Tablet | Bottom nav or compact sidebar, 4 stat cards in a row |
| Desktop | Left sidebar nav, wider hero, 4 stats inline, centered modals |

---

## Accessibility

- WCAG AA contrast on all text
- Focus rings on all interactive elements
- `prefers-reduced-motion` disables animations
- Touch targets minimum 44×44px
- Status never conveyed by color alone (always text label too)

---

# Features

## Dashboard
- Personalized greeting (Good morning/afternoon/evening + name)
- Live clock in hero panel
- Today's status with animated pulse when checked in
- Context-aware Check-In / Check-Out (single primary CTA)
- Today's times (tap to edit)
- 4 stat cards: Present days, Total hours, Leave/Absent, Attendance rate
- Mini week strip (7-day color dots)
- Recent activity list (last 5 days, tap to edit)
- Sync status indicator (online / offline / syncing)

## Calendar View
Status Colors:
- 🟢 Present
- 🔴 Absent
- 🟡 Half Day
- 🔵 Leave
- ⚫ Weekend

Clicking a date shows:
- Check-In Time (editable)
- Check-Out Time (editable)
- Total Hours (auto-recalculated on save)
- Status (auto-updated or manual override)
- Shift (from settings default, overridable per day)
- Comments (editable)
- **Save** / **Cancel** buttons

## Edit Time

Users can correct check-in and check-out after the fact.

### Where editing is available
- **Calendar** — tap any date → edit modal
- **Dashboard** — tap today's times → quick edit
- **Reports** — tap a row in the monthly list → edit modal

### Edit modal fields
| Field | Behavior |
|-------|----------|
| Check-In | Time picker (`HH:MM`) |
| Check-Out | Time picker (`HH:MM`) |
| Status | Dropdown: Present, Absent, Half Day, Leave, Weekend |
| Shift | Dropdown from Settings shift list |
| Comments | Free text |

### Auto-calculation on save
- **Total Hours** = Check-Out − Check-In (if both exist)
- **Payable Hours** = from Settings rule (see below), unless manually overridden
- If only check-in exists → status stays "Checked In"
- Validation: check-out must be after check-in (same day)

### API
- `PUT /attendance` — update an existing row by date + employee

## Settings

Central place to configure profile and payroll defaults. Values are used across the app and in Excel export.

### Settings screen (`settings.html`)

| Setting | Required | Default | Used in |
|---------|----------|---------|---------|
| Employee Name | Yes | — | Dashboard, export col B |
| Employee ID | No | *(empty)* | Export col A; can be added later |
| Default Payable Hours | Yes | `8` | Auto-fill on Present days |
| Payable Hours Rule | Yes | `fixed` | How payable hours are calculated |
| Default Shift | Yes | `General (09:00 AM - 06:00 PM)` | New attendance rows |
| Shift Options | Yes | 1 preset | Dropdown on calendar + export col I |
| Theme | No | `system` | Light / Dark / System |

### Payable hours rules (selectable in Settings)

| Rule | Description |
|------|-------------|
| **Fixed** | Always use Default Payable Hours on Present days (matches your June 2026 template) |
| **Actual** | Payable = min(Total Hours, Default Payable Hours) |
| **Manual** | User sets payable per day in edit modal; no auto-fill |

### Shift options (manageable in Settings)

- List of named shifts with start/end times
- Add, edit, remove shifts
- One shift marked as **default**
- Stored format: `General (09:00 AM - 06:00 PM)`

**Default presets:**
```text
General (09:00 AM - 06:00 PM)
Morning (06:00 AM - 02:00 PM)
Evening (02:00 PM - 10:00 PM)
```

### Settings storage

| Layer | Purpose |
|-------|---------|
| `localStorage` | Fast offline access, immediate UI updates |
| Google Sheet `Settings` tab | Synced backup, survives device change |
| Google Sheet `Shifts` tab | Shift list shared across devices |

### Settings → Excel mapping

Excel export reads **Settings first**, then attendance data:

| Excel Column | Source |
|--------------|--------|
| A — Employee ID | Settings → Employee ID *(blank if not set)* |
| B — Employee Name | Settings → Employee Name |
| G — Payable Hours | Settings rule + Default Payable Hours |
| I — Shift(s) | Per-day shift, or Settings → Default Shift |

## Attendance Records

| Column |
|----------|
| Employee ID |
| Employee Name |
| Date |
| Check-In |
| Check-Out |
| Total Hours |
| Payable Hours |
| Status |
| Shift |
| Comments |

---

# Google Sheet Structure

## Tab: `Attendance`

| Column | Description |
|----------|-------------|
| A | Employee ID |
| B | Employee Name |
| C | Date |
| D | Check-In |
| E | Check-Out |
| F | Total Hours |
| G | Payable Hours |
| H | Status |
| I | Shift |
| J | Comments |

## Tab: `Settings`

One row per user/device (key-value pairs):

| Key | Example Value |
|-----|---------------|
| employeeName | Aditya Ranjan Das |
| employeeId | *(empty or EMP001)* |
| defaultPayableHours | 8 |
| payableHoursRule | fixed |
| defaultShiftId | shift_1 |
| theme | system |

## Tab: `Shifts`

| Column | Description |
|----------|-------------|
| A | Shift ID |
| B | Label (e.g. General (09:00 AM - 06:00 PM)) |
| C | Start Time |
| D | End Time |
| E | Is Default (TRUE/FALSE) |

---

# API Endpoints

## POST /checkin
Stores:
- Employee
- Date
- Check-In Time

## POST /checkout
Stores:
- Check-Out Time
- Hours Worked
- Payable Hours

## GET /attendance
Returns monthly attendance records.

## PUT /attendance
Updates an existing record (edit time flow):
- Date
- Check-In / Check-Out
- Total Hours (computed server-side)
- Payable Hours (from settings rule)
- Status, Shift, Comments

## GET /settings
Returns user settings + shift list.

## PUT /settings
Saves settings (name, employee ID, payable hours, default shift).

## POST /shifts
Adds a shift option.

## PUT /shifts
Updates a shift option.

## DELETE /shifts
Removes a shift option.

---

# Excel Export

Based on template: `Timesheet for June 2026.xlsx`

### Filename
```text
Timesheet for {Month} {Year}.xlsx
```
Example: `Timesheet for June 2026.xlsx`

### Row structure
- **One row per calendar day** in the selected month (not just punch days)
- Weekends auto-filled: Status = `Weekend`, hours = `0`
- Weekdays with no record: Status = `Absent`, hours = `0`

### Columns (matches template exactly)

| Col | Header | Source |
|-----|--------|--------|
| A | Employee Id | Settings → Employee ID |
| B | Employee Name | Settings → Employee Name |
| C | Date | Calendar date (Excel date format) |
| D | Check-In | Attendance record (Excel time format) |
| E | Check-Out | Attendance record (Excel time format) |
| F | Total Hours | Calculated (Excel duration format) |
| G | Payable Hours | Settings rule applied |
| H | Status | Present / Absent / Half Day / Leave / Weekend |
| I | Shift(s) | Per-day shift or Settings default |
| J | Comments | Per-day comments |

### Payable hours in export (by rule)
- **Fixed** → Default Payable Hours on Present; `0` on Weekend/Absent
- **Actual** → min(Total Hours, Default Payable Hours)
- **Manual** → stored per-day value

### Excel cell formats (important)
- Date: `DD-MMM-YYYY`
- Time: `HH:MM:SS`
- Hours: stored as fraction of day (`8h` = `0.3333…`)

---

# Mobile Experience

Built **mobile-first** — phone is the primary device for daily check-in/out.

## Mobile Dashboard
- Full-width hero with gradient background
- Live clock + status at top (most glanceable area)
- One large Check-In / Check-Out button (thumb zone)
- 2×2 stat card grid
- Horizontal week strip
- Frosted glass bottom navigation bar

### Navigation (bottom bar)
| Tab | Icon | Label |
|-----|------|-------|
| Home | house | Home |
| Calendar | calendar | Calendar |
| Reports | bar-chart | Reports |
| Settings | gear | Settings |

Active tab: indigo icon + soft glow underline

### User Flow

Check-In:
1. Open App
2. Tap Check-In
3. Timestamp Saved

Check-Out:
1. Open App
2. Tap Check-Out
3. Hours Calculated

---

# Progressive Web App (PWA)

Features:
- Add to Home Screen
- Offline Support
- App-Like Experience
- Auto Sync when Online

---

# Dark Mode

Three-way toggle in Settings (segmented control):

| Mode | Behavior |
|------|----------|
| Light | Soft slate background, white cards |
| Dark | Deep navy background, elevated dark cards |
| System | Follows `prefers-color-scheme` |

- Hero gradient adapts per theme
- Status colors stay vivid in both modes
- Smooth 200ms cross-fade on theme switch

---

# Responsive Breakpoints

| Device | Width |
|----------|----------|
| Mobile | 0-767px |
| Tablet | 768-1023px |
| Desktop | 1024px+ |

---

# Security

Future Enhancements:
- Google Login
- Location Tracking
- IP Tracking
- Admin Dashboard
- Leave Management

---

# Deployment

## GitHub Pages

```bash
npm run deploy:docs
git add .
git commit -m "TimeTrack v2.0.0"
git push origin main
```

GitHub Actions already deploys when `main` is pushed.

```text
https://aditya6371.github.io/timetrack/
```

---

# Development Roadmap

Phase 1:
- Design system (colors, typography, components)
- Dashboard UI (hero, stats, week strip, activity)
- Settings screen (profile, payroll, shifts, theme)

Phase 2:
- Check-In / Check-Out

Phase 3:
- Google Sheets Integration (Attendance + Settings + Shifts tabs)

Phase 4:
- Calendar View + Edit Time modal

Phase 5:
- Excel Export (full-month template format)

Phase 6:
- Mobile Optimization

Phase 7:
- Deployment

---

# Estimated Build Time

10–12 Hours

---

# Final Deliverables

✅ Dashboard

✅ Calendar

✅ Attendance Tracking

✅ Edit Check-In / Check-Out Times

✅ Settings (Employee ID, Name, Payable Hours, Shifts)

✅ Excel Export (timesheet template format)

✅ Mobile Responsive

✅ PWA

✅ Google-Style UI

✅ Modern Personal Dashboard UI

✅ Dark / Light / System themes

✅ Completely Free Deployment
