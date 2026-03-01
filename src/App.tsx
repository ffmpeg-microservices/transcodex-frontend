import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProcessProvider } from './context/ProcessContext'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AudioPage from './pages/AudioPage'
import VideoPage from './pages/VideoPage'
import GifPage from './pages/GifPage'
import MergePage from './pages/MergePage'
import QueuePage from './pages/QueuePage'
import { ToastProvider } from './components/Toast'
import styles from './App.module.css'
import { WebSocketProvider } from './context/WebSocketContext'

function Layout() {
  return (
    <div className={styles.app}>
      <Navbar />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/audio"
            element={
              <ProtectedRoute>
                <AudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video"
            element={
              <ProtectedRoute>
                <VideoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gif"
            element={
              <ProtectedRoute>
                <GifPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merge"
            element={
              <ProtectedRoute>
                <MergePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/queue"
            element={
              <ProtectedRoute>
                <QueuePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <ProcessProvider>
            <ToastProvider>
              <Layout />
            </ToastProvider>
          </ProcessProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
