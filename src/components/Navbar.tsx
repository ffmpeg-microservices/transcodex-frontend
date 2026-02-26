import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProcess } from '../context/ProcessContext'
import { ProcessStatus } from '../types'
import styles from './Navbar.module.css'

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { processes } = useProcess()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const activeJobs = processes.filter(
    (p) =>
      p.status === ProcessStatus.PENDING ||
      p.status === ProcessStatus.PROCESSING,
  ).length

  function handleLogout() {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  return (
    <nav className={styles.navbar}>
      <NavLink to="/" className={styles.brand}>
        <span className={styles.brandIcon}>⚡</span>
        <span className={styles.brandName}>TranscodeX</span>
      </NavLink>

      {isAuthenticated && (
        <div className={styles.links}>
          <NavLink
            to="/audio"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ''}`
            }
          >
            Audio
          </NavLink>
          <NavLink
            to="/video"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ''}`
            }
          >
            Video
          </NavLink>
          <NavLink
            to="/gif"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ''}`
            }
          >
            GIF
          </NavLink>
          <NavLink
            to="/merge"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ''}`
            }
          >
            Merge
          </NavLink>
          <NavLink
            to="/queue"
            className={({ isActive }) =>
              `${styles.link} ${styles.queueLink} ${isActive ? styles.linkActive : ''}`
            }
          >
            My Jobs
            {activeJobs > 0 && (
              <span className={styles.badge}>{activeJobs}</span>
            )}
          </NavLink>
        </div>
      )}

      {isAuthenticated && user && (
        <div
          className={styles.userMenu}
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <div className={styles.avatar}>
            {user.fullname.charAt(0).toUpperCase()}
          </div>
          <span className={styles.username}>{user.email}</span>
          <span className={styles.chevron}>▾</span>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownInfo}>
                <strong>{user.fullname}</strong>
                <span>{user.email}</span>
              </div>
              <hr className={styles.dropdownDivider} />
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  navigate('/queue')
                  setDropdownOpen(false)
                }}
              >
                📋 My Jobs
              </button>
              <button
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={handleLogout}
              >
                ↩ Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      {!isAuthenticated && (
        <div className={styles.authButtons}>
          <button
            className={styles.btnGhost}
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate('/signup')}
          >
            Get Started
          </button>
        </div>
      )}
    </nav>
  )
}
