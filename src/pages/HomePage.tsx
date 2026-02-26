import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './HomePage.module.css'

const features = [
  {
    icon: '🎵',
    tag: 'Extract · Convert',
    title: 'Audio Converter',
    desc: 'Extract audio from video or convert between audio formats. Full control over bitrate, sample rate, and channels.',
    path: '/audio',
  },
  {
    icon: '🎬',
    tag: 'Convert · Transcode',
    title: 'Video Converter',
    desc: 'Convert to any video format with full codec, resolution, frame-rate, encoding preset, and CRF quality control.',
    path: '/video',
  },
  {
    icon: '🖼️',
    tag: 'Trim · Animate',
    title: 'GIF Maker',
    desc: 'Turn any video clip into a crisp animated GIF. Trim 1–10 seconds, choose FPS and resolution.',
    path: '/gif',
  },
  {
    icon: '🔗',
    tag: 'Arrange · Merge',
    title: 'Media Merger',
    desc: 'Combine up to 10 audio or video files into one. Drag to reorder, preview the result live, then export.',
    path: '/merge',
  },
]

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  function go(path: string) {
    navigate(isAuthenticated ? path : '/login')
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>⚡ Fast · Precise · Powerful</div>
        <h1 className={styles.heroTitle}>
          Transcode Any
          <br />
          <span className={styles.heroAccent}>Media File</span>
        </h1>
        <p className={styles.heroSub}>
          Professional-grade audio &amp; video conversion right in your browser.
          No installs. No compromise on quality.
        </p>
        <div className={styles.heroActions}>
          {isAuthenticated ? (
            <>
              <button className={styles.btnPrimary} onClick={() => navigate('/audio')}>
                Start Converting
              </button>
              <button className={styles.btnGhost} onClick={() => navigate('/queue')}>
                View My Jobs
              </button>
            </>
          ) : (
            <>
              <button className={styles.btnPrimary} onClick={() => navigate('/signup')}>
                Get Started Free
              </button>
              <button className={styles.btnGhost} onClick={() => navigate('/login')}>
                Sign In
              </button>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className={styles.featuresSection}>
        <p className={styles.sectionEyebrow}>What You Can Do</p>
        <div className={styles.grid}>
          {features.map((f) => (
            <div
              key={f.path}
              className={styles.card}
              onClick={() => go(f.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && go(f.path)}
            >
              <div className={styles.cardIcon}>{f.icon}</div>
              <p className={styles.cardTag}>{f.tag}</p>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
              <span className={styles.cardCta}>
                {isAuthenticated ? 'Open Tool →' : 'Sign in to use →'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        {[
          ['30', 'MB Max Size'],
          ['20', 'Min Max Duration'],
          ['16+', 'Output Formats'],
          ['4K', 'Max Resolution'],
        ].map(([num, label], i) => (
          <div key={i} className={styles.statItem}>
            <span className={styles.statNum}>{num}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
