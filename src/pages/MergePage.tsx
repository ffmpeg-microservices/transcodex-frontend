import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMergeFiles } from './useMergeFiles'
import { MergeTimeline } from './MergeTimeline'
import { MergePreview } from './MergePreview'
import { FilePicker } from '../components/FilePicker'
import { useProcess } from '../context/ProcessContext'
import { ProcessStatus, MediaType, type StoredFile } from '../types'
import styles from './MergePage.module.css'

const MAX_FILES = 10

function formatDur(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function MergePage() {
  const navigate = useNavigate()
  const {
    items, errors, addFiles, addFromStored,
    removeItem, reorder, clearAll,
    totalDuration, hasVideo, mixed,
  } = useMergeFiles()
  const { addProcess } = useProcess()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [outputFormat, setOutputFormat] = useState<string>(MediaType.mp4)
  const [submitted, setSubmitted] = useState(false)
  const [dropzoneActive, setDropzoneActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const outputFormats = hasVideo
    ? [MediaType.mp4, MediaType.mkv, MediaType.mov, MediaType.webm, MediaType.avi]
    : [MediaType.mp3, MediaType.aac, MediaType.wav, MediaType.flac, MediaType.ogg]

  function handleDropzoneFiles(files: FileList | File[]) {
    void addFiles(files)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDropzoneActive(false)
    handleDropzoneFiles(e.dataTransfer.files)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleDropzoneFiles(e.target.files)
    e.target.value = ''
  }

  // Multi-select from server
  function handleStoredPick(files: StoredFile[]) {
    addFromStored(files)
  }

  function handleSubmit() {
    if (items.length < 2) return
    const baseName = items.map((i) => i.fileName.replace(/\.[^.]+$/, '')).join('+')
    addProcess({
      fileName: `${baseName.slice(0, 40)}_merged.${outputFormat}`,
      duration: formatDur(totalDuration),
      finalFileSize: '',
      isVideo: hasVideo,
      processId: `proc-${Date.now()}`,
      storageIdOutput: '',
      status: ProcessStatus.PENDING,
      createdAt: new Date().toISOString(),
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successEmoji}>🚀</div>
          <h2>Merge Started!</h2>
          <p>
            {items.length} file{items.length !== 1 ? 's' : ''} are being merged into a single{' '}
            <strong>.{outputFormat}</strong> file.
          </p>
          <div className={styles.successActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/queue')}>View Progress</button>
            <button className={styles.btnGhost} onClick={() => { clearAll(); setSubmitted(false) }}>Merge More Files</button>
          </div>
        </div>
      </div>
    )
  }

  const canSubmit = items.length >= 2

  return (
    <div className={styles.page}>
      <FilePicker
        open={pickerOpen}
        multi
        accept="all"
        onSelect={handleStoredPick}
        onClose={() => setPickerOpen(false)}
      />

      <div className={styles.pageHeader}>
        <span className={styles.pageIcon}>🔗</span>
        <div>
          <h1>Merge Media</h1>
          <p>Arrange and combine up to {MAX_FILES} audio or video files into one</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── Step 1: Upload ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>1. Add Files</h2>

          <div className={styles.addRow}>
            {/* Dropzone */}
            <div
              role="button"
              tabIndex={0}
              className={`${styles.dropzone} ${dropzoneActive ? styles.dropzoneActive : ''} ${items.length >= MAX_FILES ? styles.dropzoneDisabled : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDropzoneActive(true) }}
              onDragLeave={() => setDropzoneActive(false)}
              onDrop={handleDrop}
              onClick={() => items.length < MAX_FILES && inputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && items.length < MAX_FILES && inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="video/*,audio/*" multiple className={styles.hiddenInput} onChange={handleChange} />
              <span className={styles.dropIcon}>📂</span>
              {items.length >= MAX_FILES ? (
                <p className={styles.dropText}>Maximum {MAX_FILES} files reached</p>
              ) : (
                <>
                  <p className={styles.dropText}>Drop files or <span className={styles.dropLink}>browse</span></p>
                  <p className={styles.dropHint}>{items.length}/{MAX_FILES} · Max 20 MB each</p>
                </>
              )}
            </div>

            {/* Divider */}
            <div className={styles.addDivider}><span>or</span></div>

            {/* Pick from server */}
            <button
              type="button"
              className={styles.serverPickBtn}
              onClick={() => setPickerOpen(true)}
              disabled={items.length >= MAX_FILES}
            >
              <span>🗂️</span>
              <span>Choose from<br />my uploaded files</span>
            </button>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className={styles.errorList}>
              {errors.map((err, i) => <p key={i} className={styles.errorItem}>⚠ {err}</p>)}
            </div>
          )}
          {mixed && (
            <div className={styles.warning}>
              ⚠ Mixed video and audio files — audio-only files will render with a black frame.
            </div>
          )}
        </section>

        {/* ── Step 2: Arrange ── */}
        <section className={styles.section}>
          <div className={styles.sectionTop}>
            <h2 className={styles.sectionLabel}>2. Arrange Order</h2>
            {items.length > 0 && <button className={styles.clearBtn} onClick={clearAll}>Clear all</button>}
          </div>
          <MergeTimeline
            items={items}
            totalDuration={totalDuration}
            activeId={activeId}
            onReorder={reorder}
            onRemove={removeItem}
            onSelect={setActiveId}
          />
        </section>

        {/* ── Step 3: Preview ── */}
        {items.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>3. Preview Output</h2>
            <MergePreview
              items={items}
              activeId={activeId}
              onActiveChange={setActiveId}
              totalDuration={totalDuration}
            />
          </section>
        )}

        {/* ── Step 4: Submit ── */}
        {items.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>4. Export &amp; Submit</h2>
            <div className={styles.exportRow}>
              <div className={styles.field}>
                <label>Output Format</label>
                <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
                  {outputFormats.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                </select>
              </div>
              <div className={styles.summary}>
                <div className={styles.summaryRow}><span>Files</span><strong>{items.length}</strong></div>
                <div className={styles.summaryRow}><span>Total duration</span><strong>{formatDur(totalDuration)}</strong></div>
                <div className={styles.summaryRow}><span>Output type</span><strong>{hasVideo ? 'Video' : 'Audio'}</strong></div>
              </div>
            </div>
            <div className={styles.submitRow}>
              {!canSubmit && <p className={styles.submitHint}>Add at least 2 files to merge</p>}
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={!canSubmit}>
                ⚡ Merge {items.length} Files
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
