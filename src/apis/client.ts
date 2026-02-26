import axios from 'axios'

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
})

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
})

// Attach JWT on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('txapp:token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global error handling — 401 → logout, etc.
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client