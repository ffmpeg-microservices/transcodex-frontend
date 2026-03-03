import { useNavigate } from 'react-router-dom'
import { useProcess } from '../context/ProcessContext'
import { ProcessStatus } from '../types'
import styles from './QueuePage.module.css'
import { useEffect, useState } from 'react'
import { getAllProcesses } from '../apis/process.api'
import { useToast } from '../components/Toast'
import { downloadFile } from '../apis/storage.api'

type Tab = 'all' | 'active' | 'completed' | 'failed'

const STATUS_LABEL: Record<ProcessStatus, string> = {
  [ProcessStatus.WAITING]:    'Queued',
  [ProcessStatus.PROCESSING]: 'Processing',
  [ProcessStatus.COMPLETED]:  'Completed',
  [ProcessStatus.FAILED]:     'Failed',
  [ProcessStatus.CANCELLED]:  'Cancelled',
}

const STATUS_CLASS: Record<ProcessStatus, string> = {
  [ProcessStatus.WAITING]:    styles.statusWaiting,
  [ProcessStatus.PROCESSING]: styles.statusProcessing,
  [ProcessStatus.COMPLETED]:  styles.statusCompleted,
  [ProcessStatus.FAILED]:     styles.statusFailed,
  [ProcessStatus.CANCELLED]:  styles.statusCancelled,
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

async function shareFile(
  fileName: string,
  storageId: string,
  toast: ReturnType<typeof useToast>,
) {
  const shareUrl = `${window.location.origin}/queue?file=${storageId}`

  if (navigator.share) {
    try {
      await navigator.share({
        title: `TranscodeX — ${fileName}`,
        text: `Check out my converted file: ${fileName}`,
        url: shareUrl,
      })
      return
    } catch (err) {
      // User dismissed the share sheet — not an error
      if ((err as DOMException).name === 'AbortError') return
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl)
    toast.success('Share link copied to clipboard!')
  } catch {
    toast.error('Could not copy link.')
  }
}

export default function QueuePage() {
  const { processes, killProcess, addProcess } = useProcess()
  const navigate = useNavigate()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getAllProcesses()
      const newData = data.filter(
        (p) => !processes.some((existing) => existing.processId === p.processId),
      )
      newData.forEach(addProcess)
      setLoading(false)
    }
    void load()
  }, [])

  async function handleDownload(storageId: string) {
    setDownloadingId(storageId)
    try {
      await downloadFile(storageId)
    } catch {
      toast.error('Download failed. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  // Tab counts
  const counts = {
    all:       processes.length,
    active:    processes.filter(p => p.status === ProcessStatus.WAITING || p.status === ProcessStatus.PROCESSING).length,
    completed: processes.filter(p => p.status === ProcessStatus.COMPLETED).length,
    failed:    processes.filter(p => p.status === ProcessStatus.FAILED || p.status === ProcessStatus.CANCELLED).length,
  }

  const filtered = processes.filter((p) => {
    if (activeTab === 'active')    return p.status === ProcessStatus.WAITING || p.status === ProcessStatus.PROCESSING
    if (activeTab === 'completed') return p.status === ProcessStatus.COMPLETED
    if (activeTab === 'failed')    return p.status === ProcessStatus.FAILED || p.status === ProcessStatus.CANCELLED
    return true
  })

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all',       label: 'All',       count: counts.all },
    { key: 'active',    label: '⚡ Active',  count: counts.active },
    { key: 'completed', label: '✓ Done',     count: counts.completed },
    { key: 'failed',    label: '✕ Failed',   count: counts.failed },
  ]

  if (!loading && processes.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>📋</span>
          <div><h1>My Jobs</h1><p>Track all your conversion jobs here</p></div>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <h3>No jobs yet</h3>
          <p>Start a conversion and it'll appear here.</p>
          <div className={styles.emptyActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/audio')}>Convert Audio</button>
            <button className={styles.btnGhost}  onClick={() => navigate('/video')}>Convert Video</button>
            <button className={styles.btnGhost}  onClick={() => navigate('/gif')}>Make GIF</button>
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
          <p>{processes.length} total{counts.active > 0 ? ` · ${counts.active} active` : ''}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`${styles.tabCount} ${activeTab === tab.key ? styles.tabCountActive : ''}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
            <span>Loading jobs…</span>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className={styles.emptyTab}>
            <p>No {activeTab === 'all' ? '' : activeTab} jobs.</p>
          </div>
        )}

        {filtered.map((proc) => {
          const isActive     = proc.status === ProcessStatus.WAITING || proc.status === ProcessStatus.PROCESSING
          const isDone       = proc.status === ProcessStatus.COMPLETED
          const isFailed     = proc.status === ProcessStatus.FAILED
          const isWaiting    = proc.status === ProcessStatus.WAITING
          const isDownloading = downloadingId === proc.storageIdOutput

          return (
            <div key={proc.processId} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.fileInfo}>
                  <span className={styles.fileIcon}>{proc.isVideo ? '🎬' : '🎵'}</span>
                  <div className={styles.fileMeta}>
                    <strong className={styles.fileName}>{proc.fileName}</strong>
                    <div className={styles.metaRow}>
                      <span>Duration: {proc.duration}</span>
                      {proc.finalFileSize && <span>Size: {proc.finalFileSize}</span>}
                      <span>{formatDate(proc.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${STATUS_CLASS[proc.status]}`}>
                  {proc.status === ProcessStatus.PROCESSING && <span className={styles.pulseDot} />}
                  {STATUS_LABEL[proc.status]}
                </span>
              </div>

              {isActive && (
                <div className={styles.progressWrap}>
                  <div className={styles.progressTrack}>
                    <div
                      className={`${styles.progressFill} ${isWaiting ? styles.progressPulse : ''}`}
                      style={{ width: `${proc.progress}%` }}
                    />
                  </div>
                  <span className={styles.progressLabel}>{proc.progress}%</span>
                </div>
              )}

              {isFailed && (
                <p className={styles.failedNote}>⚠ This job failed. Check your file and try again.</p>
              )}

              <div className={styles.cardActions}>
                {isActive && (
                  <button className={styles.btnDanger} onClick={() => killProcess(proc.processId)}>
                    ✕ Cancel
                  </button>
                )}
                {isDone && (
                  <>
                    <button
                      className={styles.btnSuccess}
                      disabled={isDownloading}
                      onClick={() => void handleDownload(proc.storageIdOutput)}
                    >
                      {isDownloading
                        ? <><span className={styles.btnSpinner} /> Downloading…</>
                        : '↓ Download'
                      }
                    </button>
                    <button
                      className={styles.btnShare}
                      onClick={() => void shareFile(proc.fileName, proc.storageIdOutput, toast)}
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
