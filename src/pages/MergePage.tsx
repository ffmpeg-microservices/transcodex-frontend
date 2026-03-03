import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { MergeTimeline } from './MergeTimeline'
import { MergePreview } from './MergePreview'
import { FilePicker } from '../components/FilePicker'
import { ProcessingBanner } from '../components/ProcessingBanner'
import { useProcess } from '../context/ProcessContext'
import { useToast } from '../components/Toast'
import { ProcessStatus, MediaType, type StoredFile, ApiError, VideoCodecType, AudioCodecType } from '../types'
import styles from './MergePage.module.css'
import { useMergeFiles } from '../hooks/useMergeFiles'
import { mergeMedia } from '../apis/process.api'

const MAX_FILES = 10

function formatDur(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function MergePage() {
  const {
    items, validationErrors, uploadState,
    addFiles, addFromStored,
    removeItem, reorder, clearAll,
    totalDuration, hasVideo, mixed,
  } = useMergeFiles()

  const { addProcess } = useProcess()
  const toast = useToast()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [outputFormat, setOutputFormat] = useState<MediaType>(MediaType.mp4)
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null)
  const [dropzoneActive, setDropzoneActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const outputFormats = hasVideo
    ? [MediaType.mp4, MediaType.mkv, MediaType.mov, MediaType.webm, MediaType.avi]
    : [MediaType.mp3, MediaType.aac, MediaType.wav, MediaType.flac, MediaType.ogg]

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDropzoneActive(false)
    if (!uploadState.isUploading) void addFiles(e.dataTransfer.files)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && !uploadState.isUploading) void addFiles(e.target.files)
    e.target.value = ''
  }

  function handleStoredPick(files: StoredFile[]) {
    addFromStored(files)
  }

  async function handleSubmit() {
    if (items.length < 2) return

    // Guard: all items must have a storageId (uploaded or server-picked)
    const missing = items.filter((i) => !i.storageId)
    if (missing.length > 0) {
      toast.error('Some files are still uploading. Please wait.')
      return
    }

    try {
      const newProcess = await mergeMedia({
        mediaFiles: items.map((i) => ({ storageId: i.storageId, type: i.isVideo ? 'video' : 'audio' })),
        duration: formatDur(totalDuration),
        toMediaType: outputFormat,
        videoCodec: hasVideo ? VideoCodecType.h264 : undefined,
        audioCodec: AudioCodecType.aac,//!hasVideo ? AudioCodecType.aac : undefined,
        resolutionHeight: 720,
      })
      addProcess(newProcess.processResponseDto)
      setActiveProcessId(newProcess.processResponseDto.processId)

      toast.success('Conversion started! You can keep working.')
    } catch (err) {
      toast.error((err as ApiError).message)
    }
  }

  const canSubmit = items.length >= 2 && !uploadState.isUploading
  const isAtMax = items.length >= MAX_FILES

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
        {/* ── Job progress banner ── */}
        {activeProcessId && (
          <ProcessingBanner
            processId={activeProcessId}
            onStartAnother={() => { clearAll(); setActiveProcessId(null) }}
            anotherLabel="Merge More Files"
          />
        )}

        {/* ── Step 1: Add files ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>1. Add Files</h2>

          <div className={styles.addRow}>
            {/* Dropzone */}
            <div
              role="button"
              tabIndex={0}
              className={`
                ${styles.dropzone}
                ${dropzoneActive ? styles.dropzoneActive : ''}
                ${isAtMax || uploadState.isUploading ? styles.dropzoneDisabled : ''}
              `}
              onDragOver={(e) => { e.preventDefault(); if (!uploadState.isUploading) setDropzoneActive(true) }}
              onDragLeave={() => setDropzoneActive(false)}
              onDrop={handleDrop}
              onClick={() => !isAtMax && !uploadState.isUploading && inputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && !isAtMax && !uploadState.isUploading && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/*,audio/*"
                multiple
                className={styles.hiddenInput}
                onChange={handleChange}
              />

              {uploadState.isUploading ? (
                /* ── Upload in progress ── */
                <div className={styles.uploadingState}>
                  <div className={styles.uploadSpinner} />
                  <p className={styles.uploadingText}>
                    Uploading {uploadState.fileCount} file{uploadState.fileCount !== 1 ? 's' : ''}…
                  </p>
                  <div className={styles.uploadTrack}>
                    <div
                      className={styles.uploadFill}
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                  <p className={styles.uploadPct}>{uploadState.progress}%</p>
                </div>
              ) : isAtMax ? (
                <p className={styles.dropText}>Maximum {MAX_FILES} files reached</p>
              ) : (
                <>
                  <span className={styles.dropIcon}>📂</span>
                  <p className={styles.dropText}>
                    Drop files or <span className={styles.dropLink}>browse</span>
                  </p>
                  <p className={styles.dropHint}>
                    {items.length}/{MAX_FILES} files · Max 20 MB each
                  </p>
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
              disabled={isAtMax || uploadState.isUploading}
            >
              <span>🗂️</span>
              <span>Choose from<br />my uploaded files</span>
            </button>
          </div>

          {/* Upload error */}
          {uploadState.error && (
            <div className={styles.errorList}>
              <p className={styles.errorItem}>⚠ {uploadState.error}</p>
            </div>
          )}

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className={styles.errorList}>
              {validationErrors.map((err, i) => (
                <p key={i} className={styles.errorItem}>⚠ {err}</p>
              ))}
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
            {items.length > 0 && (
              <button className={styles.clearBtn} onClick={clearAll} disabled={uploadState.isUploading}>
                Clear all
              </button>
            )}
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
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as MediaType)}
                  disabled={uploadState.isUploading}
                >
                  {outputFormats.map((f) => (
                    <option key={f} value={f}>{f.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className={styles.summary}>
                <div className={styles.summaryRow}><span>Files</span><strong>{items.length}</strong></div>
                <div className={styles.summaryRow}><span>Total duration</span><strong>{formatDur(totalDuration)}</strong></div>
                <div className={styles.summaryRow}><span>Output type</span><strong>{hasVideo ? 'Video' : 'Audio'}</strong></div>
              </div>
            </div>

            <div className={styles.submitRow}>
              {uploadState.isUploading && (
                <p className={styles.submitHint}>⏳ Waiting for upload to complete…</p>
              )}
              {!uploadState.isUploading && !canSubmit && (
                <p className={styles.submitHint}>Add at least 2 files to merge</p>
              )}
              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                ⚡ Merge {items.length} Files
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
