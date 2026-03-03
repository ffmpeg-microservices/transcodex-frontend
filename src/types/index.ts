// ─── Enums ─────────────────────────────────────────────────────────────────

export enum AudioCodecType {
  source = 'source',
  aac = 'aac',
  ac3 = 'ac3',
  flac = 'flac',
  dts = 'dts',
  opus = 'opus',
}

export enum ChannelType {
  mono = 'mono',
  stereo = 'stereo',
}

export enum EncodingPresetType {
  ultrafast = 'ultrafast',
  fast = 'fast',
  medium = 'medium',
  slow = 'slow',
  veryslow = 'veryslow',
}

export enum MediaType {
  mp3 = 'mp3',
  aac = 'aac',
  wav = 'wav',
  flac = 'flac',
  ogg = 'ogg',
  m4a = 'm4a',
  mp4 = 'mp4',
  avi = 'avi',
  mkv = 'mkv',
  mov = 'mov',
  wmv = 'wmv',
  flv = 'flv',
  webm = 'webm',
  mpeg = 'mpeg',
  mpg = 'mpg',
  m4v = 'm4v',
  gif = 'gif',
}

export enum ResolutionType {
  source = 'source',
  p144 = 'p144',
  p240 = 'p240',
  p360 = 'p360',
  p480 = 'p480',
  p720 = 'p720',
  p1080 = 'p1080',
  p1440 = 'p1440',
  p2160 = 'p2160',
}

export enum VideoCodecType {
  source = 'source',
  h264 = 'h264',
  h265 = 'h265',
  vp9 = 'vp9',
  av1 = 'av1',
}

export enum ProcessStatus {
  WAITING = 'WAITING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// ─── Request DTOs ───────────────────────────────────────────────────────────

export interface AudioConvertRequest {
  storageId: string;
  fileName: string;
  duration: string;
  toMediaType: string;
  bitrate: number;
  channelType: ChannelType;
  sampleRate: number;
}

export interface VideoConvertRequest {
  storageId: string;
  fileName: string;
  duration: string;
  toMediaType: string;
  videoCodec: VideoCodecType;
  audioCodec: AudioCodecType;
  encoderPreset: EncodingPresetType;
  crf: number;
  frameRate: number;
  resolution: ResolutionType;
}

export interface GifConvertRequest {
  storageId: string;
  fileName: string;
  duration: string;
  toMediaType: 'gif';
  startTimeSeconds: number;
  durationSeconds: number;
  fps: number;
  resolution: ResolutionType;
}

// public record OrderedMedia(
//   String storageId,
//   String type // "video" or "audio"
// ) {
// }

export interface OrderedMedia {
  storageId: string;
  type: 'video' | 'audio';
}

export interface MergeRequest {

  // List<OrderedMedia> mediaFiles,
  //       String duration,
  // String toMediaType,
  //   String videoCodec,
  //     String audioCodec,
  //       int resolutionHeight


  mediaFiles: OrderedMedia[];
  duration: string;
  toMediaType: MediaType;
  videoCodec?: VideoCodecType;
  audioCodec?: AudioCodecType;
  resolutionHeight: number;
}

// ─── Response DTOs ──────────────────────────────────────────────────────────

export interface ProcessDto {
  fileName: string;
  duration: string;
  finalFileSize: string;
  isVideo: boolean;
  processId: string;
  storageIdOutput: string;
  status: ProcessStatus;
  createdAt: string;
}

export interface ProcessResponse {
  message: string;
  processResponseDto: ProcessDto;
  queue: number;
}

// ─── App-level types ────────────────────────────────────────────────────────

export interface User {
  uuid: string;
  email: string;
  fullname: string;
  created_at: Date;
}

export interface LoginResponse {
  user: User;
  jwt: string;
  user_id: string;
}

export interface UploadedFile {
  storageId: string;
  fileName: string;
  duration: string;
  fileSize: number;
  isVideo: boolean;
  file?: File;
  url?: string;
}

export interface StoredUser {
  fullName: string;
  email: string;
  username: string;
  password: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    error: string,
  ) {
    super(error)
  }
}

export type AuthResult =
  | { success: true }
  | { success: false; message: string }

export interface StoredFile {
  storageId: string
  userId: string
  path: string
  fileName: string
  mediaType: string      // "video", "audio", etc.
  fileSize: number      // bytes
  duration: string      // "2:34"
  fileType: string      // "mp4", "mp3", etc.
  uploadedDate: string  // ISO string
}