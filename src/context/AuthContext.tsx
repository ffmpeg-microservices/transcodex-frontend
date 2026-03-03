import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { type User, type StoredUser, type AuthResult, ApiError } from '../types'
import { loginApi, logoutApi, signupApi } from '../apis/auth.api'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<AuthResult>
  signup: (
    fullName: string,
    email: string,
    username: string,
    password: string,
  ) => Promise<AuthResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const USER_KEY = 'txapp:session'
export const TOKEN = 'txapp:token'

function persistSession(u: User, token: string) {
  localStorage.setItem(USER_KEY, JSON.stringify(u))
  localStorage.setItem(TOKEN, token)
}

function clearSession() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN)
}

function readSession(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readSession)

  const login = useCallback(
    async (username: string, password: string): Promise<AuthResult> => {

      try {
        const resData = await loginApi(username, password);
        console.log(resData);
        setUser(resData.user)
        persistSession(resData.user, resData.jwt)
        return { success: true };
      } catch (error) {
        if (error instanceof ApiError) {
          return { success: false, message: error.message }
        }
        return { success: false, message: 'Something went wrong. Please try again.' }
      }
    },
    [],
  )

  const signup = useCallback(
    async (
      fullName: string,
      email: string,
      username: string,
      password: string,
    ): Promise<AuthResult> => {
      try {
        const resData = await signupApi(fullName, email, username, password);
        console.log(resData);
        setUser(resData.user)
        persistSession(resData.user, resData.jwt)
        return { success: true };
      } catch (error) {
        if (error instanceof ApiError) {
          return { success: false, message: error.message }
        }
        return { success: false, message: 'Something went wrong. Please try again.' }
      }
    },
    [],
  )

  const logout = useCallback(() => {
    logoutApi();
    setUser(null)
    clearSession()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
