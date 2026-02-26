import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

import styles from './AuthPage.module.css'

interface FormState {
  fullName: string
  email: string
  username: string
  password: string
  confirm: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.fullName.trim()) errors.fullName = 'Full name is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'Enter a valid email address.'
  if (form.username.trim().length < 3)
    errors.username = 'Username must be at least 3 characters.'
  if (form.password.length < 6)
    errors.password = 'Password must be at least 6 characters.'
  if (form.password !== form.confirm) errors.confirm = 'Passwords do not match.'
  return errors
}

const INITIAL: FormState = {
  fullName: '',
  email: '',
  username: '',
  password: '',
  confirm: '',
}

export default function SignupPage() {
  const { signup } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setLoading(true)
    const res = await signup(form.fullName.trim(), form.email.trim(), form.username.trim(), form.password)
    setLoading(false)

    if (!res.success) toast.error(res.message)
    else navigate('/', { replace: true })

  }

  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.header}>
          <span className={styles.logo}>⚡</span>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Start transcoding in seconds</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="su-fullName">Full Name</label>
              <input
                id="su-fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={form.fullName}
                onChange={handleChange}
                autoComplete="name"
                autoFocus
              />
              {errors.fullName && (
                <span className={styles.fieldError}>{errors.fullName}</span>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="su-email">Email</label>
              <input
                id="su-email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && (
                <span className={styles.fieldError}>{errors.email}</span>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="su-username">Username</label>
            <input
              id="su-username"
              name="username"
              type="text"
              placeholder="john_doe"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
            {errors.username && (
              <span className={styles.fieldError}>{errors.username}</span>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="su-password">Password</label>
              <input
                id="su-password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.password && (
                <span className={styles.fieldError}>{errors.password}</span>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="su-confirm">Confirm Password</label>
              <input
                id="su-confirm"
                name="confirm"
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.confirm && (
                <span className={styles.fieldError}>{errors.confirm}</span>
              )}
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinnerSm} /> Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.switchLink}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
