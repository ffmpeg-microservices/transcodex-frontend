import { useEffect, useState } from 'react'
import { ProcessStatus } from '../types'
import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  status: ProcessStatus
}

const COLOR: Record<ProcessStatus, string> = {
  [ProcessStatus.PENDING]: '#f59e0b',
  [ProcessStatus.PROCESSING]: '#5b6ef5',
  [ProcessStatus.COMPLETED]: '#10c98f',
  [ProcessStatus.FAILED]: '#ef4444',
  [ProcessStatus.CANCELLED]: '#6b7280',
}

export function ProgressBar({ status }: ProgressBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (status === ProcessStatus.PENDING) {
      setProgress(5)
      return
    }
    if (status === ProcessStatus.PROCESSING) {
      setProgress(12)
      const id = setInterval(() => {
        setProgress((p) => {
          if (p >= 88) {
            clearInterval(id)
            return 88
          }
          return p + Math.random() * 7
        })
      }, 450)
      return () => clearInterval(id)
    }
    if (status === ProcessStatus.COMPLETED) {
      setProgress(100)
    }
    if (
      status === ProcessStatus.CANCELLED ||
      status === ProcessStatus.FAILED
    ) {
      setProgress(0)
    }
  }, [status])

  return (
    <div className={styles.track}>
      <div
        className={styles.bar}
        style={{
          width: `${progress}%`,
          background: COLOR[status],
        }}
      />
    </div>
  )
}
