import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [newEmp, setNewEmp] = useState({ name: '', baseSalary: '', startDate: '', department: '' });
  const [inactive, setInactive] = useState({ name: '', endDate: '' });
  const [updateSalary, setUpdateSalary] = useState({ name: '', newSalary: '' });
  const [newDept, setNewDept] = useState('');
  const [deleteDept, setDeleteDept] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(null);
  const [visibleDepartment, setVisibleDepartment] = useState(null);
  const [modal, setModal] = useState({ show: false, message: '' });
  const currentDate = new Date('2025-07-15');
  const regularHours = 12;
  const halfDayHours = regularHours / 2;
  const regularDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchData();
    initializeData();
  }, []);

  const fetchData = async () => {
    const [empRes, deptRes, holidayRes] = await Promise.all([
      axios.get('/api/employees'),
      axios.get('/api/departments'),
      axios.get('/api/holidays')
    ]);
    setEmployees(empRes.data);
    setDepartments(deptRes.data.map(d => d.name));
    setHolidays(holidayRes.data.map(h => new Date(h.date).toISOString().split('T')[0]));
  };

  const initializeData = async () => {
    // Add initial departments
    const initialDepts = ['Engineering', 'Sales', 'HR', 'Marketing'];
    for (const dept of initialDepts) {
      try {
        await axios.post('/api/departments', { name: dept });
      } catch (err) {}
    }
    // Add initial holidays
    const initialHolidays = ['2025-04-14', '2025-05-01', '2025-06-05'];
    for (const date of initialHolidays) {
      try {
        await axios.post('/api/holidays', { date });
      } catch (err) {}
    }
    // Add initial employees and entries (similar to generateDummyEntries and scheduleDefaultEntries)
    const initialEmployees = [
      { name: 'Aarav Sharma', baseSalary: 60000, startDate: '2025-04-01', department: 'Engineering' },
      // ... Add other 12 employees similarly
    ];
    for (const emp of initialEmployees) {
      try {
        await axios.post('/api/employees', emp);
      } catch (err) {}
    }
    // Generate dummy entries (implement similarly to generateDummyEntries)
    // Schedule default entries for July 2025
  };

  const showModal = (message) => setModal({ show: true, message });
  const closeModal = () => setModal({ show: false, message: '' });

  const addEmployee = async () => {
    try {
      const res = await axios.post('/api/employees', newEmp);
      setEmployees([...employees, res.data]);
      setNewEmp({ name: '', baseSalary: '', startDate: '', department: '' });
      // Schedule default entries for new employee
    } catch (err) {
      showModal(err.response?.data?.message || 'Error adding employee.');
    }
  };

  const markInactive = async () => {
    try {
      const res = await axios.put('/api/employees/inactive', inactive);
      setEmployees(employees.map(e => e.name === res.data.name ? res.data : e));
      setInactive({ name: '', endDate: '' });
    } catch (err) {
      showModal(err.response?.data?.message || 'Error marking inactive.');
    }
  };

  const updateEmployeeSalary = async () => {
    try {
      const res = await axios.put('/api/employees/salary', updateSalary);
      setEmployees(employees.map(e => e.name === res.data.name ? res.data : e));
      setUpdateSalary({ name: '', newSalary: '' });
    } catch (err) {
      showModal(err.response?.data?.message || 'Error updating salary.');
    }
  };

  const addDepartment = async () => {
    try {
      const res = await axios.post('/api/departments', { name: newDept });
      setDepartments([...departments, res.data.name]);
      setNewDept('');
    } catch (err) {
      showModal(err.response?.data?.message || 'Error adding department.');
    }
  };

  const deleteDepartment = async () => {
    try {
      await axios.delete(`/api/departments/${deleteDept}`);
      setDepartments(departments.filter(d => d !== deleteDept));
      setDeleteDept('');
    } catch (err) {
      showModal(err.response?.data?.message || 'Error deleting department.');
    }
  };

  const addHoliday = async () => {
    try {
      const res = await axios.post('/api/holidays', { date: holidayDate });
      setHolidays([...holidays, res.data.date.split('T')[0]]);
      setHolidayDate('');
      setEmployees(employees.map(emp => ({
        ...emp,
        entries: emp.entries.filter(e => e.date !== res.data.date)
      })));
    } catch (err) {
      showModal(err.response?.data?.message || 'Error adding holiday.');
    }
  };

  const updateEntry = async (empName, date, workType, startTime, endTime) => {
    try {
      const res = await axios.post('/api/entries', { employeeName: empName, date, workType, startTime, endTime });
      setEmployees(employees.map(emp => emp.name === empName ? {
        ...emp,
        entries: emp.entries.some(e => e.date === date)
          ? emp.entries.map(e => e.date === date ? res.data : e)
          : [...emp.entries, res.data]
      } : emp));
    } catch (err) {
      showModal(err.response?.data?.message || 'Error updating entry.');
    }
  };

  const showMonth = (month) => {
    setVisibleMonth(month);
    setVisibleDepartment(null);
  };

  const showDepartment = (month, dept) => {
    setVisibleDepartment(dept);
  };

  const renderMonthTables = () => {
    const months = ['2025-04', '2025-05', '2025-06', '2025-07'];
    return months.map(month => {
      const monthDate = new Date(month + '-01');
      const monthName = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const departmentsWithEmployees = [...new Set(employees
        .filter(emp => {
          const start = new Date(emp.startDate);
          const end = emp.endDate ? new Date(emp.endDate) : new Date('9999-12-31');
          const monthStart = new Date(month + '-01');
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
          return start <= monthEnd && end >= monthStart;
        })
        .map(emp => emp.department)
      )];

      return (
        <div key={month}>
          <div className="month-button inline-block" onClick={() => showMonth(month)}>{monthName}</div>
          <div id={`deptButtons-${month}`} className="department-section" style={{ display: visibleMonth === month ? 'block' : 'none' }}>
            {month === '2025-07' || departmentsWithEmployees.length > 0 ? departmentsWithEmployees.map(dept => (
              <button key={dept} className="dept-button" onClick={() => showDepartment(month, dept)}>{dept}</button>
            )) : null}
          </div>
          {departmentsWithEmployees.map(dept => {
            const activeEmployees = employees.filter(emp => emp.department === dept && new Date(emp.startDate) <= new Date(month + '-31') && (!emp.endDate || new Date(emp.endDate) >= new Date(month + '-01')));
            if (activeEmployees.length === 0 && month !== '2025-07') return null;
            return (
              <div key={`${month}-${dept}`} className="department-section">
                <div id={`table-${month}-${dept}`} className={`month-table month-table-${month} ${visibleMonth === month && visibleDepartment === dept ? 'active' : ''}`}>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{dept}</h4>
                  <table className="text-gray-900">
                    <thead>
                      <tr>
                        <th>Date</th>
                        {activeEmployees.map(emp => <th key={emp.name}>{emp.name}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate() }, (_, i) => {
                        const dateStr = `${month}-${(i + 1).toString().padStart(2, '0')}`;
                        const date = new Date(dateStr);
                        const dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' });
                        return (
                          <tr key={dateStr}>
                            <td>{i + 1} {dayOfWeek}</td>
                            {activeEmployees.map(emp => {
                              const entry = emp.entries.find(e => e.date === dateStr);
                              const isActive = new Date(emp.startDate) <= date && (!emp.endDate || new Date(emp.endDate) >= date);
                              const workType = entry ? entry.workType : (isActive && regularDays.includes(dayOfWeek) && date < currentDate ? 'FULL_DAY' : '');
                              if (holidays.includes(dateStr)) return <td key={emp.name} className="holiday">Holiday</td>;
                              if (!isActive) return <td key={emp.name}>-</td>;
                              if (workType.includes('-')) {
                                const [startTime, endTime] = workType.split(' - ');
                                return (
                                  <td key={emp.name}>
                                    <select className="work-type" value="CUSTOM" onChange={e => updateEntry(emp.name, dateStr, e.target.value, e.target.parentElement.querySelector('.start-time')?.value, e.target.parentElement.querySelector('.end-time')?.value)}>
                                      <option value=""></option>
                                      <option value="FULL_DAY">FULL DAY</option>
                                      <option value="HALF_DAY">HALF DAY</option>
                                      <option value="CUSTOM">CUSTOM</option>
                                    </select>
                                    <input type="time" className="time-input start-time mt-1" defaultValue={startTime} onChange={e => updateEntry(emp.name, dateStr, 'CUSTOM', e.target.value, e.target.parentElement.querySelector('.end-time').value)} />
                                    <input type="time" className="time-input end-time mt-1" defaultValue={endTime} onChange={e => updateEntry(emp.name, dateStr, 'CUSTOM', e.target.parentElement.querySelector('.start-time').value, e.target.value)} />
                                  </td>
                                );
                              }
                              return (
                                <td key={emp.name}>
                                  <select className="work-type" value={workType} onChange={e => updateEntry(emp.name, dateStr, e.target.value)}>
                                    <option value=""></option>
                                    <option value="FULL_DAY">FULL DAY</option>
                                    <option value="HALF_DAY">HALF DAY</option>
                                    <option value="CUSTOM">CUSTOM</option>
                                  </select>
                                  <input type="time" className="time-input start-time mt-1 hidden" onChange={e => updateEntry(emp.name, dateStr, 'CUSTOM', e.target.value, e.target.parentElement.querySelector('.end-time').value)} />
                                  <input type="time" className="time-input end-time mt-1 hidden" onChange={e => updateEntry(emp.name, dateStr, 'CUSTOM', e.target.parentElement.querySelector('.start-time').value, e.target.value)} />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="flex items-center justify-center p-4 sm:p-6 min-h-screen bg-gray-100">
      <div className="glass p-4 sm:p-8 max-w-full w-full md:max-w-6xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">Employee Salary Calculator</h1>

        {/* Add Employee */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Add Employee</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} placeholder="Employee Name" className="p-2 rounded-lg bg-gray-100 text-gray-900" />
            <input type="number" value={newEmp.baseSalary} onChange={e => setNewEmp({ ...newEmp, baseSalary: e.target.value })} placeholder="Monthly Salary (₹)" className="p-2 rounded-lg bg-gray-100 text-gray-900" />
            <input type="date" value={newEmp.startDate} onChange={e => setNewEmp({ ...newEmp, startDate: e.target.value })} className="p-2 rounded-lg bg-gray-100 text-gray-900" />
            <select value={newEmp.department} onChange={e => setNewEmp({ ...newEmp, department: e.target.value })} className="p-2 rounded-lg bg-gray-100 text-gray-900">
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={addEmployee} className="bg-teal-500 text-white p-2 rounded-lg hover:bg-teal-600">Add Employee</button>
          </div>
        </div>

        {/* Mark Inactive */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Mark Employee Inactive</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={inactive.name} onChange={e => setInactive({ ...inactive, name: e.target.value })} className="p-2 rounded-lg bg-gray-100 text-gray-900">
              {employees.filter(e => !e.endDate).map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
            </select>
            <input type="date" value={inactive.endDate} onChange={e => setInactive({ ...inactive, endDate: e.target.value })} className="p-2 rounded-lg bg-gray-100 text-gray-900" />
            <button onClick={markInactive} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600">Mark Inactive</button>
          </div>
        </div>

        {/* Update Salary */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Update Employee Salary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={updateSalary.name} onChange={e => setUpdateSalary({ ...updateSalary, name: e.target.value })} className="p-2 rounded-lg bg-gray-100 text-gray-900">
              {employees.filter(e => !e.endDate).map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
            </select>
            <input type="number" value={updateSalary.newSalary} onChange={e => setUpdateSalary({ ...updateSalary, newSalary: e.target.value })} placeholder="New Monthly Salary (₹)" className="p-2 rounded-lg bg-gray-100 text-gray-900" />
            <button onClick={updateEmployeeSalary} className="bg-teal-500 text-white p-2 rounded-lg hover:bg-teal-600">Update Salary</button>
          </div>
        </div>

        {/* Manage Departments */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Manage Departments</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="New Department Name" className="p-2 rounded-lg bg-gray-100 text-gray-900" />
            <button onClick={addDepartment} className="bg-teal-500 text-white p-2 rounded-lg hover:bg-teal-600">Add Department</button>
            <select value={deleteDept} onChange={e => setDeleteDept(e.target.value)} className="p-2 rounded-lg bg-gray-100 text-gray-900">
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={deleteDepartment} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600">Delete Department</button>
          </div>
        </div>

        {/* Add Holiday */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Add Holiday</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} className="p-2 rounded-lg bg-gray-100 text-gray-900" />
            <button onClick={addHoliday} className="bg-teal-500 text-white p-2 rounded-lg hover:bg-teal-600">Add Holiday</button>
          </div>
        </div>

        {/* Monthly Tables */}
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Monthly Attendance by Department</h2>
        {renderMonthTables()}

        {/* Modal */}
        {modal.show && (
          <div className="modal">
            <div className="modal-content">
              <p>{modal.message}</p>
              <button onClick={closeModal}>OK</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;