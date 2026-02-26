export interface MediaItem {
  id: string
  file: File
  fileName: string
  fileSize: number
  duration: number      // seconds
  isVideo: boolean
  url: string           // object URL
  thumbnailUrl?: string // for video thumbnail
}
