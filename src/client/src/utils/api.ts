// ==========================================
// API UTILITIES
// Funções utilitárias para chamadas de API
// ==========================================

import { AUTH_TOKEN_KEY } from '../constants/storage';

/**
 * Faz uma requisição fetch com token de autenticação
 * Adiciona automaticamente o header Authorization com o token do localStorage
 *
 * @example
 * const response = await authenticatedFetch('/api/profile');
 * const data = await response.json();
 *
 * @example
 * const response = await authenticatedFetch('/api/profile', {
 *   method: 'PUT',
 *   body: JSON.stringify({ name: 'New Name' }),
 * });
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  const headers = new Headers(options?.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Se o body é JSON e não tem Content-Type, adicionar
  if (options?.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    try {
      JSON.parse(options.body);
      headers.set('Content-Type', 'application/json');
    } catch {
      // Não é JSON, deixar sem Content-Type
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Faz uma requisição GET autenticada e retorna os dados parseados
 *
 * @example
 * const profile = await fetchData<UserProfile>('/api/profile');
 */
export async function fetchData<T>(url: string): Promise<T> {
  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Faz uma requisição POST autenticada com dados JSON
 *
 * @example
 * const result = await postData<Result>('/api/action', { data: 'value' });
 */
export async function postData<T>(url: string, data: unknown): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Faz uma requisição PUT autenticada com dados JSON
 *
 * @example
 * const result = await putData<Result>('/api/resource/123', { data: 'value' });
 */
export async function putData<T>(url: string, data: unknown): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Faz uma requisição DELETE autenticada
 *
 * @example
 * await deleteData('/api/resource/123');
 */
export async function deleteData(url: string): Promise<void> {
  const response = await authenticatedFetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }
}
