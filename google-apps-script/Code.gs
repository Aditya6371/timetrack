/**
 * TimeTrack — Google Apps Script API
 *
 * SETUP:
 * 1. Create a Google Sheet (see SETUP.md)
 * 2. Extensions → Apps Script → paste this file
 * 3. Run setupSheets() once from the editor (authorize when prompted)
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL into js/config.js → API_URL
 */

const SHEETS = {
  ATTENDANCE: 'Attendance',
  SETTINGS: 'Settings',
  SHIFTS: 'Shifts',
};

const ATTENDANCE_HEADERS = [
  'Employee ID', 'Employee Name', 'Date', 'Check-In', 'Check-Out',
  'Total Hours', 'Payable Hours', 'Status', 'Shift', 'Comments',
];

const SHIFT_HEADERS = ['Shift ID', 'Label', 'Start', 'End', 'Is Default'];

/** getRange(row, col, numRows, numCols) — pass end row/col here for clarity */
function rangeRect(sheet, startRow, startCol, endRow, endCol) {
  return sheet.getRange(startRow, startCol, endRow - startRow + 1, endCol - startCol + 1);
}

// ─── HTTP handlers ───

function doGet(e) {
  return handleRequest(e, null);
}

function doPost(e) {
  let body = {};
  if (e.postData && e.postData.contents) {
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }
  }
  return handleRequest(e, body);
}

function handleRequest(e, body) {
  try {
    const action = ((body && body.action) || (e.parameter && e.parameter.action) || '').toLowerCase();
    let result;

    switch (action) {
      case 'ping':
        result = { ok: true, message: 'TimeTrack API', version: '1.0' };
        break;
      case 'attendance':
        result = {
          records: getAttendance(
            (body && body.year) || e.parameter.year,
            (body && body.month) || e.parameter.month
          ),
        };
        break;
      case 'attendance_all':
        result = { records: getAllAttendance() };
        break;
      case 'settings':
        result = { settings: getSettings(), shifts: getShifts() };
        break;
      case 'save_record':
        result = { record: saveRecord(body.record) };
        break;
      case 'save_settings':
        saveSettings(body.settings);
        if (body.shifts) saveShifts(body.shifts);
        result = { ok: true };
        break;
      case 'setup':
        setupSheets();
        result = { ok: true, message: 'Sheets created' };
        break;
      default:
        result = { ok: true, message: 'TimeTrack API', hint: 'Use ?action=ping' };
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: String(err.message || err) }, 500);
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// ─── One-time setup ───

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let att = ss.getSheetByName(SHEETS.ATTENDANCE);
  if (!att) {
    att = ss.insertSheet(SHEETS.ATTENDANCE);
    att.getRange(1, 1, 1, ATTENDANCE_HEADERS.length).setValues([ATTENDANCE_HEADERS]);
    att.setFrozenRows(1);
    att.getRange('A1:J1').setFontWeight('bold').setBackground('#f3f4f6');
  }

  let settings = ss.getSheetByName(SHEETS.SETTINGS);
  if (!settings) {
    settings = ss.insertSheet(SHEETS.SETTINGS);
    settings.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]);
    settings.setFrozenRows(1);
    settings.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f3f4f6');
    const defaults = [
      ['employeeName', ''],
      ['employeeId', ''],
      ['defaultPayableHours', '8'],
      ['payableHoursRule', 'fixed'],
      ['weeklyHoursGoal', '40'],
      ['defaultShiftId', 'shift_1'],
      ['theme', 'system'],
    ];
    rangeRect(settings, 2, 1, defaults.length + 1, 2).setValues(defaults);
  }

  let shifts = ss.getSheetByName(SHEETS.SHIFTS);
  if (!shifts) {
    shifts = ss.insertSheet(SHEETS.SHIFTS);
    shifts.getRange(1, 1, 1, SHIFT_HEADERS.length).setValues([SHIFT_HEADERS]);
    shifts.setFrozenRows(1);
    shifts.getRange(1, 1, 1, SHIFT_HEADERS.length).setFontWeight('bold').setBackground('#f3f4f6');
    shifts.getRange(2, 1, 1, 5).setValues([
      ['shift_1', 'General (09:00 AM - 06:00 PM)', '09:00', '18:00', 'TRUE'],
    ]);
  }
}

// ─── Attendance ───

function getAttendance(year, month) {
  const all = getAllAttendance();
  if (!year || !month) return all;
  const prefix = year + '-' + String(month).padStart(2, '0');
  return all.filter(function (r) { return String(r.date).indexOf(prefix) === 0; });
}

function getAllAttendance() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.ATTENDANCE);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = rangeRect(sheet, 2, 1, sheet.getLastRow(), ATTENDANCE_HEADERS.length).getValues();
  return rows
    .filter(function (r) { return r[2]; })
    .map(rowToRecord);
}

function saveRecord(record) {
  if (!record || !record.date) throw new Error('Record must include a date');

  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.ATTENDANCE);
  if (!sheet) throw new Error('Attendance sheet not found. Run setupSheets().');

  const dateKey = normalizeDate(record.date);
  const rowData = recordToRow(record, dateKey);
  const lastRow = sheet.getLastRow();
  let targetRow = -1;

  if (lastRow >= 2) {
    const dates = rangeRect(sheet, 2, 3, lastRow, 3).getValues();
    for (var i = 0; i < dates.length; i++) {
      if (normalizeDate(dates[i][0]) === dateKey) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return rowToRecord(rowData);
}

function recordToRow(record, dateKey) {
  return [
    record.employeeId || '',
    record.employeeName || '',
    dateKey,
    record.checkIn || '',
    record.checkOut || '',
    record.totalHours || 0,
    record.payableHours || 0,
    record.status || '',
    record.shift || '',
    record.comments || '',
  ];
}

function rowToRecord(r) {
  return {
    employeeId: r[0] || '',
    employeeName: r[1] || '',
    date: normalizeDate(r[2]),
    checkIn: r[3] || null,
    checkOut: r[4] || null,
    totalHours: Number(r[5]) || 0,
    payableHours: Number(r[6]) || 0,
    status: r[7] || '',
    shift: r[8] || '',
    comments: r[9] || '',
  };
}

function normalizeDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  var s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  var d = new Date(s);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return s;
}

// ─── Settings ───

function getSettings() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.SETTINGS);
  if (!sheet || sheet.getLastRow() < 2) return {};
  const rows = rangeRect(sheet, 2, 1, sheet.getLastRow(), 2).getValues();
  const settings = {};
  rows.forEach(function (r) {
    if (r[0]) settings[r[0]] = r[1];
  });
  if (settings.defaultPayableHours) {
    settings.defaultPayableHours = Number(settings.defaultPayableHours);
  }
  return settings;
}

function saveSettings(settings) {
  if (!settings) return;
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.SETTINGS);
  if (!sheet) throw new Error('Settings sheet not found. Run setupSheets().');

  const keys = Object.keys(settings);
  const rows = keys.map(function (k) { return [k, settings[k]]; });

  if (sheet.getLastRow() > 1) {
    rangeRect(sheet, 2, 1, sheet.getLastRow(), 2).clearContent();
  }
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }
}

// ─── Shifts ───

function getShifts() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.SHIFTS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = rangeRect(sheet, 2, 1, sheet.getLastRow(), 5).getValues();
  return rows
    .filter(function (r) { return r[0]; })
    .map(function (r) {
      return {
        id: String(r[0]),
        label: r[1] || '',
        start: r[2] || '',
        end: r[3] || '',
        isDefault: r[4] === true || String(r[4]).toUpperCase() === 'TRUE',
      };
    });
}

function saveShifts(shifts) {
  if (!shifts || !shifts.length) return;
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.SHIFTS);
  if (!sheet) throw new Error('Shifts sheet not found. Run setupSheets().');

  const rows = shifts.map(function (s) {
    return [s.id, s.label, s.start, s.end, s.isDefault ? 'TRUE' : 'FALSE'];
  });

  if (sheet.getLastRow() > 1) {
    rangeRect(sheet, 2, 1, sheet.getLastRow(), 5).clearContent();
  }
  sheet.getRange(2, 1, rows.length, 5).setValues(rows);
}
