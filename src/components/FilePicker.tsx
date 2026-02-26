import {
  useEffect,
  useState,
  useCallback,
  type KeyboardEvent,
} from 'react'

import styles from './FilePicker.module.css'
import { useStoredFiles } from '../hooks/useStoredFiles'
import { StoredFile } from '../types'

// ─── Helpers ────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Types ───────────────────────────────────────────────────

type FilterType = 'all' | 'video' | 'audio'

interface FilePickerSingleProps {
  open: boolean
  multi?: false
  accept?: 'video' | 'audio' | 'all'
  onSelect: (file: StoredFile) => void
  onClose: () => void
}

interface FilePickerMultiProps {
  open: boolean
  multi: true
  accept?: 'video' | 'audio' | 'all'
  onSelect: (files: StoredFile[]) => void
  onClose: () => void
}

type FilePickerProps = FilePickerSingleProps | FilePickerMultiProps

// ─── Component ───────────────────────────────────────────────

export function FilePicker(props: FilePickerProps) {
  const { open, onClose, accept = 'all' } = props
  const { files, loading, error, fetch, reset } = useStoredFiles()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>(
    accept === 'all' ? 'all' : accept,
  )
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Fetch when opened
  useEffect(() => {
    if (open) {
      void fetch()
      setSearch('')
      setSelected(new Set())
      setFilter(accept === 'all' ? 'all' : accept)
    } else {
      reset()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const filtered = files.filter((f) => {
    const matchesType =
      filter === 'all' ||
      (filter === 'video' && f.isVideo) ||
      (filter === 'audio' && !f.isVideo)
    const matchesSearch = f.fileName
      .toLowerCase()
      .includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  const toggleSelected = useCallback((storageId: string) => {
    if (!props.multi) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(storageId) ? next.delete(storageId) : next.add(storageId)
      return next
    })
  }, [props.multi])

  function handleRowClick(file: StoredFile) {
    if (props.multi) {
      toggleSelected(file.storageId)
    } else {
      props.onSelect(file)
      onClose()
    }
  }

  function handleConfirm() {
    if (!props.multi) return
    const picked = files.filter((f) => selected.has(f.storageId))
    if (picked.length === 0) return
    props.onSelect(picked)
    onClose()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>, file: StoredFile) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRowClick(file)
    }
  }

  if (!open) return null

  return (
    // Backdrop
    <div className={styles.backdrop} onClick={onClose}>
      {/* Modal — stop propagation so clicks inside don't close */}
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose from your files"
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>My Uploaded Files</h2>
            <p className={styles.subtitle}>
              {props.multi
                ? 'Select one or more files to add'
                : 'Click a file to select it'}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <input
            className={styles.search}
            type="text"
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className={styles.filters}>
            {(['all', 'video', 'audio'] as FilterType[]).map((t) => {
              // Hide tabs that don't apply to the accepted type
              if (accept !== 'all' && t !== 'all' && t !== accept) return null
              return (
                <button
                  key={t}
                  className={`${styles.filterBtn} ${filter === t ? styles.filterActive : ''}`}
                  onClick={() => setFilter(t)}
                >
                  {t === 'all' ? 'All' : t === 'video' ? '🎬 Video' : '🎵 Audio'}
                </button>
              )
            })}
          </div>
        </div>

        {/* File list */}
        <div className={styles.listWrap}>
          {loading && (
            <div className={styles.state}>
              <div className={styles.spinner} />
              <p>Loading your files…</p>
            </div>
          )}

          {!loading && error && (
            <div className={styles.state}>
              <p className={styles.errorText}>{error}</p>
              <button className={styles.retryBtn} onClick={() => void fetch()}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className={styles.state}>
              <p className={styles.emptyText}>
                {search ? 'No files match your search.' : 'No files uploaded yet.'}
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className={styles.list}>
              {filtered.map((file) => {
                const isSelected = selected.has(file.storageId)
                return (
                  <div
                    key={file.storageId}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
                    onClick={() => handleRowClick(file)}
                    onKeyDown={(e) => handleKeyDown(e, file)}
                  >
                    {/* Checkbox for multi mode */}
                    {props.multi && (
                      <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
                        {isSelected && <span>✓</span>}
                      </div>
                    )}

                    {/* Icon */}
                    <span className={styles.rowIcon}>
                      {file.isVideo ? '🎬' : '🎵'}
                    </span>

                    {/* Info */}
                    <div className={styles.rowInfo}>
                      <strong className={styles.rowName}>{file.fileName}</strong>
                      <div className={styles.rowMeta}>
                        <span className={styles.badge}>
                          {file.fileType.toUpperCase()}
                        </span>
                        <span>{file.duration}</span>
                        <span>{formatSize(file.fileSize)}</span>
                        <span>{formatDate(file.uploadedDate)}</span>
                      </div>
                    </div>

                    {/* Arrow for single select */}
                    {!props.multi && (
                      <span className={styles.rowArrow}>→</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer — only in multi mode */}
        {props.multi && (
          <div className={styles.footer}>
            <span className={styles.footerCount}>
              {selected.size > 0
                ? `${selected.size} file${selected.size !== 1 ? 's' : ''} selected`
                : 'No files selected'}
            </span>
            <div className={styles.footerActions}>
              <button className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={selected.size === 0}
              >
                Add {selected.size > 0 ? `${selected.size} ` : ''}File{selected.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
