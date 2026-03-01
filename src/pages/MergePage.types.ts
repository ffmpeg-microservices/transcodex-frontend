export interface MediaItem {
  id: string
  file?: File
  fileName: string
  fileSize: number
  duration: number        // seconds
  isVideo: boolean
  storageId?: string      // set after upload or when picked from server
  url?: string            // local object URL — only for locally uploaded files
  thumbnailUrl?: string   // video thumbnail — only for locally uploaded files
}
