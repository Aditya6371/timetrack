const Export = {
  generateWorkbook(year, month) {
    const rows = Attendance.getFullMonthGrid(year, month);
    const settings = Storage.getSettings();
    const monthName = Utils.getMonthName(month);

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
      data.push([
        settings.employeeId || '',
        settings.employeeName || row.employeeName || '',
        Utils.excelDateFraction(row.date),
        row.checkIn ? Utils.excelTimeFraction(row.checkIn) : '',
        row.checkOut ? Utils.excelTimeFraction(row.checkOut) : '',
        row.totalHours ? Utils.excelHoursFraction(row.totalHours) : (row.status === 'Present' || row.status === 'Work from Home' || row.status === 'Checked In' ? Utils.excelHoursFraction(settings.defaultPayableHours) : 0),
        row.payableHours ? Utils.excelHoursFraction(row.payableHours) : 0,
        row.status || '',
        row.shift || '',
        row.comments || '',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = 1; R <= range.e.r; R++) {
      const dateCell = XLSX.utils.encode_cell({ r: R, c: 2 });
      if (ws[dateCell] && ws[dateCell].v !== '') {
        ws[dateCell].t = 'n';
        ws[dateCell].z = 'dd-mmm-yyyy';
      }
      [3, 4].forEach((c) => {
        const cell = XLSX.utils.encode_cell({ r: R, c });
        if (ws[cell] && ws[cell].v !== '') {
          ws[cell].t = 'n';
          ws[cell].z = 'hh:mm:ss';
        }
      });
      [5, 6].forEach((c) => {
        const cell = XLSX.utils.encode_cell({ r: R, c });
        if (ws[cell] && ws[cell].v !== '') {
          ws[cell].t = 'n';
          ws[cell].z = '[h]:mm';
        }
      });
    }

    ws['!cols'] = [
      { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 10 },
      { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 10 },
      { wch: 28 }, { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    return { wb, filename: `Timesheet for ${monthName} ${year}.xlsx` };
  },

  download(year, month) {
    if (typeof XLSX === 'undefined') {
      Components.toast('Excel library not loaded', 'error');
      return;
    }
    const { wb, filename } = this.generateWorkbook(year, month);
    XLSX.writeFile(wb, filename);
    Components.toast('Timesheet downloaded', 'success');
  },
};
