import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useWebSocket } from './WebSocketContext'
import {
  ProcessStatus,
  type FfmpegCmdResponse,
  type ProcessDto,
} from '../types'

// ─── Types ───────────────────────────────────────────────────

export interface TrackedProcess extends ProcessDto {
  progress: number   // 0–100, driven by WS
}

interface ProcessContextValue {
  processes: TrackedProcess[]
  addProcess: (p: ProcessDto) => void
  killProcess: (processId: string) => void
}

// ─── Context ─────────────────────────────────────────────────

const ProcessContext = createContext<ProcessContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────

export function ProcessProvider({ children }: { children: ReactNode }) {
  const [processes, setProcesses] = useState<TrackedProcess[]>([])
  const { subscribe, send } = useWebSocket()

  const addProcess = useCallback(
    (p: ProcessDto) => {
      const tracked: TrackedProcess = { ...p, progress: 0, status: ProcessStatus.WAITING }
      setProcesses((prev) => [tracked, ...prev])

      // Subscribe to /topic/progress.{processId}
      const topic = `/topic/progress.${p.processId}`

      const unsubscribe = subscribe(topic, (body: string) => {
        try {
          const msg = JSON.parse(body) as FfmpegCmdResponse

          setProcesses((prev) =>
            prev.map((proc) => {
              if (proc.processId !== msg.processId) return proc
              return {
                ...proc,
                status: msg.status,
                progress: msg.progress,
                duration: msg.duration || proc.duration,
                finalFileSize: msg.finalFileSize || proc.finalFileSize,
              }
            }),
          )

          // Stop listening once terminal state reached
          if (msg.status === ProcessStatus.COMPLETED || msg.status === ProcessStatus.FAILED) {
            unsubscribe()
          }
        } catch (err) {
          console.error('[ProcessContext] Failed to parse WS message:', err)
        }
      })
    },
    [subscribe],
  )

  const killProcess = useCallback(
    (processId: string) => {
      // Send to Spring @MessageMapping("/kill/{processId}") → maps to /app/kill/{processId}
      send(`/app/kill/${processId}`)

      // Optimistically update UI immediately
      setProcesses((prev) =>
        prev.map((p) =>
          p.processId === processId &&
            (p.status === ProcessStatus.WAITING || p.status === ProcessStatus.PROCESSING)
            ? { ...p, status: ProcessStatus.CANCELLED, progress: 0 }
            : p,
        ),
      )
    },
    [send],
  )

  return (
    <ProcessContext.Provider value={{ processes, addProcess, killProcess }}>
      {children}
    </ProcessContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────

export function useProcess(): ProcessContextValue {
  const ctx = useContext(ProcessContext)
  if (!ctx) throw new Error('useProcess must be used within <ProcessProvider>')
  return ctx
}
