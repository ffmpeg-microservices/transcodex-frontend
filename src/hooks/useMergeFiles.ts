import { useState, useCallback, useRef } from 'react'
import type { MediaItem } from './MergePage.types'
import type { StoredFile } from '../types'
import { uploadMultiple } from '../apis/storage.api'
import { ApiError } from '../types'

const MAX_FILES = 10
const MAX_SIZE_MB = 20

function generateId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const isVideo = file.type.startsWith('video')
    const el: HTMLVideoElement | HTMLAudioElement = isVideo
      ? document.createElement('video')
      : document.createElement('audio')
    el.preload = 'metadata'
    const url = URL.createObjectURL(file)
    el.src = url
    el.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(isFinite(el.duration) ? el.duration : 0) }
    el.onerror = () => { URL.revokeObjectURL(url); resolve(0) }
  })
}

function getVideoThumbnail(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('video')) { resolve(undefined); return }
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    const url = URL.createObjectURL(file)
    video.src = url
    video.onloadeddata = () => { video.currentTime = 0.5 }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 160; canvas.height = 90
      const ctx = canvas.getContext('2d')
      if (ctx) { ctx.drawImage(video, 0, 0, 160, 90); URL.revokeObjectURL(url); resolve(canvas.toDataURL('image/jpeg', 0.7)) }
      else { URL.revokeObjectURL(url); resolve(undefined) }
    }
    video.onerror = () => { URL.revokeObjectURL(url); resolve(undefined) }
  })
}

function parseDuration(dur: string): number {
  const parts = dur.split(':').map(Number)
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)
  return 0
}

// ─── Upload state ─────────────────────────────────────────────

export interface UploadState {
  isUploading: boolean
  progress: number          // 0–100
  fileCount: number         // how many files are being uploaded
  error: string | null
}

const IDLE_UPLOAD: UploadState = {
  isUploading: false,
  progress: 0,
  fileCount: 0,
  error: null,
}

// ─── Hook ─────────────────────────────────────────────────────

export interface UseMergeFilesReturn {
  items: MediaItem[]
  validationErrors: string[]
  uploadState: UploadState
  addFiles: (files: FileList | File[]) => Promise<void>
  addFromStored: (storedFiles: StoredFile[]) => void
  removeItem: (id: string) => void
  reorder: (fromIndex: number, toIndex: number) => void
  clearAll: () => void
  totalDuration: number
  hasVideo: boolean
  hasAudio: boolean
  mixed: boolean
}

export function useMergeFiles(): UseMergeFilesReturn {
  const [items, setItems] = useState<MediaItem[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [uploadState, setUploadState] = useState<UploadState>(IDLE_UPLOAD)
  const processingRef = useRef(false)

  const addFiles = useCallback(async (files: FileList | File[]) => {
    if (processingRef.current) return
    processingRef.current = true

    const fileArray = Array.from(files)
    const newErrors: string[] = []

    // ── Step 1: client-side validation ──────────────────────
    const currentCount = items.length
    const allowedCount = MAX_FILES - currentCount

    if (allowedCount <= 0) {
      setValidationErrors([`Maximum ${MAX_FILES} files allowed.`])
      processingRef.current = false
      return
    }

    const toProcess = fileArray.slice(0, allowedCount)
    if (fileArray.length > allowedCount) {
      newErrors.push(`${fileArray.length - allowedCount} file(s) skipped — maximum ${MAX_FILES} files allowed.`)
    }

    // Validate each file — collect valid ones and their metadata
    interface PendingItem {
      file: File
      duration: number
      thumbnailUrl: string | undefined
      url: string
    }
    const valid: PendingItem[] = []

    for (const file of toProcess) {
      if (!file.type.startsWith('video') && !file.type.startsWith('audio')) {
        newErrors.push(`"${file.name}" is not a supported media file.`)
        continue
      }
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > MAX_SIZE_MB) {
        newErrors.push(`"${file.name}" exceeds ${MAX_SIZE_MB} MB (${sizeMB.toFixed(1)} MB).`)
        continue
      }
      const duration = await getMediaDuration(file)
      const thumbnailUrl = await getVideoThumbnail(file)
      const url = URL.createObjectURL(file)
      valid.push({ file, duration, thumbnailUrl, url })
    }

    setValidationErrors(newErrors)

    if (valid.length === 0) {
      processingRef.current = false
      return
    }

    // ── Step 2: batch upload all valid files ─────────────────
    setUploadState({
      isUploading: true,
      progress: 0,
      fileCount: valid.length,
      error: null,
    })

    try {
      const storageIds = await uploadMultiple(
        valid.map((v) => v.file),
        (progress) => {
          const pct = parseInt(progress, 10)
          setUploadState((prev) => ({ ...prev, progress: isNaN(pct) ? 0 : pct }))
        },
      )

      // ── Step 3: build MediaItems with real storageIds ──────
      const newItems: MediaItem[] = valid.map((v, i) => ({
        id: storageIds[i] ?? generateId(),   // use storageId as stable id
        file: v.file,
        fileName: v.file.name,
        fileSize: v.file.size,
        duration: v.duration,
        isVideo: v.file.type.startsWith('video'),
        url: v.url,
        thumbnailUrl: v.thumbnailUrl,
        storageId: storageIds[i],            // real storageId from server
      }))

      setItems((prev) => [...prev, ...newItems])
      setUploadState(IDLE_UPLOAD)
    } catch (err) {
      // Clean up object URLs on failure
      valid.forEach((v) => URL.revokeObjectURL(v.url))

      const message = err instanceof ApiError
        ? err.message
        : 'Upload failed. Please try again.'

      setUploadState({
        isUploading: false,
        progress: 0,
        fileCount: 0,
        error: message,
      })
    } finally {
      processingRef.current = false
    }
  }, [items.length])

  // Server-picked files — no upload needed, storageId already known
  const addFromStored = useCallback((storedFiles: StoredFile[]) => {
    setValidationErrors([])
    setItems((prev) => {
      const remaining = MAX_FILES - prev.length
      if (remaining <= 0) {
        setValidationErrors([`Maximum ${MAX_FILES} files already reached.`])
        return prev
      }
      const toAdd = storedFiles.slice(0, remaining)
      if (storedFiles.length > remaining) {
        setValidationErrors([`${storedFiles.length - remaining} file(s) skipped — maximum ${MAX_FILES} files allowed.`])
      }

      const existingIds = new Set(prev.map((i) => i.id))
      const newItems: MediaItem[] = toAdd
        .filter((sf) => !existingIds.has(sf.storageId))
        .map((sf) => ({
          id: sf.storageId,
          fileName: sf.fileName,
          fileSize: sf.fileSize,
          duration: parseDuration(sf.duration),
          isVideo: sf.isVideo,
          storageId: sf.storageId,
        }))

      return [...prev, ...newItems]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item?.url) URL.revokeObjectURL(item.url)
      return prev.filter((i) => i.id !== id)
    })
    setValidationErrors([])
  }, [])

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setItems((prev) => { prev.forEach((i) => { if (i.url) URL.revokeObjectURL(i.url) }); return [] })
    setValidationErrors([])
    setUploadState(IDLE_UPLOAD)
  }, [])

  const totalDuration = items.reduce((acc, i) => acc + i.duration, 0)
  const hasVideo = items.some((i) => i.isVideo)
  const hasAudio = items.some((i) => !i.isVideo)
  const mixed = hasVideo && hasAudio

  return {
    items,
    validationErrors,
    uploadState,
    addFiles,
    addFromStored,
    removeItem,
    reorder,
    clearAll,
    totalDuration,
    hasVideo,
    hasAudio,
    mixed,
  }
}
