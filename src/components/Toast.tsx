import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from 'react'
import styles from './Toast.module.css'

// ─── Types ──────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration: number
}

interface ToastContextValue {
    success: (message: string, duration?: number) => void
    error: (message: string, duration?: number) => void
    warning: (message: string, duration?: number) => void
}

// ─── Context ─────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Single Toast item ────────────────────────────────────────

function ToastItem({
    toast,
    onDismiss,
}: {
    toast: Toast
    onDismiss: (id: string) => void
}) {
    const [exiting, setExiting] = useState(false)

    const dismiss = useCallback(() => {
        setExiting(true)
        setTimeout(() => onDismiss(toast.id), 300)
    }, [toast.id, onDismiss])

    useEffect(() => {
        const timer = setTimeout(dismiss, toast.duration)
        return () => clearTimeout(timer)
    }, [toast.duration, dismiss])

    const icons: Record<ToastType, string> = {
        success: '✓',
        error: '✕',
        warning: '⚠',
    }

    return (
        <div
            className={`${styles.toast} ${styles[toast.type]} ${exiting ? styles.exiting : ''}`}
            role="alert"
            aria-live="polite"
        >
            <span className={styles.icon}>{icons[toast.type]}</span>
            <p className={styles.message}>{toast.message}</p>
            <button className={styles.close} onClick={dismiss} aria-label="Dismiss">
                ✕
            </button>
        </div>
    )
}

// ─── Provider ─────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const add = useCallback((type: ToastType, message: string, duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        setToasts((prev) => [...prev, { id, type, message, duration }])
    }, [])

    const value: ToastContextValue = {
        success: (msg, dur) => add('success', msg, dur),
        error: (msg, dur) => add('error', msg, dur),
        warning: (msg, dur) => add('warning', msg, dur),
    }

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className={styles.container} aria-label="Notifications">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

// ─── Hook ─────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
    return ctx
}