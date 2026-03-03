import axios from 'axios'
import { TOKEN } from '../context/AuthContext'
import { refreshToken } from './auth.api'

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
})

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
  withCredentials: true
})

// Attach JWT on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global error handling — 401 → logout, etc.
// client.interceptors.response.use(
//   (res) => res,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.clear()
//       window.location.href = '/login'
//     }
//     return Promise.reject(error)
//   }
// )


let isRefreshing = false
// Queue of requests that came in while refresh was in progress
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    error ? p.reject(error) : p.resolve(token!)
  })
  failedQueue = []
}

// Attach access token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — silent refresh then retry
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // Not a 401, or already retried — don't retry again
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // If refresh is already running, queue this request until it's done
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return client(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {

      const data = await refreshToken()

      // Store new tokens
      console.log("Refresh Token:", data);

      localStorage.setItem(TOKEN, data)

      // Let all queued requests through with new token
      processQueue(null, data)

      // Retry the original request
      original.headers.Authorization = `Bearer ${data}`
      return client(original)
    } catch (refreshError) {
      // Refresh failed — log user out
      console.log("Error Occurred", refreshError);

      processQueue(refreshError, null)
      localStorage.clear()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default client