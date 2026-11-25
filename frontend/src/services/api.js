// No Tre(ou)ble API Client Service - Enterprise Resilient Architecture

const rawBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';
const API_BASE = rawBase
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`)
  : '/api';

function getAuthHeader() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('resonova_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ----------------------------------------------------------------------------
// Enterprise Token Refresh Concurrency Queue (Zero Race Conditions)
// ----------------------------------------------------------------------------
let activeRefreshPromise = null;

async function renewAccessToken() {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const refreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem('resonova_refresh_token') : null;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const nativeFetch = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : globalThis.fetch;
      const res = await nativeFetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!res.ok) {
        throw new Error(`Token refresh rejected (${res.status})`);
      }

      const data = await res.json();
      const newToken = data.token || data.accessToken;
      if (!newToken) {
        throw new Error('New access token missing in refresh response');
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('resonova_token', newToken);
        if (data.refreshToken) {
          localStorage.setItem('resonova_refresh_token', data.refreshToken);
        }
      }
      return newToken;
    } catch (err) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('resonova_token');
        localStorage.removeItem('resonova_refresh_token');
        localStorage.removeItem('resonova_user');
      }
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

// ----------------------------------------------------------------------------
// Enterprise Resilient Fetch Wrapper (Retry, Timeout, Token Refresh, Trace ID)
// ----------------------------------------------------------------------------
const nativeFetch = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : globalThis.fetch;

async function resilientFetch(url, options = {}, attempt = 0) {
  const isStringUrl = typeof url === 'string';
  const urlStr = isStringUrl ? url : (url.url || '');
  const method = (options.method || 'GET').toUpperCase();
  const isIdempotent = ['GET', 'HEAD', 'OPTIONS', 'PUT'].includes(method);
  const isAuthEndpoint = urlStr.includes('/auth/login') ||
    urlStr.includes('/auth/register') ||
    urlStr.includes('/auth/refresh') ||
    urlStr.includes('/auth/verify-otp') ||
    urlStr.includes('/auth/verify-email-otp') ||
    urlStr.includes('/auth/resend-registration-otp') ||
    urlStr.includes('/auth/verify-mfa');

  // Adaptive Timeout Configuration
  const isUploadOrAudio = urlStr.includes('/recordings') ||
    urlStr.includes('/audio') ||
    urlStr.includes('/media') ||
    urlStr.includes('/upload');
  const timeoutMs = options.timeout || (isUploadOrAudio ? 120000 : 25000);

  // Setup AbortController for timeout & client cancellation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);

  let mergedSignal = controller.signal;
  if (options.signal) {
    if (options.signal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort();
      });
    }
  }

  // Correlation ID Tracking
  const headers = new Headers(options.headers || {});
  if (!headers.has('X-Request-Id')) {
    const traceId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    headers.set('X-Request-Id', traceId);
  }

  const fetchOptions = {
    ...options,
    headers,
    signal: mergedSignal
  };

  try {
    const response = await nativeFetch(url, fetchOptions);
    clearTimeout(timeoutId);

    // 1. Automatic Token Refresh on 401 with Token Queue
    if (response.status === 401 && !options._isRetry && !isAuthEndpoint) {
      const newToken = await renewAccessToken();
      if (newToken) {
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        return resilientFetch(url, {
          ...options,
          headers: retryHeaders,
          _isRetry: true
        }, attempt);
      }
    }

    // 2. Gateway Error Resilient Retry (502, 503, 504) for Idempotent Requests
    if (isIdempotent && [502, 503, 504].includes(response.status) && attempt < 2) {
      const backoffMs = Math.min(500 * Math.pow(2, attempt) + Math.random() * 200, 3000);
      await new Promise(r => setTimeout(r, backoffMs));
      return resilientFetch(url, options, attempt + 1);
    }

    return response;
  } catch (err) {
    clearTimeout(timeoutId);

    // Retry transient network failures for idempotent requests
    const isNetworkError = err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
    if (isIdempotent && isNetworkError && attempt < 2) {
      const backoffMs = Math.min(600 * Math.pow(2, attempt) + Math.random() * 200, 3500);
      await new Promise(r => setTimeout(r, backoffMs));
      return resilientFetch(url, options, attempt + 1);
    }

    throw err;
  }
}

// Lexical Fetch Override: All 216 calls to fetch() inside this module route through resilientFetch
const fetch = resilientFetch;

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      // Gracefully clear invalid/expired token so user is cleanly redirected rather than hitting a loop
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register') || currentPath === '/';
      const hasRefreshToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('resonova_refresh_token');
      if (!isAuthPage && !hasRefreshToken) {
        localStorage.removeItem('resonova_token');
        localStorage.removeItem('resonova_user');
      }
    }
    const message = data.message ||
      data.error?.message ||
      (typeof data.error === 'string' ? data.error : null) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = data.error?.code || `HTTP_${response.status}`;
    error.requestId = data.error?.requestId || response.headers?.get('X-Request-Id');
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  // Authentication
  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  async verifyEmailOtp({ email, otp }) {
    const res = await fetch(`${API_BASE}/auth/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    return handleResponse(res);
  },

  async resendRegistrationOtp(email) {
    const res = await fetch(`${API_BASE}/auth/resend-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await handleResponse(res);
    const token = data.token || data.accessToken;
    if (token) {
      localStorage.setItem('resonova_token', token);
      if (data.refreshToken) {
        localStorage.setItem('resonova_refresh_token', data.refreshToken);
      }
      localStorage.setItem('resonova_user', JSON.stringify(data.user));
    }
    return data;
  },

  async verifyMfa(payload) {
    const res = await fetch(`${API_BASE}/auth/verify-mfa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    const token = data.token || data.accessToken;
    if (token) {
      localStorage.setItem('resonova_token', token);
      if (data.refreshToken) {
        localStorage.setItem('resonova_refresh_token', data.refreshToken);
      }
      localStorage.setItem('resonova_user', JSON.stringify(data.user));
    }
    return data;
  },

  async refreshAccessToken() {
    const refreshToken = localStorage.getItem('resonova_refresh_token');
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!res.ok) {
        localStorage.removeItem('resonova_token');
        localStorage.removeItem('resonova_refresh_token');
        localStorage.removeItem('resonova_user');
        return null;
      }
      const data = await res.json();
      const newToken = data.token || data.accessToken;
      if (newToken) {
        localStorage.setItem('resonova_token', newToken);
        if (data.refreshToken) {
          localStorage.setItem('resonova_refresh_token', data.refreshToken);
        }
        return newToken;
      }
    } catch {
      return null;
    }
    return null;
  },

  async getMfaSetup() {
    const res = await fetch(`${API_BASE}/auth/mfa-setup`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async verifyResetOtp({ email, otp }) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    return handleResponse(res);
  },

  async resendResetOtp(email) {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async resetPassword({ token, newPassword, confirmPassword }) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword, confirmPassword })
    });
    return handleResponse(res);
  },

  async logout() {
    try {
      const refreshToken = localStorage.getItem('resonova_refresh_token');
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ refreshToken })
      });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('resonova_token');
      localStorage.removeItem('resonova_refresh_token');
      localStorage.removeItem('resonova_user');
    }
  },

  // User Profile
  async getProfile() {
    const res = await fetch(`${API_BASE}/users/profile`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateProfile(updates) {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  // Dashboard Overview (Live MySQL Statistics)
  async getDashboardOverview(options = {}) {
    const res = await fetch(`${API_BASE}/dashboard/overview`, {
      headers: { ...getAuthHeader(), ...(options.headers || {}) },
      signal: options.signal
    });
    return handleResponse(res);
  },

  // Learning Modules & Activities
  async getLearningModules() {
    const res = await fetch(`${API_BASE}/learning/modules`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getModuleStages(moduleId) {
    const res = await fetch(`${API_BASE}/learning/modules/${moduleId}/stages`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getStageById(stageId) {
    const res = await fetch(`${API_BASE}/learning/stages/${stageId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async startStage(stageId) {
    const res = await fetch(`${API_BASE}/learning/stages/${stageId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return handleResponse(res);
  },

  async completeStage(stageId) {
    const res = await fetch(`${API_BASE}/learning/stages/${stageId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return handleResponse(res);
  },

  async getTaskById(taskId) {
    const res = await fetch(`${API_BASE}/learning/tasks/${taskId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async startTask(taskId) {
    const res = await fetch(`${API_BASE}/learning/tasks/${taskId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return handleResponse(res);
  },

  async submitTask(taskId, data) {
    const res = await fetch(`${API_BASE}/learning/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async uploadTaskAudio(taskId, formData) {
    const res = await fetch(`${API_BASE}/learning/tasks/${taskId}/audio`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      },
      body: formData
    });
    return handleResponse(res);
  },

  async getTaskSubmissions(taskId) {
    const res = await fetch(`${API_BASE}/learning/tasks/${taskId}/submissions`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getTaskScore(taskId) {
    const res = await fetch(`${API_BASE}/learning/tasks/${taskId}/score`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getLearningProgress() {
    const res = await fetch(`${API_BASE}/learning/progress`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getLearningSummary() {
    const res = await fetch(`${API_BASE}/dashboard/learning-summary`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateLearningProgress(activity_id, completion_status = 'completed') {
    const res = await fetch(`${API_BASE}/learning/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ activity_id, completion_status })
    });
    return handleResponse(res);
  },

  // Legacy lessons support
  async getLessons() {
    const res = await fetch(`${API_BASE}/learning/lessons`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async toggleLessonComplete(lessonId) {
    const res = await fetch(`${API_BASE}/learning/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ lessonId })
    });
    return handleResponse(res);
  },

  // Practice Sessions & Timer
  async startPracticeSession(data = {}) {
    const res = await fetch(`${API_BASE}/practice/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async completePracticeSession(data) {
    const res = await fetch(`${API_BASE}/practice/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getPracticeSessions() {
    const res = await fetch(`${API_BASE}/practice/sessions`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async recordPracticeSession({ session_type, duration_minutes, exercise_name, notes }) {
    const res = await fetch(`${API_BASE}/practice/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ session_type, duration_minutes, exercise_name, notes })
    });
    return handleResponse(res);
  },

  async getWeeklyStats() {
    const res = await fetch(`${API_BASE}/practice/weekly-stats`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getPracticeGoal() {
    const res = await fetch(`${API_BASE}/practice/goals`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async setPracticeGoal(weekly_target_minutes) {
    const res = await fetch(`${API_BASE}/practice/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ weekly_target_minutes })
    });
    return handleResponse(res);
  },

  // Practice Reflections (Log a Practice Session & Recent Practice)
  async createPracticeReflection(data) {
    const res = await fetch(`${API_BASE}/practice/reflections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getPracticeReflections(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/practice/reflections${query ? `?${query}` : ''}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getPracticeReflectionById(id) {
    const res = await fetch(`${API_BASE}/practice/reflections/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updatePracticeReflection(id, data) {
    const res = await fetch(`${API_BASE}/practice/reflections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deletePracticeReflection(id) {
    const res = await fetch(`${API_BASE}/practice/reflections/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Personal Practice Diary (Kanban: TO DO, DOING, DONE)
  async getDiaryTasks() {
    const res = await fetch(`${API_BASE}/practice/diary/tasks`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getDiaryTaskById(id) {
    const res = await fetch(`${API_BASE}/practice/diary/tasks/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createDiaryTask(data) {
    const res = await fetch(`${API_BASE}/practice/diary/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateDiaryTask(id, data) {
    const res = await fetch(`${API_BASE}/practice/diary/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateDiaryTaskStatus(id, status, position) {
    const res = await fetch(`${API_BASE}/practice/diary/tasks/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status, position })
    });
    return handleResponse(res);
  },

  async reorderDiaryTasks(items) {
    const res = await fetch(`${API_BASE}/practice/diary/tasks/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ items })
    });
    return handleResponse(res);
  },

  async deleteDiaryTask(id) {
    const res = await fetch(`${API_BASE}/practice/diary/tasks/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createDiaryTaskFromLearning(data) {
    const res = await fetch(`${API_BASE}/practice/diary/tasks/from-learning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getLinkedLearningTasks() {
    const res = await fetch(`${API_BASE}/practice/diary/tasks/linked-learning`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Practice Analytics & Insights
  async getPracticeAnalytics() {
    const res = await fetch(`${API_BASE}/practice/analytics`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getPracticeSummary() {
    const res = await fetch(`${API_BASE}/dashboard/practice-summary`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getRecentActivity() {
    const res = await fetch(`${API_BASE}/dashboard/recent-activity`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Song Practice & Phrase Mapping
  async getSongs() {
    const res = await fetch(`${API_BASE}/songs`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createSong(songData) {
    const res = await fetch(`${API_BASE}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(songData)
    });
    return handleResponse(res);
  },

  async deleteSong(id) {
    const res = await fetch(`${API_BASE}/songs/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getSongPhrases(songId) {
    const res = await fetch(`${API_BASE}/songs/${songId}/phrases`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async addSongPhrase(songId, phraseData) {
    const res = await fetch(`${API_BASE}/songs/${songId}/phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(phraseData)
    });
    return handleResponse(res);
  },

  async updateSongPhrase(phraseId, phraseData) {
    const res = await fetch(`${API_BASE}/songs/phrases/${phraseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(phraseData)
    });
    return handleResponse(res);
  },

  async deleteSongPhrase(phraseId) {
    const res = await fetch(`${API_BASE}/songs/phrases/${phraseId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Admin & Super Admin APIs
  async getAdminOverview() {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createAdminUser(userData) {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  async updateUserRole(userId, role) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ role })
    });
    return handleResponse(res);
  },

  async getAdminPracticeReports() {
    const res = await fetch(`${API_BASE}/admin/practice-reports`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAdminAuditLogs() {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Teacher Studio (Assessment & Feedback)
  async getTeacherSubmissions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/teacher/submissions${query ? `?${query}` : ''}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getTeacherSubmissionById(submissionId) {
    const res = await fetch(`${API_BASE}/teacher/submissions/${submissionId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async assessSubmission(submissionId, data) {
    const res = await fetch(`${API_BASE}/teacher/submissions/${submissionId}/assess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async requestRevision(submissionId, data) {
    const res = await fetch(`${API_BASE}/teacher/submissions/${submissionId}/request-revision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Branding Theme Management
  async getBrandingTheme() {
    try {
      const res = await fetch(`${API_BASE}/admin/theme`, {
        headers: { ...getAuthHeader() }
      });
      return await handleResponse(res);
    } catch (e) {
      const fallbackRes = await fetch(`${API_BASE}/admin/public-theme`);
      return await handleResponse(fallbackRes);
    }
  },

  async updateBrandingTheme(themeData) {
    const res = await fetch(`${API_BASE}/admin/theme`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(themeData)
    });
    return handleResponse(res);
  },

  async getPublicTheme() {
    const res = await fetch(`${API_BASE}/admin/public-theme`);
    return handleResponse(res);
  },

  // ==========================================================================
  // 2-LEVEL LEARNING MODULE NAVIGATION CLIENT APIS
  // ==========================================================================
  async getLearningModules() {
    const res = await fetch(`${API_BASE}/learning/modules`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getLearningModuleById(moduleId) {
    const res = await fetch(`${API_BASE}/learning/modules/${moduleId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getLearningModuleProgress(moduleId) {
    const res = await fetch(`${API_BASE}/learning/modules/${moduleId}/progress`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // ==========================================================================
  // 5-STAGE BREATH MANAGEMENT MODULE CLIENT APIS
  // ==========================================================================
  async getFiveStages() {
    const res = await fetch(`${API_BASE}/learning/stages`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getStageDetails(stageId) {
    const res = await fetch(`${API_BASE}/learning/stages/${stageId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getStageObjectives(stageId = 1) {
    const res = await fetch(`${API_BASE}/learning/stages/${stageId}/objectives`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async acknowledgeStageObjectives(stageId = 1) {
    const res = await fetch(`${API_BASE}/learning/stages/${stageId}/objectives/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return handleResponse(res);
  },

  async startLearningStage(stageId) {
    const res = await fetch(`${API_BASE}/learning/stages/${stageId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return handleResponse(res);
  },

  async recordActivityProgress(data) {
    const res = await fetch(`${API_BASE}/learning/activity-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getRecallQuestions() {
    const res = await fetch(`${API_BASE}/learning/recall/questions`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async saveRecallAnswers(data) {
    const res = await fetch(`${API_BASE}/learning/recall/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getRecallAnswers() {
    const res = await fetch(`${API_BASE}/learning/recall/answers`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getPeerPinBoard(stageId = 2, questionId = null) {
    const url = questionId 
      ? `${API_BASE}/learning/recall/peer-board/${questionId}?stage_id=${stageId}`
      : `${API_BASE}/learning/recall/peer-board?stage_id=${stageId}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getLearningVideos() {
    const res = await fetch(`${API_BASE}/learning/videos`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getBreathingTips() {
    const res = await fetch(`${API_BASE}/learning/tips`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getLearningSongs() {
    const res = await fetch(`${API_BASE}/learning/songs`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async recordSongPractice(songId, data) {
    const res = await fetch(`${API_BASE}/learning/songs/${songId}/practice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // --------------------------------------------------------------------------
  // Stage 03 Part 02: Interactive Practice (Posture, Breathe, Song)
  // --------------------------------------------------------------------------
  async getPartSection(stageId = 3, partNumber = 2) {
    const res = await fetch(`${API_BASE}/learning/stages/${stageId}/parts/${partNumber}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getPostureTab(partNumber = 2) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/posture`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getBreatheTab(partNumber = 2) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/breathe`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getSongTab(partNumber = 2) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/song`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async savePostureProgress(partNumber = 2, data) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/posture/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async completePartTab(partNumber = 2, data) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getPartProgress(partNumber = 2) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/progress`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Breathing Practice Levels & Sessions (Step 2: Breathe)
  async getBreathingLevels() {
    const res = await fetch(`${API_BASE}/learning/breathing-levels`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async saveBreathingSession(partNumber = 2, data) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/breathe/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getBreathingSessions(partNumber = 2) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/breathe/sessions`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminGetBreathingLevels() {
    const res = await fetch(`${API_BASE}/admin/learning/breathing-levels`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminUpdateBreathingLevel(levelKey, data) {
    const res = await fetch(`${API_BASE}/admin/learning/breathing-levels/${levelKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Step 3: Sing it - Song Practice APIs (Snowman)
  async getSongPractice(partNumber = 2) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/song`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getSongLevels(partNumber = 2) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/song/levels`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getSongScore(partNumber = 2, levelId) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/song/levels/${levelId}/score`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async saveSongProgress(partNumber = 2, data) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/song/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async startSongSession(partNumber = 2, data) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/song/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async completeSongSession(partNumber = 2, data) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/song/session/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getSongProgress(partNumber = 2) {
    const res = await fetch(`${API_BASE}/learning/parts/${partNumber}/song/progress`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Admin Song Practice APIs
  async adminGetSongPractice() {
    const res = await fetch(`${API_BASE}/admin/song-practice`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminUpdateSongPractice(data) {
    const res = await fetch(`${API_BASE}/admin/song-practice`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminUploadSongAudio(formData) {
    const res = await fetch(`${API_BASE}/admin/song-practice/audio`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },

  async adminUploadSongScore(levelId, dataOrFormData) {
    const isFormData = typeof FormData !== 'undefined' && dataOrFormData instanceof FormData;
    const res = await fetch(`${API_BASE}/admin/song-practice/levels/${levelId}/score`, {
      method: 'POST',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...getAuthHeader()
      },
      body: isFormData ? dataOrFormData : JSON.stringify(dataOrFormData)
    });
    return handleResponse(res);
  },

  async adminUpdateSongMarkers(levelId, data) {
    const res = await fetch(`${API_BASE}/admin/song-practice/levels/${levelId}/markers`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminGetSongStudents() {
    const res = await fetch(`${API_BASE}/admin/song-practice/students`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminResetStudentSongProgress(userId) {
    const res = await fetch(`${API_BASE}/admin/song-practice/students/${userId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Stage 04: Breathe Right: Fact or Myth? Admin Methods
  async adminGetMythFactQuestions() {
    const res = await fetch(`${API_BASE}/admin/myth-fact/questions`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminUpdateMythFactQuestion(id, data) {
    const res = await fetch(`${API_BASE}/admin/myth-fact/questions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminCreateMythFactQuestion(data) {
    const res = await fetch(`${API_BASE}/admin/myth-fact/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminDeleteMythFactQuestion(id) {
    const res = await fetch(`${API_BASE}/admin/myth-fact/questions/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminGetMythFactStudentResults() {
    const res = await fetch(`${API_BASE}/admin/myth-fact/student-results`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminResetStudentMythFact(userId) {
    const res = await fetch(`${API_BASE}/admin/myth-fact/student-results/${userId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Part 02 Admin methods
  async adminGetPartSection(partId = 1) {
    const res = await fetch(`${API_BASE}/admin/learning/parts/${partId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminUpdatePartSection(partId = 1, data) {
    const res = await fetch(`${API_BASE}/admin/learning/parts/${partId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminUpdatePartTab(partId = 1, tabKey, data) {
    const res = await fetch(`${API_BASE}/admin/learning/parts/${partId}/tabs/${tabKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminCreatePostureIndicator(partId = 1, data) {
    const res = await fetch(`${API_BASE}/admin/learning/parts/${partId}/indicators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminUpdatePostureIndicator(id, data) {
    const res = await fetch(`${API_BASE}/admin/learning/indicators/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminDeletePostureIndicator(id) {
    const res = await fetch(`${API_BASE}/admin/learning/indicators/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminCreatePostureChecklistItem(partId = 1, data) {
    const res = await fetch(`${API_BASE}/admin/learning/parts/${partId}/checklist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminUpdatePostureChecklistItem(id, data) {
    const res = await fetch(`${API_BASE}/admin/learning/checklist/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminDeletePostureChecklistItem(id) {
    const res = await fetch(`${API_BASE}/admin/learning/checklist/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getLearningChallenges() {
    const res = await fetch(`${API_BASE}/learning/challenges`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Stage 04: Breathe Right: Fact or Myth? Student Methods
  async getMythFactChallenge() {
    const res = await fetch(`${API_BASE}/breath-management/challenges/myth-fact`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async submitMythFactAnswer(data) {
    const res = await fetch(`${API_BASE}/breath-management/challenges/myth-fact/submit-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async completeMythFactChallenge(data) {
    const res = await fetch(`${API_BASE}/breath-management/challenges/myth-fact/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getMythFactProgress() {
    const res = await fetch(`${API_BASE}/breath-management/challenges/myth-fact/progress`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getMythFactResults() {
    const res = await fetch(`${API_BASE}/breath-management/challenges/myth-fact/results`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Stage 04: Personal Learning Reflection Pinboard
  async getStudentReflection(moduleId = 1, stageId = 4) {
    const res = await fetch(`${API_BASE}/learning/reflections/breath-management?moduleId=${moduleId}&stageId=${stageId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async submitStudentReflection(data) {
    const res = await fetch(`${API_BASE}/learning/reflections/breath-management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateStudentReflection(data) {
    const res = await fetch(`${API_BASE}/learning/reflections/breath-management`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminGetLearningReflections(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/learning-reflections?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminResetStudentReflection(userId) {
    const res = await fetch(`${API_BASE}/admin/learning-reflections/${userId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async submitChallengeAttempt(challengeId, data) {
    const res = await fetch(`${API_BASE}/learning/challenges/${challengeId}/attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async submitWrittenAssessment(data) {
    const res = await fetch(`${API_BASE}/learning/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getWrittenAssessments() {
    const res = await fetch(`${API_BASE}/learning/assessments`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async uploadStudentRecording(formData) {
    const res = await fetch(`${API_BASE}/learning/recordings`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      },
      body: formData
    });
    return handleResponse(res);
  },

  async getStudentRecordings() {
    const res = await fetch(`${API_BASE}/learning/recordings`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  getRecordingAudioUrl(recordingId) {
    const token = localStorage.getItem('resonova_token');
    return `${API_BASE}/learning/recordings/${recordingId}/audio${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  async submitLearningFeedback(data) {
    const res = await fetch(`${API_BASE}/learning/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getLearningFeedback() {
    const res = await fetch(`${API_BASE}/learning/feedback`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async submitPracticeSummary(data) {
    const res = await fetch(`${API_BASE}/learning/practice-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getPracticeSummary() {
    const res = await fetch(`${API_BASE}/learning/practice-summary`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getLearningProgressSummary() {
    const res = await fetch(`${API_BASE}/learning/progress/summary`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Admin Modules APIs
  async getAdminModules() {
    const res = await fetch(`${API_BASE}/admin/modules`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateAdminModule(moduleId, data) {
    const res = await fetch(`${API_BASE}/admin/modules/${moduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Admin Curriculum APIs
  async getAdminCurriculum() {
    const res = await fetch(`${API_BASE}/admin/learning/curriculum`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateAdminStage(stageId, data) {
    const res = await fetch(`${API_BASE}/admin/learning/stages/${stageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async createAdminStageContent(data) {
    const res = await fetch(`${API_BASE}/admin/learning/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAdminStageContent(id, data) {
    const res = await fetch(`${API_BASE}/admin/learning/content/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getAdminStageObjectives(stageId = 1) {
    const res = await fetch(`${API_BASE}/admin/learning/stages/${stageId}/objectives`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createAdminObjective(data) {
    const res = await fetch(`${API_BASE}/admin/learning/objectives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAdminObjective(id, data) {
    const res = await fetch(`${API_BASE}/admin/learning/objectives/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAdminObjective(id) {
    const res = await fetch(`${API_BASE}/admin/learning/objectives/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createAdminRecallQuestion(data) {
    const res = await fetch(`${API_BASE}/admin/learning/recall/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAdminRecallQuestion(id, data) {
    const res = await fetch(`${API_BASE}/admin/learning/recall/questions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAdminRecallQuestion(id) {
    const res = await fetch(`${API_BASE}/admin/learning/recall/questions/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createAdminTip(data) {
    const res = await fetch(`${API_BASE}/admin/learning/tips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAdminTip(id, data) {
    const res = await fetch(`${API_BASE}/admin/learning/tips/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAdminTip(id) {
    const res = await fetch(`${API_BASE}/admin/learning/tips/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createAdminSong(data) {
    const res = await fetch(`${API_BASE}/admin/learning/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAdminSong(id, data) {
    const res = await fetch(`${API_BASE}/admin/learning/songs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAdminSong(id) {
    const res = await fetch(`${API_BASE}/admin/learning/songs/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createAdminChallenge(data) {
    const res = await fetch(`${API_BASE}/admin/learning/challenges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAdminChallenge(id, data) {
    const res = await fetch(`${API_BASE}/admin/learning/challenges/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAdminChallenge(id) {
    const res = await fetch(`${API_BASE}/admin/learning/challenges/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAdminStudentSubmissions() {
    const res = await fetch(`${API_BASE}/admin/learning/student-submissions`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async gradeAdminWrittenAssessment(id, data) {
    const res = await fetch(`${API_BASE}/admin/learning/assessments/${id}/grade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // ============================================================================
  // Stage 05: Practice Commitment, Learning Journal & Module Completion
  // ============================================================================
  async getPracticeCommitment() {
    const res = await fetch(`${API_BASE}/practice/commitment`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async savePracticeCommitment(data) {
    const res = await fetch(`${API_BASE}/practice/commitment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getLearningJournalSessions() {
    const res = await fetch(`${API_BASE}/practice/sessions`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async addLearningJournalSession(data) {
    const res = await fetch(`${API_BASE}/practice/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateLearningJournalSessionStatus(id, data) {
    const res = await fetch(`${API_BASE}/practice/sessions/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateLearningJournalSessionDetails(id, data) {
    const res = await fetch(`${API_BASE}/practice/sessions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async completePracticeActivity(activityKey) {
    const res = await fetch(`${API_BASE}/practice/activities/${activityKey}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return handleResponse(res);
  },

  async getModuleCompletionSummary(moduleId = 1) {
    const res = await fetch(`${API_BASE}/modules/${moduleId}/completion-summary`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getStagesUnlockStatus() {
    const res = await fetch(`${API_BASE}/learning/stages/unlock-status`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAdminPracticeCommitments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/practice-commitments${query ? `?${query}` : ''}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // ==========================================
  // PORTAL CONTENT MANAGEMENT SYSTEM (CMS) APIs
  // ==========================================
  async getCmsDashboardStats() {
    const res = await fetch(`${API_BASE}/cms/stats`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getPublicCmsPage(pageSlug) {
    const res = await fetch(`${API_BASE}/cms/public/${encodeURIComponent(pageSlug)}`);
    return handleResponse(res);
  },

  async getCmsSections(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/cms/sections${query ? `?${query}` : ''}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getCmsSection(id) {
    const res = await fetch(`${API_BASE}/cms/sections/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createCmsSection(data) {
    const res = await fetch(`${API_BASE}/cms/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateCmsSection(id, data) {
    const res = await fetch(`${API_BASE}/cms/sections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteCmsSection(id) {
    const res = await fetch(`${API_BASE}/cms/sections/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async publishCmsSection(id) {
    const res = await fetch(`${API_BASE}/cms/sections/${id}/publish`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async unpublishCmsSection(id) {
    const res = await fetch(`${API_BASE}/cms/sections/${id}/unpublish`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getCmsMedia(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/cms/media${query ? `?${query}` : ''}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async uploadCmsMedia(formData) {
    const res = await fetch(`${API_BASE}/cms/media`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      },
      body: formData
    });
    return handleResponse(res);
  },

  async updateCmsMedia(id, data) {
    const res = await fetch(`${API_BASE}/cms/media/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteCmsMedia(id) {
    const res = await fetch(`${API_BASE}/cms/media/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getCmsModules() {
    const res = await fetch(`${API_BASE}/cms/modules`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateCmsModule(id, data) {
    const res = await fetch(`${API_BASE}/cms/modules/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getCmsStages() {
    const res = await fetch(`${API_BASE}/cms/stages`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateCmsStage(id, data) {
    const res = await fetch(`${API_BASE}/cms/stages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getCmsRevisions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/cms/revisions${query ? `?${query}` : ''}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async rollbackCmsRevision(id) {
    const res = await fetch(`${API_BASE}/cms/revisions/${id}/rollback`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // ============================================================================
  // VIDEO TRANSCRIPTS (Student & Admin Management)
  // ============================================================================
  async getVideoTranscript(stageId, videoId) {
    const url = stageId
      ? `${API_BASE}/learning/stages/${stageId}/videos/${videoId}/transcript`
      : `${API_BASE}/learning/videos/${videoId}/transcript`;
    const res = await fetch(url, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminGetVideosForTranscript() {
    const res = await fetch(`${API_BASE}/admin/transcripts/videos`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminGetTranscripts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/transcripts${query ? `?${query}` : ''}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminGetTranscriptById(id) {
    const res = await fetch(`${API_BASE}/admin/transcripts/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminGetTranscriptByVideo(videoId) {
    const res = await fetch(`${API_BASE}/admin/transcripts/by-video/${videoId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminCreateTranscript(data) {
    const res = await fetch(`${API_BASE}/admin/transcripts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminUpdateTranscript(id, data) {
    const res = await fetch(`${API_BASE}/admin/transcripts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async adminDeleteTranscript(id) {
    const res = await fetch(`${API_BASE}/admin/transcripts/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async adminGenerateDraftTranscript(videoId) {
    const res = await fetch(`${API_BASE}/admin/transcripts/generate-draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ video_id: videoId })
    });
    return handleResponse(res);
  }
};

export default api;

