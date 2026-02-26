import { useRef, useState, useEffect, useCallback } from 'react'
import type { MediaItem } from './MergePage.types'
import styles from './MergePreview.module.css'

interface MergePreviewProps {
  items: MediaItem[]
  activeId: string | null
  onActiveChange: (id: string) => void
  totalDuration: number
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function MergePreview({
  items,
  activeId,
  onActiveChange,
  totalDuration,
}: MergePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0) // total elapsed across all items
  const elapsedBeforeCurrentRef = useRef(0)
  const tickRef = useRef<number | null>(null)

  const currentItem = items[currentIndex] ?? null

  // Compute elapsed-before for each item
  const elapsedBefore = items.reduce<number[]>((acc, item, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + items[i - 1].duration)
    return acc
  }, [])

  // Stop everything
  const stopAll = useCallback(() => {
    if (tickRef.current) cancelAnimationFrame(tickRef.current)
    videoRef.current?.pause()
    audioRef.current?.pause()
    setPlaying(false)
  }, [])

  // Play item at index from beginning
  const playIndex = useCallback(
    (index: number) => {
      if (index >= items.length) {
        stopAll()
        setCurrentIndex(0)
        setElapsed(0)
        elapsedBeforeCurrentRef.current = 0
        return
      }
      const item = items[index]
      setCurrentIndex(index)
      onActiveChange(item.id)
      elapsedBeforeCurrentRef.current = elapsedBefore[index]

      const el = item.isVideo ? videoRef.current : audioRef.current
      if (!el) return
      el.src = item.url
      el.currentTime = 0

      const playPromise = el.play()
      if (playPromise) {
        playPromise.catch(() => { /* autoplay blocked */ })
      }

      el.onended = () => {
        playIndex(index + 1)
      }
    },
    [items, elapsedBefore, onActiveChange, stopAll],
  )

  // Tick to update elapsed
  useEffect(() => {
    if (!playing) return
    function tick() {
      const el = currentItem?.isVideo ? videoRef.current : audioRef.current
      if (el) {
        setElapsed(elapsedBeforeCurrentRef.current + el.currentTime)
      }
      tickRef.current = requestAnimationFrame(tick)
    }
    tickRef.current = requestAnimationFrame(tick)
    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current)
    }
  }, [playing, currentItem])

  // When items change, reset
  useEffect(() => {
    stopAll()
    setCurrentIndex(0)
    setElapsed(0)
    elapsedBeforeCurrentRef.current = 0
  }, [items, stopAll])

  // Jump to a specific item when selected externally
  useEffect(() => {
    if (!activeId || !playing) return
    const idx = items.findIndex((i) => i.id === activeId)
    if (idx !== -1 && idx !== currentIndex) {
      videoRef.current?.pause()
      audioRef.current?.pause()
      playIndex(idx)
    }
  }, [activeId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePlayPause() {
    if (items.length === 0) return
    if (playing) {
      stopAll()
      // pause current element but keep position
      const el = currentItem?.isVideo ? videoRef.current : audioRef.current
      el?.pause()
    } else {
      setPlaying(true)
      const el = currentItem?.isVideo ? videoRef.current : audioRef.current
      if (el && el.src) {
        void el.play()
      } else {
        playIndex(currentIndex)
      }
    }
  }

  function handleRestart() {
    stopAll()
    setElapsed(0)
    setCurrentIndex(0)
    elapsedBeforeCurrentRef.current = 0
    setTimeout(() => {
      setPlaying(true)
      playIndex(0)
    }, 50)
  }

  const progressPct = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0
  const showVideo = currentItem?.isVideo ?? (items.some(i => i.isVideo))

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Add files to preview the merged output</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {/* Video/Audio display */}
      <div className={styles.screen}>
        <video
          ref={videoRef}
          className={styles.video}
          style={{ display: showVideo && currentItem?.isVideo ? 'block' : 'none' }}
          playsInline
        />
        <audio ref={audioRef} style={{ display: 'none' }} />

        {/* Placeholder when video not playing */}
        {(!currentItem?.isVideo) && (
          <div className={styles.audioDisplay}>
            <div className={styles.audioVisual}>
              {playing ? (
                <div className={styles.waveform}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className={styles.waveBar}
                      style={{ animationDelay: `${i * 0.06}s` }}
                    />
                  ))}
                </div>
              ) : (
                <span className={styles.audioIcon}>🎵</span>
              )}
            </div>
            <p className={styles.audioName}>{currentItem?.fileName ?? 'Ready to preview'}</p>
          </div>
        )}

        {/* Overlay info */}
        {currentItem && (
          <div className={styles.overlay}>
            <span className={styles.nowPlaying}>
              {currentIndex + 1}/{items.length} · {currentItem.fileName}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className={styles.progressWrap}>
        <div
          className={styles.progressBar}
          style={{ width: `${progressPct}%` }}
        />
        {/* Item boundary markers */}
        {elapsedBefore.slice(1).map((eb, i) => (
          <div
            key={i}
            className={styles.marker}
            style={{ left: `${(eb / totalDuration) * 100}%` }}
          />
        ))}
      </div>
      <div className={styles.timeRow}>
        <span>{formatTime(elapsed)}</span>
        <span>{formatTime(totalDuration)}</span>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button className={styles.restartBtn} onClick={handleRestart} title="Restart">
          ↺
        </button>
        <button className={styles.playBtn} onClick={handlePlayPause}>
          {playing ? '⏸ Pause' : '▶ Play Preview'}
        </button>
        <div className={styles.trackLabel}>
          {items.length} file{items.length !== 1 ? 's' : ''} · {formatTime(totalDuration)}
        </div>
      </div>
    </div>
  )
}
