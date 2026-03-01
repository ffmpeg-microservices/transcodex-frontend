import { useNavigate } from 'react-router-dom'
import { useProcess } from '../context/ProcessContext'
import { ProcessStatus } from '../types'
import styles from './ProcessingBanner.module.css'

interface ProcessingBannerProps {
  processId: string
  onStartAnother: () => void
  anotherLabel?: string
}

const STATUS_TEXT: Partial<Record<ProcessStatus, string>> = {
  [ProcessStatus.WAITING]: 'Queued — waiting to start…',
  [ProcessStatus.PROCESSING]: 'Processing your file…',
  [ProcessStatus.COMPLETED]: 'Done! Your file is ready.',
  [ProcessStatus.FAILED]: 'Something went wrong.',
  [ProcessStatus.CANCELLED]: 'Job was cancelled.',
}

export function ProcessingBanner({
  processId,
  onStartAnother,
  anotherLabel = 'Start Another',
}: ProcessingBannerProps) {
  const { processes, killProcess } = useProcess()
  const navigate = useNavigate()

  const proc = processes.find((p) => p.processId === processId)
  if (!proc) return null

  const isActive = proc.status === ProcessStatus.WAITING || proc.status === ProcessStatus.PROCESSING
  const isDone = proc.status === ProcessStatus.COMPLETED
  const isFailed = proc.status === ProcessStatus.FAILED
  const isWaiting = proc.status === ProcessStatus.WAITING

  return (
    <div className={`${styles.banner} ${isDone ? styles.bannerDone : isFailed ? styles.bannerFailed : ''}`}>
      <div className={styles.top}>
        <div className={styles.iconWrap}>
          {isDone && <span className={styles.doneIcon}>✓</span>}
          {isFailed && <span className={styles.failIcon}>✕</span>}
          {isActive && <div className={styles.spinner} />}
        </div>

        <div className={styles.info}>
          <p className={styles.fileName}>{proc.fileName}</p>
          <p className={styles.statusText}>{STATUS_TEXT[proc.status]}</p>
        </div>

        {isActive && (
          <span className={styles.progressPct}>{proc.progress}%</span>
        )}
      </div>

      {/* Progress bar */}
      {isActive && (
        <div className={styles.track}>
          <div
            className={`${styles.fill} ${isWaiting ? styles.fillPulse : ''}`}
            style={{ width: `${proc.progress}%` }}
          />
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {isActive && (
          <button
            className={styles.btnCancel}
            onClick={() => killProcess(processId)}
          >
            ✕ Cancel job
          </button>
        )}
        <button className={styles.btnQueue} onClick={() => navigate('/queue')}>
          View all jobs
        </button>
        {(isDone || isFailed) && (
          <button className={styles.btnAnother} onClick={onStartAnother}>
            {anotherLabel}
          </button>
        )}
      </div>
    </div>
  )
}
