import { useState, useCallback } from 'react'
import type { StoredFile } from '../types'
import { getStoredFiles } from '../apis/storage.api'

export interface UseStoredFilesReturn {
  files: StoredFile[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  reset: () => void
}

export function useStoredFiles(): UseStoredFilesReturn {
  const [files, setFiles] = useState<StoredFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getStoredFiles()
      setFiles(data)
    } catch {
      setError('Failed to load your files. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setFiles([])
    setError(null)
  }, [])

  return { files, loading, error, fetch, reset }
}
