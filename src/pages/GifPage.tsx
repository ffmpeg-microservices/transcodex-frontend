import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dropzone } from '../components/Dropzone'
import { useFileUpload } from '../hooks/useFileUpload'
import { useProcess } from '../context/ProcessContext'
import { useToast } from '../components/Toast'
import { toGif } from '../apis/process.api'
import { ApiError, GifConvertRequest, ResolutionType, type StoredFile } from '../types'
import styles from './ToolPage.module.css'
import gifStyles from './GifPage.module.css'
import { FilePicker } from '../components/FilePicker'
import { ProcessingBanner } from '../components/ProcessingBanner'

const FPS_OPTIONS = [10, 15, 20, 24, 30]
const GIF_RESOLUTIONS = [ResolutionType.p144, ResolutionType.p240, ResolutionType.p360, ResolutionType.p480, ResolutionType.p720]

export default function GifPage() {
  const { uploadedFile, error, uploading, handleFile, setFromStored, clearFile } = useFileUpload()
  const { addProcess } = useProcess()
  const navigate = useNavigate()
  const toast = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [clipDuration, setClipDuration] = useState(3)
  const [fps, setFps] = useState(15)
  const [resolution, setResolution] = useState<ResolutionType>(ResolutionType.p480)
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null)


  useEffect(() => {
    if (!uploadedFile || !videoRef.current) return
    const video = videoRef.current
    const onMeta = () => {
      const dur = video.duration
      setVideoDuration(dur)
      setStartTime(0)
      setClipDuration(Math.min(3, dur))
    }
    video.addEventListener('loadedmetadata', onMeta)
    return () => video.removeEventListener('loadedmetadata', onMeta)
  }, [uploadedFile])

  function handleStoredPick(file: StoredFile) {
    setFromStored(file)
  }
  function handleStartAnother() {

    clearFile()

    setActiveProcessId(null)
  }

  function handleStartChange(val: number) {
    setStartTime(val)
    if (videoRef.current) videoRef.current.currentTime = val
    const maxClip = Math.min(10, videoDuration - val)
    if (clipDuration > maxClip) setClipDuration(Math.max(1, maxClip))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!uploadedFile) return
    const data: GifConvertRequest = {
      storageId: uploadedFile.storageId,
      fileName: uploadedFile.fileName,
      duration: uploadedFile.duration,
      toMediaType: 'gif',
      startTimeSeconds: startTime,
      durationSeconds: clipDuration,
      fps,
      resolution,
    }
    try {
      const newProcess = await toGif(data)
      addProcess(newProcess.processResponseDto)
      setActiveProcessId(newProcess.processResponseDto.processId)

      toast.success('Conversion started! You can keep working.')
    } catch (err) {
      toast.error((err as ApiError).message)
    }
  }

  const maxStart = Math.max(0, videoDuration - 1)
  const maxClip = Math.min(10, videoDuration - startTime)

  return (
    <div className={styles.page}>
      <FilePicker
        open={pickerOpen}
        accept="video"
        onSelect={handleStoredPick}
        onClose={() => setPickerOpen(false)}
      />

      <div className={styles.pageHeader}>
        <span className={styles.pageIcon}>🖼️</span>
        <div>
          <h1>GIF Maker</h1>
          <p>Turn any video clip into a crisp animated GIF (1–10 seconds)</p>
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
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>2. Preview &amp; Trim</h2>
              {uploadedFile.url ? (
                <>
                  <div className={gifStyles.videoWrap}>
                    <video ref={videoRef} src={uploadedFile.url} controls className={gifStyles.video} />
                  </div>
                  <div className={gifStyles.trimPanel}>
                    <div className={gifStyles.trimRow}>
                      <div className={styles.field}>
                        <label>Start Time: <strong>{startTime.toFixed(1)}s</strong></label>
                        <input type="range" min={0} max={maxStart} step={0.1} value={startTime}
                          onChange={(e) => handleStartChange(Number(e.target.value))} className={styles.rangeSlider} />
                      </div>
                      <div className={styles.field}>
                        <label>Duration: <strong>{clipDuration.toFixed(1)}s</strong><span className={styles.crfHint}>(1–10s)</span></label>
                        <input type="range" min={1} max={maxClip} step={0.1} value={clipDuration}
                          onChange={(e) => setClipDuration(Number(e.target.value))} className={styles.rangeSlider} />
                      </div>
                    </div>
                    <p className={gifStyles.trimInfo}>
                      Clip: <strong>{startTime.toFixed(1)}s → {(startTime + clipDuration).toFixed(1)}s</strong> ({clipDuration.toFixed(1)}s)
                    </p>
                  </div>
                </>
              ) : (
                // Server-selected file — no local URL for preview, show manual input
                <div className={gifStyles.trimPanel}>
                  <p className={gifStyles.noPreviewNote}>
                    ℹ Preview not available for server files. Set trim points manually.
                  </p>
                  <div className={gifStyles.trimRow}>
                    <div className={styles.field}>
                      <label>Start Time (seconds)</label>
                      <input type="number" min={0} step={0.1} value={startTime}
                        onChange={(e) => setStartTime(Number(e.target.value))}
                        className={gifStyles.numberInput} />
                    </div>
                    <div className={styles.field}>
                      <label>Duration (1–10 seconds)</label>
                      <input type="number" min={1} max={10} step={0.1} value={clipDuration}
                        onChange={(e) => setClipDuration(Math.min(10, Math.max(1, Number(e.target.value))))}
                        className={gifStyles.numberInput} />
                    </div>
                  </div>
                </div>
              )}
            </section>

            <form onSubmit={handleSubmit}>
              <section className={styles.section}>
                <h2 className={styles.sectionLabel}>3. GIF Settings</h2>
                <div className={styles.optionsGrid}>
                  <div className={styles.field}>
                    <label>Frame Rate (fps)</label>
                    <select value={fps} onChange={(e) => setFps(Number(e.target.value))}>
                      {FPS_OPTIONS.map((f) => <option key={f} value={f}>{f} fps</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Resolution</label>
                    <select value={resolution} onChange={(e) => setResolution(e.target.value as ResolutionType)}>
                      {GIF_RESOLUTIONS.map((r) => <option key={r} value={r}>{r.replace('p', '')}p</option>)}
                    </select>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionLabel}>4. Submit</h2>
                <div className={styles.summary}>
                  <span className={styles.summaryInput}>{uploadedFile.fileName}</span>
                  <span className={styles.summaryArrow}>→</span>
                  <span className={styles.summaryOutput}>{uploadedFile.fileName.replace(/\.[^.]+$/, '')}.gif</span>
                </div>
                <p className={gifStyles.gifSpecs}>{clipDuration.toFixed(1)}s · {fps} fps · {resolution.replace('p', '')}p</p>
                <button type="submit" className={styles.submitBtn}>⚡ Create GIF</button>
              </section>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
