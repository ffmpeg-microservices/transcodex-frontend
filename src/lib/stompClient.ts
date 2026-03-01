import { Client } from '@stomp/stompjs'

// Raw WebSocket — backend does NOT use .withSockJS()
const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined)
  ?? 'ws://localhost:8080/ws-progress'

export const stompClient = new Client({
  brokerURL: WS_URL,
  reconnectDelay: 3000,
  // debug: (msg) => console.debug('[STOMP]', msg),
})