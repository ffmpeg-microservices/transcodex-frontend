import { useState, useCallback } from 'react'
import { ApiError, type StoredFile, type UploadedFile } from '../types'
import { upload } from '../apis/storage.api'

const MAX_SIZE_MB = 30
const MAX_DURATION_MIN = 20

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const isVideo = file.type.startsWith('video')
    const el: HTMLVideoElement | HTMLAudioElement = isVideo
      ? document.createElement('video')
      : document.createElement('audio')

    el.preload = 'metadata'
    const url = URL.createObjectURL(file)
    el.src = url

    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(el.duration)
    }
    el.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Cannot read media duration'))
    }
  })
}

export interface UseFileUploadReturn {
  uploadedFile: UploadedFile | null
  error: string | null
  uploading: { isUploading: boolean; progress: string }
  handleFile: (file: File) => Promise<void>
  setFromStored: (stored: StoredFile) => void
  clearFile: () => void
}

export function useFileUpload(): UseFileUploadReturn {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState({ isUploading: false, progress: '0%' })

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setUploading({ isUploading: true, progress: '0%' })

    try {
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > MAX_SIZE_MB) {
        setError(`File too large: ${sizeMB.toFixed(1)} MB. Maximum allowed is ${MAX_SIZE_MB} MB.`)
        return
      }

      let durationSec = 0
      try {
        durationSec = await getMediaDuration(file)
        const durationMin = durationSec / 60
        if (durationMin > MAX_DURATION_MIN) {
          setError(`Media too long: ${durationMin.toFixed(1)} min. Maximum allowed is ${MAX_DURATION_MIN} min.`)
          return
        }
      } catch {
        // If duration can't be read, allow upload and skip duration check
      }

      const data = new FormData()
      data.append('file', file)

      const storageId = await upload(data, (progress) => {
        setUploading({ isUploading: true, progress })
      })

      const url = URL.createObjectURL(file)
      setUploadedFile({
        storageId,
        fileName: file.name,
        duration: durationSec ? formatDuration(durationSec) : '0:00',
        fileSize: file.size,
        isVideo: file.type.startsWith('video'),
        file,
        url,
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('An unknown error occurred during upload.')
      }
    } finally {
      setUploading({ isUploading: false, progress: '0%' })
    }
  }, [])

  // Select a file already on the server — no upload needed
  const setFromStored = useCallback((stored: StoredFile) => {
    setError(null)
    setUploadedFile({
      storageId: stored.storageId,
      fileName: stored.fileName,
      duration: stored.duration,
      fileSize: stored.fileSize,
      isVideo: stored.isVideo,
    })
  }, [])

  const clearFile = useCallback(() => {
    setUploadedFile(null)
    setError(null)
  }, [])

  return { uploadedFile, error, uploading, handleFile, setFromStored, clearFile }
}
