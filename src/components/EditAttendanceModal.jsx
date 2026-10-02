import { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { formatDate, isWeekend, STATUSES, timeToInput } from '../lib/utils';
import { Modal } from './Modal';
import { TimeSelect } from './TimeSelect';

export function EditAttendanceModal({ dateKey, onClose }) {
  const { attendance, settings, shifts, updateRecord, toast } = useApp();
  const record = attendance[dateKey];
  const [checkIn, setCheckIn] = useState(record?.checkIn ? timeToInput(record.checkIn) : '');
  const [checkOut, setCheckOut] = useState(record?.checkOut ? timeToInput(record.checkOut) : '');
  const [status, setStatus] = useState(record?.status || (isWeekend(dateKey) ? 'Weekend' : 'Absent'));
  const [shiftId, setShiftId] = useState(record?.shiftId || settings.defaultShiftId || shifts[0]?.id || '');
  const [comments, setComments] = useState(record?.comments || '');
  const [payable, setPayable] = useState(record?.payableHours ?? settings.defaultPayableHours);

  function save() {
    try {
      const updates = {
        checkInTime: checkIn || null,
        checkOutTime: checkOut || null,
        status,
        shiftId,
        comments,
      };
      if (settings.payableHoursRule === 'manual') updates.payableHours = Number(payable);
      updateRecord(dateKey, updates);
      toast('Attendance updated', 'success');
      onClose();
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  return (
    <Modal title="Edit attendance" onClose={onClose} onSave={save}>
      <p className="modal-date">
        {formatDate(dateKey, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <label className="field">
        <span>Check in</span>
        <TimeSelect id="edit-checkin" value={checkIn} onChange={setCheckIn} allowEmpty />
      </label>
      <label className="field">
        <span>Check out</span>
        <TimeSelect id="edit-checkout" value={checkOut} onChange={setCheckOut} allowEmpty />
      </label>
      <label className="field">
        <span>Status</span>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          {STATUSES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Shift</span>
        <select value={shiftId} onChange={(event) => setShiftId(event.target.value)}>
          {shifts.map((shift) => (
            <option key={shift.id} value={shift.id}>{shift.label}</option>
          ))}
        </select>
      </label>
      {settings.payableHoursRule === 'manual' && (
        <label className="field">
          <span>Payable hours</span>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={payable}
            onChange={(event) => setPayable(event.target.value)}
          />
        </label>
      )}
      <label className="field">
        <span>Comments</span>
        <textarea rows="3" value={comments} onChange={(event) => setComments(event.target.value)} />
      </label>
    </Modal>
  );
}
