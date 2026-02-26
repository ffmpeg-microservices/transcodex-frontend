import {
  useRef,
  useState,
  type DragEvent,
} from 'react'
import type { MediaItem } from './MergePage.types'
import styles from './MergeTimeline.module.css'

interface MergeTimelineProps {
  items: MediaItem[]
  totalDuration: number
  activeId: string | null
  onReorder: (fromIndex: number, toIndex: number) => void
  onRemove: (id: string) => void
  onSelect: (id: string) => void
}

function formatDur(s: number) {
  if (s === 0) return '?'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Nice palette for timeline blocks
const TRACK_COLORS = [
  '#5b6ef5',
  '#10c98f',
  '#f59e0b',
  '#e879a0',
  '#38bdf8',
  '#a78bfa',
  '#fb923c',
  '#34d399',
  '#f472b6',
  '#60a5fa',
]

export function MergeTimeline({
  items,
  totalDuration,
  activeId,
  onReorder,
  onRemove,
  onSelect,
}: MergeTimelineProps) {
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  function handleDragStart(e: DragEvent, index: number) {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  function handleDrop(e: DragEvent, toIndex: number) {
    e.preventDefault()
    const fromIndex = dragIndexRef.current
    if (fromIndex !== null && fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex)
    }
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Upload files above to build your merge timeline</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {/* Timeline bar */}
      <div className={styles.timelineBar}>
        {items.map((item, i) => {
          const widthPct =
            totalDuration > 0
              ? Math.max((item.duration / totalDuration) * 100, 4)
              : 100 / items.length
          return (
            <div
              key={item.id}
              className={`${styles.timelineBlock} ${activeId === item.id ? styles.timelineBlockActive : ''}`}
              style={{
                width: `${widthPct}%`,
                background: TRACK_COLORS[i % TRACK_COLORS.length],
              }}
              title={`${item.fileName} (${formatDur(item.duration)})`}
              onClick={() => onSelect(item.id)}
            >
              <span className={styles.timelineLabel}>
                {i + 1}
              </span>
            </div>
          )
        })}
        {/* Time ruler */}
        <div className={styles.ruler}>
          <span>0:00</span>
          {totalDuration > 0 && <span>{formatDur(totalDuration / 2)}</span>}
          {totalDuration > 0 && <span>{formatDur(totalDuration)}</span>}
        </div>
      </div>

      {/* Drag-sortable cards */}
      <div className={styles.cardList}>
        {items.map((item, i) => {
          const color = TRACK_COLORS[i % TRACK_COLORS.length]
          const isDragOver = dragOverIndex === i

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`${styles.card} ${activeId === item.id ? styles.cardActive : ''} ${isDragOver ? styles.cardDragOver : ''}`}
              style={{ borderLeftColor: color }}
              onClick={() => onSelect(item.id)}
            >
              {/* Thumbnail or icon */}
              <div className={styles.cardThumb}>
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt="" className={styles.thumbImg} />
                ) : (
                  <div className={styles.thumbIcon} style={{ background: color + '22' }}>
                    {item.isVideo ? '🎬' : '🎵'}
                  </div>
                )}
                <span className={styles.cardIndex} style={{ background: color }}>
                  {i + 1}
                </span>
              </div>

              {/* Info */}
              <div className={styles.cardInfo}>
                <strong className={styles.cardName}>{item.fileName}</strong>
                <div className={styles.cardMeta}>
                  <span>{item.isVideo ? 'Video' : 'Audio'}</span>
                  <span>{formatDur(item.duration)}</span>
                  <span>{formatSize(item.fileSize)}</span>
                </div>
              </div>

              {/* Drag handle + remove */}
              <div className={styles.cardActions}>
                <span className={styles.dragHandle} title="Drag to reorder">
                  ⠿
                </span>
                <button
                  className={styles.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(item.id)
                  }}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className={styles.hint}>
        Drag cards to reorder · Click a card to preview it below
      </p>
    </div>
  )
}
