import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import type { UploadedFile } from '../types'
import styles from './Dropzone.module.css'

interface DropzoneProps {
  onFile: (file: File) => Promise<void>
  onPickFromServer: () => void        // opens FilePicker
  uploadedFile: UploadedFile | null
  onClear: () => void
  error: string | null
  uploading: { isUploading: boolean; progress: string }
  accept: string
  label?: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Dropzone({
  onFile,
  onPickFromServer,
  uploadedFile,
  onClear,
  error,
  uploading,
  accept,
  label = 'Drag & drop your file here',
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void onFile(file)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void onFile(file)
    e.target.value = ''
  }

  // Uploaded / selected file — show success state
  if (uploadedFile) {
    const isFromServer = !uploadedFile.file  // no File object means it came from server
    return (
      <div className={styles.success}>
        <span className={styles.successIcon}>
          {uploadedFile.isVideo ? '🎬' : '🎵'}
        </span>
        <div className={styles.successInfo}>
          <strong>{uploadedFile.fileName}</strong>
          <div className={styles.successMeta}>
            <span>{formatSize(uploadedFile.fileSize)} · {uploadedFile.duration}</span>
            {isFromServer && (
              <span className={styles.serverBadge}>from your files</span>
            )}
          </div>
        </div>
        <button className={styles.clearBtn} onClick={onClear}>
          ✕ Remove
        </button>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        className={`${styles.zone} ${dragging ? styles.dragging : ''} ${error ? styles.hasError : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className={styles.hiddenInput}
          onChange={handleChange}
        />
        {uploading.isUploading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Uploading… {uploading.progress}</p>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: uploading.progress }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className={styles.zoneIcon}>📂</div>
            <p className={styles.zoneText}>{label}</p>
            <p className={styles.zoneSub}>
              or <span className={styles.zoneLink}>browse files</span>
            </p>
            <p className={styles.zoneLimits}>Max 30 MB · Max 20 minutes</p>
          </>
        )}
      </div>

      {/* Divider */}
      <div className={styles.divider}>
        <span>or</span>
      </div>

      {/* Pick from server */}
      <button
        type="button"
        className={styles.serverPickBtn}
        onClick={onPickFromServer}
        disabled={uploading.isUploading}
      >
        <span className={styles.serverPickIcon}>🗂️</span>
        Choose from my uploaded files
      </button>

      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  )
}
