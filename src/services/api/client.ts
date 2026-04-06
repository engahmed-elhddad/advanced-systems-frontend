import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import axiosRetry from 'axios-retry'
import { useAuthStore } from '@/state/useAuthStore'
import {
  ApiError,
  NetworkError,
  RateLimitError,
  ServerError,
  ValidationError,
} from '@/types/api'

const baseURL = process.env.NEXT_PUBLIC_API_URL
if (!baseURL) {
  throw new Error('NEXT_PUBLIC_API_URL is required')
}

type ApiClient = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> & {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
}

const rawClient = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})
export const apiClient = rawClient as ApiClient

axiosRetry(rawClient, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => axiosRetry.isNetworkError(error),
})

rawClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function parseValidationFields(detail: unknown): Record<string, string[]> {
  const fields: Record<string, string[]> = {}
  if (Array.isArray(detail)) {
    for (const item of detail) {
      if (typeof item === 'object' && item !== null && 'loc' in item && 'msg' in item) {
        const loc = (item as { loc: (string | number)[]; msg: string }).loc
        const key = loc.filter((x) => typeof x === 'string').join('.') || 'form'
        const msg = String((item as { msg: string }).msg)
        fields[key] = fields[key] ? [...fields[key], msg] : [msg]
      }
    }
    return fields
  }
  if (typeof detail === 'object' && detail !== null) {
    for (const [k, v] of Object.entries(detail as Record<string, unknown>)) {
      if (Array.isArray(v)) fields[k] = v.map(String)
      else if (typeof v === 'string') fields[k] = [v]
    }
  }
  return fields
}

rawClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw new NetworkError()
    }
    const status = error.response?.status
    const data = error.response?.data as Record<string, unknown> | undefined

    if (error.code === 'ECONNABORTED') {
      throw new NetworkError('Request timed out')
    }
    if (!error.response) {
      throw new NetworkError()
    }

    if (status === 401) {
      useAuthStore.getState().logout()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new ApiError(401, 'unauthorized', 'Unauthorized')
    }

    if (status === 422) {
      const fields = parseValidationFields(data?.detail ?? data)
      throw new ValidationError(fields)
    }

    if (status === 429) {
      throw new RateLimitError()
    }

    if (status !== undefined && status >= 500) {
      const msg =
        typeof data?.detail === 'string' ? data.detail : 'Server error. Please try again later.'
      throw new ServerError(msg, status)
    }

    const msg =
      typeof data?.detail === 'string'
        ? data.detail
        : error.message || 'Request failed'
    throw new ApiError(status ?? 0, 'http_error', msg)
  }
)
