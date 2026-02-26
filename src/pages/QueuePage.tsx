import { useNavigate } from 'react-router-dom'
import { useProcess } from '../context/ProcessContext'
import { ProgressBar } from '../components/ProgressBar'
import { ProcessStatus } from '../types'
import styles from './QueuePage.module.css'

const STATUS_LABEL: Record<ProcessStatus, string> = {
  [ProcessStatus.PENDING]: 'Queued',
  [ProcessStatus.PROCESSING]: 'Processing',
  [ProcessStatus.COMPLETED]: 'Completed',
  [ProcessStatus.FAILED]: 'Failed',
  [ProcessStatus.CANCELLED]: 'Cancelled',
}

const STATUS_CLASS: Record<ProcessStatus, string> = {
  [ProcessStatus.PENDING]: styles.statusPending,
  [ProcessStatus.PROCESSING]: styles.statusProcessing,
  [ProcessStatus.COMPLETED]: styles.statusCompleted,
  [ProcessStatus.FAILED]: styles.statusFailed,
  [ProcessStatus.CANCELLED]: styles.statusCancelled,
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return (
      d.toLocaleDateString() +
      ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  } catch (e) {
    console.log('Error parsing date:', e);
  }
}

export default function QueuePage() {
  const { processes, cancelProcess } = useProcess()
  const navigate = useNavigate()

  const activeCount = processes.filter(
    (p) =>
      p.status === ProcessStatus.PENDING ||
      p.status === ProcessStatus.PROCESSING,
  ).length

  if (processes.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>📋</span>
          <div>
            <h1>My Jobs</h1>
            <p>Track all your conversion jobs here</p>
          </div>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <h3>No jobs yet</h3>
          <p>Start a conversion and it&apos;ll appear here.</p>
          <div className={styles.emptyActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/audio')}>
              Convert Audio
            </button>
            <button className={styles.btnGhost} onClick={() => navigate('/video')}>
              Convert Video
            </button>
            <button className={styles.btnGhost} onClick={() => navigate('/gif')}>
              Make GIF
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>📋</span>
        <div>
          <h1>My Jobs</h1>
          <p>
            {processes.length} total
            {activeCount > 0 && ` · ${activeCount} active`}
          </p>
        </div>
      </div>

      <div className={styles.list}>
        {processes.map((item) => {
          const proc = item.processResponseDto
          console.log('Rendering process:', proc);

          const isActive =
            proc.status === ProcessStatus.PENDING ||
            proc.status === ProcessStatus.PROCESSING
          const isDone = proc.status === ProcessStatus.COMPLETED

          return (
            <div key={proc.processId} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.fileInfo}>
                  <span className={styles.fileIcon}>
                    {proc.isVideo ? '🎬' : '🎵'}
                  </span>
                  <div className={styles.fileMeta}>
                    <strong className={styles.fileName}>{proc.fileName}</strong>
                    <div className={styles.metaRow}>
                      <span>Duration: {proc.duration}</span>
                      {proc.finalFileSize && (
                        <span>Size: {proc.finalFileSize}</span>
                      )}
                      <span>{formatDate(proc.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${STATUS_CLASS[proc.status]}`}>
                  {proc.status === ProcessStatus.PROCESSING && (
                    <span className={styles.pulseDot} />
                  )}
                  {STATUS_LABEL[proc.status]}
                </span>
              </div>

              {isActive && <ProgressBar status={proc.status} />}

              <div className={styles.cardActions}>
                {isActive && (
                  <button
                    className={styles.btnDanger}
                    onClick={() => cancelProcess(proc.processId)}
                  >
                    ✕ Cancel
                  </button>
                )}
                {isDone && (
                  <>
                    <button
                      className={styles.btnSuccess}
                      onClick={() => {
                        alert(`Download started: ${proc.fileName}`)
                      }}
                    >
                      ↓ Download
                    </button>
                    <button
                      className={styles.btnGhost}
                      onClick={() => {
                        if (navigator.share) {
                          void navigator.share({
                            title: proc.fileName,
                            text: `TranscodeX: ${proc.fileName}`,
                          })
                        } else {
                          void navigator.clipboard.writeText(
                            `TranscodeX file: ${proc.fileName} (ID: ${proc.storageIdOutput})`,
                          )
                          alert('Share link copied!')
                        }
                      }}
                    >
                      ↗ Share
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
