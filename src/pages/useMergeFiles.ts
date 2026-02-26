import { useState, useCallback, useRef } from 'react'
import type { MediaItem } from './MergePage.types'

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
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(isFinite(el.duration) ? el.duration : 0)
    }
    el.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(0)
    }
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
    video.onloadeddata = () => {
      video.currentTime = 0.5
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 160
      canvas.height = 90
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, 160, 90)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      } else {
        URL.revokeObjectURL(url)
        resolve(undefined)
      }
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(undefined)
    }
  })
}

export interface UseMergeFilesReturn {
  items: MediaItem[]
  errors: string[]
  addFiles: (files: FileList | File[]) => Promise<void>
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
  const [errors, setErrors] = useState<string[]>([])
  const processingRef = useRef(false)

  const addFiles = useCallback(async (files: FileList | File[]) => {
    if (processingRef.current) return
    processingRef.current = true
    const fileArray = Array.from(files)
    const newErrors: string[] = []

    setItems((prev) => {
      const remaining = MAX_FILES - prev.length
      if (remaining <= 0) {
        newErrors.push(`Maximum ${MAX_FILES} files allowed.`)
      }
      return prev
    })

    const currentCount = items.length
    const allowedCount = MAX_FILES - currentCount

    if (allowedCount <= 0) {
      setErrors([`Maximum ${MAX_FILES} files allowed.`])
      processingRef.current = false
      return
    }

    const toProcess = fileArray.slice(0, allowedCount)
    const skipped = fileArray.length - toProcess.length

    const newItems: MediaItem[] = []

    for (const file of toProcess) {
      // Type check
      if (!file.type.startsWith('video') && !file.type.startsWith('audio')) {
        newErrors.push(`"${file.name}" is not a supported media file.`)
        continue
      }
      // Size check
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > MAX_SIZE_MB) {
        newErrors.push(
          `"${file.name}" exceeds ${MAX_SIZE_MB} MB (${sizeMB.toFixed(1)} MB).`,
        )
        continue
      }

      const duration = await getMediaDuration(file)
      const thumbnailUrl = await getVideoThumbnail(file)
      const url = URL.createObjectURL(file)

      newItems.push({
        id: generateId(),
        file,
        fileName: file.name,
        fileSize: file.size,
        duration,
        isVideo: file.type.startsWith('video'),
        url,
        thumbnailUrl,
      })
    }

    if (skipped > 0) {
      newErrors.push(
        `${skipped} file(s) skipped — maximum ${MAX_FILES} files allowed.`,
      )
    }

    setErrors(newErrors)
    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems])
    }
    processingRef.current = false
  }, [items.length])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.url)
      return prev.filter((i) => i.id !== id)
    })
    setErrors([])
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
    setItems((prev) => {
      prev.forEach((i) => URL.revokeObjectURL(i.url))
      return []
    })
    setErrors([])
  }, [])

  const totalDuration = items.reduce((acc, i) => acc + i.duration, 0)
  const hasVideo = items.some((i) => i.isVideo)
  const hasAudio = items.some((i) => !i.isVideo)
  const mixed = hasVideo && hasAudio

  return {
    items,
    errors,
    addFiles,
    removeItem,
    reorder,
    clearAll,
    totalDuration,
    hasVideo,
    hasAudio,
    mixed,
  }
}
