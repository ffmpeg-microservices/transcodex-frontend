import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import type { StompSubscription } from '@stomp/stompjs'
import { stompClient } from '../lib/stompClient'

// ─── Types ───────────────────────────────────────────────────

type MessageHandler = (body: string) => void

interface WebSocketContextValue {
  connected: boolean
  subscribe: (topic: string, handler: MessageHandler) => () => void
  send: (destination: string, body?: string) => void
}

// ─── Context ─────────────────────────────────────────────────

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false)

  // Pending subscriptions requested before connection was ready.
  // key = topic, value = handler
  const pendingRef = useRef<Map<string, MessageHandler>>(new Map())
  const activeSubsRef = useRef<Map<string, StompSubscription>>(new Map())

  useEffect(() => {
    stompClient.onConnect = () => {
      setConnected(true)

      // Flush any subscriptions that were requested before we connected
      pendingRef.current.forEach((handler, topic) => {
        const sub = stompClient.subscribe(topic, (frame) => handler(frame.body))
        activeSubsRef.current.set(topic, sub)
      })
      pendingRef.current.clear()
    }

    stompClient.onDisconnect = () => {
      setConnected(false)
    }

    stompClient.onStompError = (frame) => {
      console.error('[STOMP] error:', frame.headers['message'])
    }

    stompClient.activate()

    return () => {
      void stompClient.deactivate()
    }
  }, [])

  const subscribe = useCallback((topic: string, handler: MessageHandler): (() => void) => {
    if (stompClient.connected) {
      // Already connected — subscribe immediately
      const sub = stompClient.subscribe(topic, (frame) => handler(frame.body))
      activeSubsRef.current.set(topic, sub)
    } else {
      // Queue it — will be flushed on connect
      pendingRef.current.set(topic, handler)
    }

    // Return unsubscribe function
    return () => {
      const activeSub = activeSubsRef.current.get(topic)
      if (activeSub) {
        activeSub.unsubscribe()
        activeSubsRef.current.delete(topic)
      } else {
        // May still be pending
        pendingRef.current.delete(topic)
      }
    }
  }, [])

  const send = useCallback((destination: string, body = '') => {
    if (!stompClient.connected) {
      console.warn('[STOMP] Cannot send — not connected yet.')
      return
    }
    stompClient.publish({ destination, body })
  }, [])

  return (
    <WebSocketContext.Provider value={{ connected, subscribe, send }}>
      {children}
    </WebSocketContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────

export function useWebSocket(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext)
  if (!ctx) throw new Error('useWebSocket must be used within <WebSocketProvider>')
  return ctx
}
