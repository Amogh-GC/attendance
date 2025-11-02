/*
  Data format:
    attendanceData[classId] = { "YYYY-MM": [list of absent day numbers], ... }
    offDaysData[classId] = { "YYYY-MM": [list of off day numbers], ... }

  Semester window:
    July 27, 2025  -> Nov 22, 2025
*/
const semesterStart = new Date(2025, 6, 27); // July 27, 2025
const semesterEnd   = new Date(2025, 10, 22); // Nov 22, 2025

// Initialize empty data - will be loaded from server
let attendanceData = {};
let offDaysData = {};

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const classState = {}; // will hold { month, year } for each class

/* ---------- Load attendance data from server ---------- */
async function loadAttendanceData() {
  try {
    const response = await fetch('/api/attendance', { credentials: 'same-origin' });
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        attendanceData = data.attendanceData || {};
        offDaysData = data.offDaysData || {};
        
        // Ensure all classes have empty objects if no data
        ['cs301', 'cs302'].forEach(classId => {
          if (!attendanceData[classId]) attendanceData[classId] = {};
          if (!offDaysData[classId]) offDaysData[classId] = {};
        });
        
        console.log('✅ Attendance data loaded from server');
        updateCardStats();
      }
    }
  } catch (error) {
    console.error('Error loading attendance data:', error);
    // Initialize empty data if load fails
    attendanceData = { cs301: {}, cs302: {} };
    offDaysData = { cs301: {}, cs302: {} };
    updateCardStats();
  }
}

/* ---------- Save attendance data to server ---------- */
async function saveAttendanceData() {
  try {
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        attendanceData,
        offDaysData
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Attendance data saved to server');
      return true;
    } else {
      console.error('Failed to save attendance data');
      return false;
    }
  } catch (error) {
    console.error('Error saving attendance data:', error);
    return false;
  }
}

/* ---------- Toggle day status (Present/Absent) ---------- */
async function toggleDayStatus(classId, day, month, year, type = 'absent') {
  const key = monthKey(year, month);
  const dataObj = type === 'absent' ? attendanceData : offDaysData;
  
  // Initialize if doesn't exist
  if (!dataObj[classId]) dataObj[classId] = {};
  if (!dataObj[classId][key]) dataObj[classId][key] = [];
  
  const daysArray = dataObj[classId][key];
  const dayIndex = daysArray.indexOf(day);
  
  if (dayIndex > -1) {
    daysArray.splice(dayIndex, 1); // Mark as present (remove from absent list)
  } else {
    daysArray.push(day); // Mark as absent (add to absent list)
    daysArray.sort((a, b) => a - b);
  }
  
  // Save to server
  await saveAttendanceData();
  
  // Refresh the calendar display
  const { month: currentMonth, year: currentYear } = classState[classId];
  document.getElementById(classId).innerHTML = renderCalendar(classId, currentMonth, currentYear);
  
  // Update stats
  updateCardStats();
}

/* ---------- Helpers ---------- */
function monthKey(year, month) {
  return `${year}-${String(month+1).padStart(2,'0')}`;
}

function clampToSemesterMonth(date) {
  // returns a {year,month} that lies within semester months (first month that overlaps semester)
  if (date < semesterStart) {
    return { year: semesterStart.getFullYear(), month: semesterStart.getMonth() };
  }
  if (date > semesterEnd) {
    return { year: semesterEnd.getFullYear(), month: semesterEnd.getMonth() };
  }
  return { year: date.getFullYear(), month: date.getMonth() };
}

function isMonthAllowed(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth);
  return !(monthEnd < semesterStart || monthStart > semesterEnd);
}

/* ---------- Statistics (cumulative across semester up to today) ---------- */
function getStats(classId) {
  const today = new Date();
  const endDate = (today < semesterEnd) ? today : semesterEnd;

  let totalConducted = 0;
  let totalAbsent = 0;
  let totalOff = 0;

  // iterate month-by-month between semesterStart and endDate inclusive
  let cur = new Date(semesterStart.getFullYear(), semesterStart.getMonth(), 1);
  while (cur <= endDate) {
    const year = cur.getFullYear();
    const month = cur.getMonth();
    const key = monthKey(year, month);
    const absents = (attendanceData[classId] && attendanceData[classId][key]) || [];
    const offs = (offDaysData[classId] && offDaysData[classId][key]) || [];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // start day: if first semester month, start from semesterStart.date else 1
    const startDay = (year === semesterStart.getFullYear() && month === semesterStart.getMonth()) ? semesterStart.getDate() : 1;
    // end day: if last month, clamp to endDate/day else daysInMonth
    let endDay = daysInMonth;
    if (year === semesterEnd.getFullYear() && month === semesterEnd.getMonth()) {
      endDay = Math.min(endDay, semesterEnd.getDate());
    }
    if (year === endDate.getFullYear() && month === endDate.getMonth()) {
      endDay = Math.min(endDay, endDate.getDate());
    }

    for (let d = startDay; d <= endDay; d++) {
      const date = new Date(year, month, d);
      const wd = date.getDay();
      if (wd === 0 || wd === 6) continue; // skip weekends entirely
      if (offs.includes(d)) {
        totalOff++;
      } else {
        totalConducted++;
        if (absents.includes(d)) totalAbsent++;
      }
    }

    cur.setMonth(cur.getMonth() + 1);
  }

  // total possible leaves = floor(totalConducted / 4)
  const totalPossibleLeaves = Math.floor(totalConducted / 4);
  let possibleLeaves = totalPossibleLeaves - totalAbsent;
  if (possibleLeaves < 0) possibleLeaves = 0;

  return { totalConducted, totalAbsent, totalOff, totalPossibleLeaves, possibleLeaves };
}

/* ---------- Get monthly statistics ---------- */
function getMonthlyStats(classId, month, year) {
  const key = monthKey(year, month);
  const absents = (attendanceData[classId] && attendanceData[classId][key]) || [];
  const offs = (offDaysData[classId] && offDaysData[classId][key]) || [];
  
  const today = new Date();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Start and end days for the month within semester
  const startDay = (year === semesterStart.getFullYear() && month === semesterStart.getMonth()) ? semesterStart.getDate() : 1;
  let endDay = daysInMonth;
  if (year === semesterEnd.getFullYear() && month === semesterEnd.getMonth()) {
    endDay = Math.min(endDay, semesterEnd.getDate());
  }
  if (year === today.getFullYear() && month === today.getMonth()) {
    endDay = Math.min(endDay, today.getDate());
  }

  let totalConducted = 0;
  let totalAbsent = 0;
  let totalOff = 0;

  for (let d = startDay; d <= endDay; d++) {
    const date = new Date(year, month, d);
    const wd = date.getDay();
    if (wd === 0 || wd === 6) continue; // skip weekends
    
    if (offs.includes(d)) {
      totalOff++;
    } else {
      totalConducted++;
      if (absents.includes(d)) totalAbsent++;
    }
  }

  return { totalConducted, totalAbsent, totalOff };
}

/* ---------- Update cards ---------- */
function updateCardStats() {
  Object.keys(attendanceData).forEach(classId => {
    const stats = getStats(classId);
    const percent = stats.totalConducted === 0 ? 0 : Math.round(((stats.totalConducted - stats.totalAbsent) / stats.totalConducted) * 100);

    document.getElementById(`stats-${classId}`).innerHTML = `
      <div>Conducted: ${stats.totalConducted}</div>
      <div>Absent: ${stats.totalAbsent}</div>
      <div>Off: ${stats.totalOff}</div>
      <div>Possible Leaves: ${stats.possibleLeaves}</div>
    `;

    const progressBar = document.getElementById(`progress-${classId}`);
    const percentSpan = document.getElementById(`percent-${classId}`);
    progressBar.style.width = percent + '%';
    progressBar.style.backgroundColor = percent < 75 ? '#ff6666' : (percent < 90 ? '#ffcc00' : '#00cc66');
    percentSpan.innerText = percent + '%';
    percentSpan.style.backgroundColor = progressBar.style.backgroundColor;
  });
}

/* ---------- Render calendar (only months allowed inside semester) ---------- */
function renderCalendar(classId, month, year) {
  // safety: if month not allowed, show a short message
  if (!isMonthAllowed(year, month)) {
    return `<div class="calendar-wrapper" onclick="event.stopPropagation()">
      <div class="calendar-header">
        <button onclick="event.stopPropagation(); changeMonth('${classId}', -1)">&#8592;</button>
        <h3>${months[month]} ${year}</h3>
        <button onclick="event.stopPropagation(); changeMonth('${classId}', 1)">&#8594;</button>
      </div>
      <div style="padding:20px; text-align:center; color:#666;">Month outside semester window</div>
    </div>`;
  }

  const key = monthKey(year, month);
  const absentDays = (attendanceData[classId] && attendanceData[classId][key]) || [];
  const offDays = (offDaysData[classId] && offDaysData[classId][key]) || [];

  // Calculate monthly stats
  const monthStats = getMonthlyStats(classId, month, year);
  const monthlyPercent = monthStats.totalConducted === 0 ? 0 : Math.round(((monthStats.totalConducted - monthStats.totalAbsent) / monthStats.totalConducted) * 100);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  let html = `<div class="calendar-wrapper" onclick="event.stopPropagation()">
    <div class="calendar-header">
      <button onclick="event.stopPropagation(); changeMonth('${classId}', -1)">&#8592;</button>
      <h3>${months[month]} ${year} - Attendance Sheet</h3>
      <button onclick="event.stopPropagation(); changeMonth('${classId}', 1)">&#8594;</button>
    </div>
    
    <div class="monthly-summary">
      <div class="summary-item">
        <span class="label">Monthly Attendance:</span>
        <span class="value ${monthlyPercent >= 75 ? 'good' : monthlyPercent >= 50 ? 'warning' : 'danger'}">${monthlyPercent}%</span>
      </div>
      <div class="summary-item">
        <span class="label">Classes Conducted:</span>
        <span class="value">${monthStats.totalConducted}</span>
      </div>
      <div class="summary-item">
        <span class="label">Present:</span>
        <span class="value good">${monthStats.totalConducted - monthStats.totalAbsent}</span>
      </div>
      <div class="summary-item">
        <span class="label">Absent:</span>
        <span class="value danger">${monthStats.totalAbsent}</span>
      </div>
      <div class="summary-item">
        <span class="label">Holidays:</span>
        <span class="value">${monthStats.totalOff}</span>
      </div>
    </div>
    
    <div class="calendar">`;

  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d => html += `<div class="weekday">${d}</div>`);

  for (let i = 0; i < firstDay; i++) html += `<div></div>`;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const inSemester = (date >= semesterStart && date <= semesterEnd);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isFuture = date > today;
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];

    let classes = "";
    let status = "";
    let tooltip = `${dayName}, ${months[month]} ${day}, ${year}`;
    let clickable = false;

    if (!inSemester) {
      classes = "muted";
      status = "";
      tooltip += " - Outside semester";
    } else if (isFuture) {
      classes = "muted";
      status = "";
      tooltip += " - Future date";
    } else {
      if (isWeekend) {
        classes = "weekend";
        status = "🎯";
        tooltip += " - Weekend";
      } else if (offDays.includes(day)) {
        classes = "off clickable";
        status = "🏖️";
        tooltip += " - Holiday/Off day (Click to toggle)";
        clickable = true;
      } else if (absentDays.includes(day)) {
        classes = "absent clickable";
        status = "❌";
        tooltip += " - Absent (Click to mark Present)";
        clickable = true;
      } else {
        classes = "present clickable";
        status = "✅";
        tooltip += " - Present (Click to mark Absent)";
        clickable = true;
      }
    }

    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      classes += (classes ? " " : "") + "today";
      tooltip += " - Today";
    }

    const clickHandler = clickable ? ` onclick="event.stopPropagation(); toggleDayStatus('${classId}', ${day}, ${month}, ${year}, 'absent')"` : '';

    html += `<div class="${classes}" title="${tooltip}"${clickHandler}>
      <div class="day-number">${day}</div>
      <div class="day-status">${status}</div>
    </div>`;
  }

  html += `</div>
    <div class="legend">
      <span><div style="background:#e6ffe6; border:1px solid #00cc66"></div> Present ✅ (Click to toggle)</span>
      <span><div style="background:#ffe5e5; border:1px solid #cc0000"></div> Absent ❌ (Click to toggle)</span>
      <span><div style="background:#f4f4f4; border:1px solid #ddd"></div> Holiday 🏖️</span>
      <span><div style="background:#e6f3ff; border:1px solid #007bff"></div> Weekend 🎯</span>
      <span><div style="border:2px solid #00cc66"></div> Today</span>
    </div>
    <div class="attendance-info">
      <p><strong>Semester:</strong> ${semesterStart.toDateString()} — ${semesterEnd.toDateString()}</p>
      <p><strong>Subject:</strong> ${classId.toUpperCase()} - ${classId === 'cs301' ? 'Compiler Design' : 'Database Management Systems'}</p>
      <p><strong>Faculty:</strong> ${classId === 'cs301' ? 'Dr. T. Sugritha' : 'Dr. M. Ambika'}</p>
      <p style="margin-top: 12px; color: #10b981; font-weight: 600;"><i class="fas fa-info-circle"></i> Click on any day to mark your attendance!</p>
    </div>
  </div>`;

  return html;
}

/* ---------- Show attendance detail (card click) ---------- */
function showAttendance(classId) {
  console.log('showAttendance called with classId:', classId);
  
  // toggle: keep other details closed
  document.querySelectorAll('.attendance-detail').forEach(div => {
    if (div.id !== classId) {
      div.classList.remove('active');
      div.innerHTML = '';
    }
  });

  const detailDiv = document.getElementById(classId);
  console.log('Found detail div:', detailDiv);
  
  if (!detailDiv) {
    console.error('Could not find element with ID:', classId);
    return;
  }
  
  const wasActive = detailDiv.classList.contains('active');
  console.log('Was active:', wasActive);

  // toggle (but keep open when switching months)
  if (wasActive) {
    detailDiv.classList.remove('active');
    detailDiv.innerHTML = '';
    console.log('Closed attendance view');
    return;
  }

  // prepare classState month/year clamped to semester
  if (!classState[classId]) {
    const clamped = clampToSemesterMonth(new Date());
    classState[classId] = { month: clamped.month, year: clamped.year };
    console.log('Initialized classState for', classId, ':', classState[classId]);
  }

  // open and render the clamped month
  detailDiv.classList.add('active');
  const { month, year } = classState[classId];
  console.log('Rendering calendar for', classId, 'month:', month, 'year:', year);
  
  try {
    detailDiv.innerHTML = renderCalendar(classId, month, year);
    console.log('Calendar rendered successfully');
  } catch (error) {
    console.error('Error rendering calendar:', error);
  }
}

/* ---------- change month, but restrict to semester window ---------- */
function changeMonth(classId, delta) {
  if (!classState[classId]) {
    const clamped = clampToSemesterMonth(new Date());
    classState[classId] = { month: clamped.month, year: clamped.year };
  }

  let m = classState[classId].month + delta;
  let y = classState[classId].year;
  // normalize
  while (m < 0) { m += 12; y -= 1; }
  while (m > 11) { m -= 12; y += 1; }

  // if month isn't allowed (outside semester months), block
  if (!isMonthAllowed(y, m)) {
    // do nothing (you can add a toast/message here)
    return;
  }

  classState[classId].month = m;
  classState[classId].year = y;

  // re-render without toggling active state (so it won't close)
  document.getElementById(classId).innerHTML = renderCalendar(classId, m, y);
}

/* ---------- User Management ---------- */
async function loadUserInfo() {
  try {
    // Always prefer fresh data from the server
    const response = await fetch('/api/current-user', { credentials: 'same-origin' });

    if (response.ok) {
      const data = await response.json();
      if (data && data.user) {
        const name = data.user.name || 'User';
        const role = (data.user.role || 'student');

        // Update DOM
        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRole');
        if (nameEl) nameEl.textContent = name;
        if (roleEl) roleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);

        // Sync localStorage to server truth
        localStorage.setItem('userName', name);
        localStorage.setItem('userRole', role);
        if (data.user.email) localStorage.setItem('userEmail', data.user.email);
        if (data.user.id) localStorage.setItem('userId', data.user.id);
        return;
      }
    }

    // If server call didn't work, fallback to localStorage
    const storedName = localStorage.getItem('userName');
    const storedRole = localStorage.getItem('userRole') || 'student';
    if (storedName) {
      const nameEl = document.getElementById('userName');
      const roleEl = document.getElementById('userRole');
      if (nameEl) nameEl.textContent = storedName;
      if (roleEl) roleEl.textContent = storedRole.charAt(0).toUpperCase() + storedRole.slice(1);
    } else {
      // Nothing to show, redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error loading user info:', error);
    // Fallback
    const storedName = localStorage.getItem('userName');
    const storedRole = localStorage.getItem('userRole');
    if (storedName) {
      const nameEl = document.getElementById('userName');
      const roleEl = document.getElementById('userRole');
      if (nameEl) nameEl.textContent = storedName;
      if (roleEl) roleEl.textContent = (storedRole || 'student').charAt(0).toUpperCase() + (storedRole || 'student').slice(1);
    } else {
      window.location.href = '/login';
    }
  }
}

async function logout() {
  console.log('Logout function called');
  
  try {
    // Make a logout request to the server (optional)
    await fetch('/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.log('Logout request failed, but proceeding with redirect');
  }
  
  // Always redirect to login page
  window.location.href = '/login';
}

/* ---------- init ---------- */
window.addEventListener('load', async () => {
  console.log('Window loaded, initializing...');
  
  // Make functions globally available
  window.showAttendance = showAttendance;
  window.changeMonth = changeMonth;
  window.toggleDayStatus = toggleDayStatus;
  console.log('Functions assigned to window');
  
  // Load user information from API
  await loadUserInfo();
  
  // Load attendance data from server
  await loadAttendanceData();
  
  // ensure every class has a clamped initial month visible if you open it
  Object.keys(attendanceData).forEach(classId => {
    const clamped = clampToSemesterMonth(new Date());
    classState[classId] = { month: clamped.month, year: clamped.year };
  });

  console.log('Initialization complete');
});