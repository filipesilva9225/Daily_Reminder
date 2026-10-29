import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse } from '../types/api.types';

const TOKEN_STORAGE_KEY = 'daily_reminder_token';

// Cache em memória para evitar leituras repetidas ao localStorage (js-cache-storage)
let cachedToken: string | null = null;

export function getAuthToken(): string | null {
  if (cachedToken !== null) {
    return cachedToken;
  }
  try {
    cachedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    return cachedToken;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  cachedToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Fallback silencioso caso o storage esteja bloqueado
  }
}

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode = 500,
    code = 'NETWORK_ERROR',
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const baseURL =
  import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (!error.response) {
      return Promise.reject(
        new ApiClientError(
          'Não foi possível conectar ao servidor. Verifique se o backend está em execução.',
          0,
          'CONNECTION_ERROR'
        )
      );
    }

    const { status, data } = error.response;

    if (status === 401) {
      setAuthToken(null);
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    const message =
      data?.error?.message || 'Ocorreu um erro ao processar a solicitação.';
    const code = data?.error?.code || 'API_ERROR';
    const details = data?.error?.details;

    return Promise.reject(new ApiClientError(message, status, code, details));
  }
);

