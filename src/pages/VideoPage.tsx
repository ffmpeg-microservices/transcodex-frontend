import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dropzone } from '../components/Dropzone'
import { FilePicker } from '../components/FilePicker'
import { useFileUpload } from '../hooks/useFileUpload'
import { useProcess } from '../context/ProcessContext'
import { useToast } from '../components/Toast'
import { toVideo } from '../apis/process.api'
import {
  ApiError,
  AudioCodecType,
  EncodingPresetType,
  MediaType,
  ResolutionType,
  VideoCodecType,
  VideoConvertRequest,
  type StoredFile,
} from '../types'
import styles from './ToolPage.module.css'
import { ProcessingBanner } from '../components/ProcessingBanner'

const VIDEO_FORMATS = [MediaType.mp4, MediaType.avi, MediaType.mkv, MediaType.mov, MediaType.wmv, MediaType.flv, MediaType.webm, MediaType.mpeg, MediaType.m4v]
const FRAME_RATES = [24, 25, 30, 48, 60]

export default function VideoPage() {
  const { uploadedFile, error, uploading, handleFile, setFromStored, clearFile } = useFileUpload()
  const { addProcess } = useProcess()
  const navigate = useNavigate()
  const toast = useToast()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [toFormat, setToFormat] = useState<string>(MediaType.mp4)
  const [videoCodec, setVideoCodec] = useState<VideoCodecType>(VideoCodecType.h264)
  const [audioCodec, setAudioCodec] = useState<AudioCodecType>(AudioCodecType.aac)
  const [preset, setPreset] = useState<EncodingPresetType>(EncodingPresetType.medium)
  const [crf, setCrf] = useState(23)
  const [frameRate, setFrameRate] = useState(30)
  const [resolution, setResolution] = useState<ResolutionType>(ResolutionType.source)
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null)

  function handleStoredPick(file: StoredFile) {
    setFromStored(file)
  }
  function handleStartAnother() {

    clearFile()

    setActiveProcessId(null)
  }
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!uploadedFile) return
    const data: VideoConvertRequest = {
      storageId: uploadedFile.storageId,
      fileName: uploadedFile.fileName,
      duration: uploadedFile.duration,
      toMediaType: toFormat,
      videoCodec,
      audioCodec,
      encoderPreset: preset,
      crf,
      frameRate,
      resolution,
    }
    try {
      const newProcess = await toVideo(data)
      addProcess(newProcess.processResponseDto)
      setActiveProcessId(newProcess.processResponseDto.processId)

      toast.success('Conversion started! You can keep working.')
    } catch (err) {
      toast.error((err as ApiError).message)
    }
  }

  const crfLabel = crf <= 18 ? 'High Quality' : crf <= 28 ? 'Balanced' : 'Smaller Size'

  return (
    <div className={styles.page}>
      <FilePicker
        open={pickerOpen}
        accept="video"
        onSelect={handleStoredPick}
        onClose={() => setPickerOpen(false)}
      />

      <div className={styles.pageHeader}>
        <span className={styles.pageIcon}>🎬</span>
        <div>
          <h1>Video Converter</h1>
          <p>Convert video to any format with full codec control</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Live progress banner — shown while job is running, stays above form */}

        {activeProcessId && (

          <ProcessingBanner

            processId={activeProcessId}

            onStartAnother={handleStartAnother}

            anotherLabel="Convert Another"

          />

        )}
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>1. Upload Video File</h2>
          <Dropzone
            onFile={handleFile}
            onPickFromServer={() => setPickerOpen(true)}
            uploadedFile={uploadedFile}
            onClear={clearFile}
            error={error}
            uploading={uploading}
            accept="video/*"
            label="Drop a video file here"
          />
        </section>

        {uploadedFile && (
          <form onSubmit={handleSubmit}>
            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>2. Output Settings</h2>
              <div className={styles.optionsGrid}>
                <div className={styles.field}>
                  <label>Output Format</label>
                  <select value={toFormat} onChange={(e) => setToFormat(e.target.value)}>
                    {VIDEO_FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Video Codec</label>
                  <select value={videoCodec} onChange={(e) => setVideoCodec(e.target.value as VideoCodecType)}>
                    {Object.values(VideoCodecType).map((c) => (
                      <option key={c} value={c}>{c === VideoCodecType.source ? 'Source (copy)' : c.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Audio Codec</label>
                  <select value={audioCodec} onChange={(e) => setAudioCodec(e.target.value as AudioCodecType)}>
                    {Object.values(AudioCodecType).map((c) => (
                      <option key={c} value={c}>{c === AudioCodecType.source ? 'Source (copy)' : c.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Resolution</label>
                  <select value={resolution} onChange={(e) => setResolution(e.target.value as ResolutionType)}>
                    {Object.values(ResolutionType).map((r) => (
                      <option key={r} value={r}>{r === ResolutionType.source ? 'Source' : r.replace('p', '') + 'p'}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Encoding Preset</label>
                  <select value={preset} onChange={(e) => setPreset(e.target.value as EncodingPresetType)}>
                    {Object.values(EncodingPresetType).map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Frame Rate (fps)</label>
                  <select value={frameRate} onChange={(e) => setFrameRate(Number(e.target.value))}>
                    {FRAME_RATES.map((f) => <option key={f} value={f}>{f} fps</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.crfSection}>
                <label>Quality (CRF): <strong>{crf}</strong><span className={styles.crfHint}>{crfLabel}</span></label>
                <input type="range" min={0} max={51} value={crf} onChange={(e) => setCrf(Number(e.target.value))} className={styles.rangeSlider} />
                <div className={styles.rangeLabels}><span>Best Quality</span><span>Smallest Size</span></div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>3. Submit</h2>
              <div className={styles.summary}>
                <span className={styles.summaryInput}>{uploadedFile.fileName}</span>
                <span className={styles.summaryArrow}>→</span>
                <span className={styles.summaryOutput}>{uploadedFile.fileName.replace(/\.[^.]+$/, '')}.{toFormat}</span>
              </div>
              <button type="submit" className={styles.submitBtn}>⚡ Start Conversion</button>
            </section>
          </form>
        )}
      </div>
    </div>
  )
}
