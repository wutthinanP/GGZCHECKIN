const API_BASE = '/api';

/**
 * Enhanced fetch wrapper with auto Authorization header and JSON parsing
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // If token expired, try to refresh
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem('accessToken', refreshData.accessToken);
          headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
          // Retry original request
          const retryRes = await fetch(url, { ...options, headers });
          return handleResponse(retryRes);
        }
      } catch (e) {
        console.error('Refresh token failed:', e);
      }
    }
  }

  return handleResponse(res);
}

async function handleResponse(res) {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'เกิดข้อผิดพลาดในการร้องขอ');
    }
    return data;
  }
  if (!res.ok) {
    throw new Error('เกิดข้อผิดพลาดในการร้องขอ');
  }
  return res;
}

/**
 * Direct file download helper using Blob and Bearer Authorization
 */
async function downloadFile(endpoint, defaultFilename = 'download') {
  const token = localStorage.getItem('accessToken');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    let errMsg = 'ดาวน์โหลดไฟล์ไม่สำเร็จ';
    try {
      const errJson = await res.json();
      if (errJson.error) errMsg = errJson.error;
    } catch (_) {}
    throw new Error(errMsg);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition');
  let filename = defaultFilename;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename=(?:["']?)([^"';]+)(?:["']?)/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const api = {
  // ── Auth ──
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (email, otp) =>
    request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  resetPassword: (resetToken, newPassword) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ resetToken, newPassword }) }),

  // ── Attendance ──
  checkIn: (data) => request('/attendance/check-in', { method: 'POST', body: JSON.stringify(data) }),
  checkOut: (data) => request('/attendance/check-out', { method: 'POST', body: JSON.stringify(data) }),
  breakStart: () => request('/attendance/break-start', { method: 'POST' }),
  breakEnd: () => request('/attendance/break-end', { method: 'POST' }),
  getMyToday: () => request('/attendance/my/today'),
  getMyHistory: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/attendance/my/history?${q}`);
  },
  getEmployeeAttendance: (userId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/attendance/employee/${userId}?${q}`);
  },
  getDailyAttendance: (date) => request(`/attendance/daily/${date}`),
  getAttendanceEvents: (attendanceId) => request(`/attendance/events/${attendanceId}`),

  // ── Schedules ──
  listSchedules: () => request('/schedules'),
  getSchedule: (id) => request(`/schedules/${id}`),
  createSchedule: (data) => request('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id, data) => request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchedule: (id) => request(`/schedules/${id}`, { method: 'DELETE' }),
  addScheduleBreak: (scheduleId, data) =>
    request(`/schedules/${scheduleId}/breaks`, { method: 'POST', body: JSON.stringify(data) }),
  deleteScheduleBreak: (breakId) =>
    request(`/schedules/breaks/${breakId}`, { method: 'DELETE' }),

  // ── Leaves ──
  listLeaveTypes: () => request('/leaves/types'),
  requestLeave: (data) => request('/leaves', { method: 'POST', body: JSON.stringify(data) }),
  getMyLeaves: () => request('/leaves/my'),
  getPendingLeaves: () => request('/leaves/pending'),
  getAllLeaves: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/leaves/all?${q}`);
  },
  approveLeave: (id) => request(`/leaves/${id}/approve`, { method: 'PUT' }),
  rejectLeave: (id) => request(`/leaves/${id}/reject`, { method: 'PUT' }),
  cancelLeave: (id) => request(`/leaves/${id}/cancel`, { method: 'PUT' }),

  // ── WFH ──
  requestWfh: (data) => request('/wfh', { method: 'POST', body: JSON.stringify(data) }),
  getMyWfh: () => request('/wfh/my'),
  getPendingWfh: () => request('/wfh/pending'),
  getAllWfh: () => request('/wfh/all'),
  approveWfh: (id) => request(`/wfh/${id}/approve`, { method: 'PUT' }),
  rejectWfh: (id) => request(`/wfh/${id}/reject`, { method: 'PUT' }),
  cancelWfh: (id) => request(`/wfh/${id}/cancel`, { method: 'PUT' }),

  // ── Time Edit Requests ──
  requestEdit: (data) => request('/edit-requests', { method: 'POST', body: JSON.stringify(data) }),
  getMyEdits: () => request('/edit-requests/my'),
  getPendingEdits: () => request('/edit-requests/pending'),
  approveEdit: (id) => request(`/edit-requests/${id}/approve`, { method: 'PUT' }),
  rejectEdit: (id) => request(`/edit-requests/${id}/reject`, { method: 'PUT' }),

  // ── Users (Admin) ──
  listUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/users?${q}`);
  },
  getUser: (id) => request(`/users/${id}`),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  listRoles: () => request('/users/roles/list'),

  // ── Dashboard ──
  getDashboardStats: () => request('/dashboard/stats'),
  getDashboardAttendanceToday: (date) =>
    request(`/dashboard/attendance-today${date ? `?date=${date}` : ''}`),

  // ── Reports ──
  getMonthlyReport: (year, month, userId) => {
    let q = `year=${year}&month=${month}`;
    if (userId) q += `&userId=${userId}`;
    return request(`/reports/monthly?${q}`);
  },
  downloadExcelReport: (year, month) =>
    downloadFile(`/reports/export/excel?year=${year}&month=${month}`, `attendance_report_${year}_${month}.xlsx`),
  downloadCsvReport: (year, month) =>
    downloadFile(`/reports/export/csv?year=${year}&month=${month}`, `attendance_report_${year}_${month}.csv`),
  getDetailedReport: (params = {}) => {
    const clean = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null') {
        clean[k] = v;
      }
    }
    const q = new URLSearchParams(clean).toString();
    return request(`/reports/detailed?${q}`);
  },
  downloadDetailedExcelReport: (params = {}) => {
    const clean = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null') {
        clean[k] = v;
      }
    }
    const q = new URLSearchParams(clean).toString();
    return downloadFile(`/reports/detailed/export/excel?${q}`, `detailed_attendance_${clean.startDate || ''}_to_${clean.endDate || ''}.xlsx`);
  },
  downloadDetailedCsvReport: (params = {}) => {
    const clean = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null') {
        clean[k] = v;
      }
    }
    const q = new URLSearchParams(clean).toString();
    return downloadFile(`/reports/detailed/export/csv?${q}`, `detailed_attendance_${clean.startDate || ''}_to_${clean.endDate || ''}.csv`);
  },
  getExportExcelUrl: (year, month) => {
    const token = localStorage.getItem('accessToken');
    return `${API_BASE}/reports/export/excel?year=${year}&month=${month}${token ? `&token=${token}` : ''}`;
  },
  getExportCsvUrl: (year, month) => {
    const token = localStorage.getItem('accessToken');
    return `${API_BASE}/reports/export/csv?year=${year}&month=${month}${token ? `&token=${token}` : ''}`;
  },

  // ── Notifications ──
  getMyNotifications: () => request('/notifications/my'),
  getUnreadNotificationsCount: () => request('/notifications/unread-count'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
};
