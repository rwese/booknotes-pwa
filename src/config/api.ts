import { getApiConfig } from '../hooks/useApiSettings'

export const API_CONFIG = {
  get proxyBaseUrl(): string {
    return getApiConfig().proxyBaseUrl
  },
  get apiKey(): string {
    return getApiConfig().apiKey
  }
}
