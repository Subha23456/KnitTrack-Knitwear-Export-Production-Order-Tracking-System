import { Order, User, TamilNoteAnalysisResult, AuthResponse, DemoCredential } from '../types';

export interface PendingFloorUpdate {
  tempId: string;
  orderId: string;
  stage: string;
  quantityDoneToday: number;
  photoUrl?: string;
  originalNoteTamil?: string;
  queuedAt: string;
}

const TOKEN_KEY = 'knittrack_auth_token';
const OFFLINE_QUEUE_KEY = 'knittrack_supervisor_offline_queue';

// Token Management
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error('Failed to set auth token in storage:', e);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Offline Queue Management
export function getOfflineQueue(): PendingFloorUpdate[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToOfflineQueue(update: PendingFloorUpdate): void {
  try {
    const queue = getOfflineQueue();
    queue.push(update);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save to offline storage:', e);
  }
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (e) {
    console.error('Failed to clear offline storage:', e);
  }
}

// -----------------------------------------------------------------------------
// Authentication APIs
// -----------------------------------------------------------------------------
export async function fetchDemoCredentials(): Promise<DemoCredential[]> {
  const res = await fetch('/api/auth/demo-credentials');
  if (!res.ok) throw new Error('Failed to fetch demo credentials');
  return res.json();
}

export async function loginWithUserId(userId: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Login failed');
  }
  const data: AuthResponse = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function loginWithCredentials(email: string, password?: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid credentials');
  }
  const data: AuthResponse = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch('/api/auth/me', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Not authenticated');
  }
  const data = await res.json();
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (e) {
    console.error('Logout error:', e);
  } finally {
    setAuthToken(null);
  }
}

// -----------------------------------------------------------------------------
// Orders APIs (Protected by Server-Side Auth & Roles)
// -----------------------------------------------------------------------------
export async function fetchOrders(
  filters?: { buyer?: string; unit?: string; status?: string }
): Promise<Order[]> {
  const params = new URLSearchParams();
  if (filters?.buyer) params.set('buyer', filters.buyer);
  if (filters?.unit) params.set('unit', filters.unit);
  if (filters?.status) params.set('status', filters.status);

  const res = await fetch(`/api/orders?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch orders');
  }
  return res.json();
}

export async function fetchOrderDetail(id: string): Promise<Order> {
  const res = await fetch(`/api/orders/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch order detail');
  }
  return res.json();
}

export async function createOrder(data: Partial<Order>): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create order');
  }
  return res.json();
}

export async function submitDailyFloorUpdate(payload: {
  orderId: string;
  stage: string;
  quantityDoneToday: number;
  photoUrl?: string;
  originalNoteTamil?: string;
}): Promise<{ success: boolean; isOffline?: boolean; order?: Order }> {
  // If browser is offline, queue immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    saveToOfflineQueue({
      tempId: `offline-${Date.now()}`,
      ...payload,
      queuedAt: new Date().toISOString(),
    });
    return { success: true, isOffline: true };
  }

  try {
    const res = await fetch(`/api/orders/${payload.orderId}/daily-update`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    return { success: true, order: data.order };
  } catch (err) {
    console.warn('[Network/Server Error] Queuing update for offline sync:', err);
    saveToOfflineQueue({
      tempId: `offline-${Date.now()}`,
      ...payload,
      queuedAt: new Date().toISOString(),
    });
    return { success: true, isOffline: true };
  }
}

export async function syncOfflineQueue(): Promise<{ syncedCount: number; errors: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, errors: 0 };

  let syncedCount = 0;
  let errors = 0;
  const remaining: PendingFloorUpdate[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(`/api/orders/${item.orderId}/daily-update`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      });
      if (res.ok) {
        syncedCount++;
      } else {
        remaining.push(item);
        errors++;
      }
    } catch {
      remaining.push(item);
      errors++;
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  return { syncedCount, errors };
}

export async function updateExFactoryDate(
  orderId: string,
  newExFactoryDate: string,
  reason: string
): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/dates`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ newExFactoryDate, reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update date');
  }
  return res.json();
}

export async function confirmDelayWarning(
  orderId: string,
  payload: {
    warningText: string;
    mitigationPlan: string;
    revisedExFactoryDate?: string;
  }
): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/confirm-warning`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to confirm warning');
  }
  return res.json();
}

export async function reviewDailyLog(
  orderId: string,
  logId: string,
  payload: {
    reviewStatus: 'confirmed' | 'rejected';
    correctedCategory?: string;
    merchandiserComment?: string;
    isSharedWithBuyer?: boolean;
  }
): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/logs/${logId}/review`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update review status');
  }
  return res.json();
}

export async function analyzeTamilNoteDirect(
  note: string,
  stage: string,
  unit: string
): Promise<TamilNoteAnalysisResult> {
  const res = await fetch('/api/ai/analyze-tamil-note', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ note, stage, unit }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to analyze note');
  }
  return res.json();
}

export async function resetDatabase(): Promise<void> {
  const res = await fetch('/api/orders/reset', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Reset failed (MD role required)');
  }
}
