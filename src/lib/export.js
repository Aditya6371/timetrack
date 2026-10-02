import { getFullMonthGrid } from './attendance';
import { getSettings } from './storage';
import {
  excelDateFraction,
  excelHoursFraction,
  excelTimeFraction,
  getMonthName,
} from './utils';

function workbookLib(module) {
  if (module?.utils && module?.writeFile) return module;
  if (module?.default?.utils && module?.default?.writeFile) return module.default;
  return module;
}

export async function downloadTimesheet(attendance, year, month) {
  const module = await import('xlsx');
  const XLSX = workbookLib(module);
  const rows = getFullMonthGrid(attendance, year, month);
  const settings = getSettings();
  const monthName = getMonthName(month);

  const header = [
    'Employee Id',
    'Employee Name',
    'Date',
    'Check-In',
    'Check-Out',
    'Total Hours',
    'Payable Hours',
    'Status',
    'Shift(s)',
    'Comments',
  ];

  const data = [header];
  rows.forEach((row) => {
    const countedHours = row.totalHours
      ? excelHoursFraction(row.totalHours)
      : (row.status === 'Present' || row.status === 'Work from Home' || row.status === 'Checked In'
        ? excelHoursFraction(settings.defaultPayableHours)
        : 0);

    data.push([
      settings.employeeId || '',
      settings.employeeName || row.employeeName || '',
      excelDateFraction(row.date),
      row.checkIn ? excelTimeFraction(row.checkIn) : '',
      row.checkOut ? excelTimeFraction(row.checkOut) : '',
      countedHours,
      row.payableHours ? excelHoursFraction(row.payableHours) : 0,
      row.status || '',
      row.shift || '',
      row.comments || '',
    ]);
  });

  const sheet = XLSX.utils.aoa_to_sheet(data);
  const range = XLSX.utils.decode_range(sheet['!ref']);
  for (let rowIndex = 1; rowIndex <= range.e.r; rowIndex += 1) {
    const dateCell = XLSX.utils.encode_cell({ r: rowIndex, c: 2 });
    if (sheet[dateCell] && sheet[dateCell].v !== '') {
      sheet[dateCell].t = 'n';
      sheet[dateCell].z = 'dd-mmm-yyyy';
    }
    [3, 4].forEach((column) => {
      const cell = XLSX.utils.encode_cell({ r: rowIndex, c: column });
      if (sheet[cell] && sheet[cell].v !== '') {
        sheet[cell].t = 'n';
        sheet[cell].z = 'hh:mm:ss';
      }
    });
    [5, 6].forEach((column) => {
      const cell = XLSX.utils.encode_cell({ r: rowIndex, c: column });
      if (sheet[cell] && sheet[cell].v !== '') {
        sheet[cell].t = 'n';
        sheet[cell].z = '[h]:mm';
      }
    });
  }

  sheet['!cols'] = [
    { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 12 },
    { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    { wch: 28 }, { wch: 20 },
  ];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Sheet1');
  XLSX.writeFile(book, `Timesheet for ${monthName} ${year}.xlsx`);
}
