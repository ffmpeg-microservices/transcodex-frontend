import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { ProcessStatus, type ProcessResponseDto } from '../types'

interface ProcessContextValue {
  processes: ProcessResponseDto[]
  addProcess: (p: ProcessResponseDto) => void
  cancelProcess: (processId: string) => void
}

const ProcessContext = createContext<ProcessContextValue | null>(null)

export function ProcessProvider({ children }: { children: ReactNode }) {
  const [processes, setProcesses] = useState<ProcessResponseDto[]>([])

  const addProcess = useCallback((p: ProcessResponseDto) => {
    setProcesses((prev) => [p, ...prev])

    // Simulate PENDING → PROCESSING → COMPLETED
    const processingDelay = 600
    const completionDelay = processingDelay + 3000 + Math.random() * 5000

    setTimeout(() => {
      setProcesses((prev) =>
        prev.map((proc) =>
          proc.processId === p.processId &&
          proc.status === ProcessStatus.PENDING
            ? { ...proc, status: ProcessStatus.PROCESSING }
            : proc,
        ),
      )
    }, processingDelay)

    setTimeout(() => {
      setProcesses((prev) =>
        prev.map((proc) =>
          proc.processId === p.processId &&
          proc.status === ProcessStatus.PROCESSING
            ? {
                ...proc,
                status: ProcessStatus.COMPLETED,
                finalFileSize: `${(Math.random() * 48 + 2).toFixed(1)} MB`,
                storageIdOutput: `out-${proc.processId}`,
              }
            : proc,
        ),
      )
    }, completionDelay)
  }, [])

  const cancelProcess = useCallback((processId: string) => {
    setProcesses((prev) =>
      prev.map((p) =>
        p.processId === processId &&
        (p.status === ProcessStatus.PENDING ||
          p.status === ProcessStatus.PROCESSING)
          ? { ...p, status: ProcessStatus.CANCELLED }
          : p,
      ),
    )
  }, [])

  return (
    <ProcessContext.Provider value={{ processes, addProcess, cancelProcess }}>
      {children}
    </ProcessContext.Provider>
  )
}

export function useProcess(): ProcessContextValue {
  const ctx = useContext(ProcessContext)
  if (!ctx) throw new Error('useProcess must be used within <ProcessProvider>')
  return ctx
}
