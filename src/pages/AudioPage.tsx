import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dropzone } from '../components/Dropzone'
import { FilePicker } from '../components/FilePicker'
import { useFileUpload } from '../hooks/useFileUpload'
import { useProcess } from '../context/ProcessContext'
import { useToast } from '../components/Toast'
import { toAudio } from '../apis/process.api'
import {
  ApiError,
  AudioCodecType,
  AudioConvertRequest,
  ChannelType,
  MediaType,
  type StoredFile,
} from '../types'
import styles from './ToolPage.module.css'
import { ProcessingBanner } from '../components/ProcessingBanner'

const AUDIO_FORMATS = [MediaType.mp3, MediaType.aac, MediaType.wav, MediaType.flac, MediaType.ogg, MediaType.m4a]
const BITRATES = [64, 96, 128, 192, 256, 320]
const SAMPLE_RATES = [22050, 44100, 48000, 96000]

export default function AudioPage() {
  const { uploadedFile, error, uploading, handleFile, setFromStored, clearFile } = useFileUpload()
  const { addProcess } = useProcess()
  const navigate = useNavigate()
  const toast = useToast()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [toFormat, setToFormat] = useState<string>(MediaType.mp3)
  const [bitrate, setBitrate] = useState(128)
  const [channel, setChannel] = useState<ChannelType>(ChannelType.stereo)
  const [sampleRate, setSampleRate] = useState(44100)
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
    const data: AudioConvertRequest = {
      storageId: uploadedFile.storageId,
      fileName: uploadedFile.fileName,
      duration: uploadedFile.duration,
      toMediaType: toFormat,
      bitrate,
      channelType: channel,
      sampleRate,
    }
    try {
      const newProcess = await toAudio(data)
      addProcess(newProcess.processResponseDto)
      setActiveProcessId(newProcess.processResponseDto.processId)

      toast.success('Conversion started! You can keep working.')
    } catch (err) {
      toast.error((err as ApiError).message)
    }
  }

  return (
    <div className={styles.page}>
      <FilePicker
        open={pickerOpen}
        accept="all"
        onSelect={handleStoredPick}
        onClose={() => setPickerOpen(false)}
      />

      <div className={styles.pageHeader}>
        <span className={styles.pageIcon}>🎵</span>
        <div>
          <h1>Audio Converter</h1>
          <p>Extract audio from video or convert between audio formats</p>
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
          <h2 className={styles.sectionLabel}>1. Upload Media File</h2>
          <Dropzone
            onFile={handleFile}
            onPickFromServer={() => setPickerOpen(true)}
            uploadedFile={uploadedFile}
            onClear={clearFile}
            error={error}
            uploading={uploading}
            accept="video/*,audio/*"
            label="Drop a video or audio file here"
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
                    {AUDIO_FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Bitrate (kbps)</label>
                  <select value={bitrate} onChange={(e) => setBitrate(Number(e.target.value))}>
                    {BITRATES.map((b) => <option key={b} value={b}>{b} kbps</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Channels</label>
                  <select value={channel} onChange={(e) => setChannel(e.target.value as ChannelType)}>
                    <option value={ChannelType.stereo}>Stereo</option>
                    <option value={ChannelType.mono}>Mono</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Sample Rate (Hz)</label>
                  <select value={sampleRate} onChange={(e) => setSampleRate(Number(e.target.value))}>
                    {SAMPLE_RATES.map((r) => <option key={r} value={r}>{r.toLocaleString()} Hz</option>)}
                  </select>
                </div>
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
