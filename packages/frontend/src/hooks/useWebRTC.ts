import { useEffect, useRef, useState, useCallback } from 'react'
import type { SignalingHandle } from './useSignaling'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  ...(import.meta.env.VITE_TURN_URL ? [{
    urls: import.meta.env.VITE_TURN_URL as string,
    username: import.meta.env.VITE_TURN_USER as string,
    credential: import.meta.env.VITE_TURN_PASS as string,
  }] : []),
]

interface Options {
  signaling: SignalingHandle
  localVideoRef: React.RefObject<HTMLVideoElement>
  remoteVideoRef: React.RefObject<HTMLVideoElement>
  onStatusChange: (status: 'matching' | 'connected' | 'disconnected') => void
}

export function useWebRTC({ signaling, localVideoRef, remoteVideoRef, onStatusChange }: Options) {
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const messageListenersRef = useRef<Set<(data: unknown) => void>>(new Set())

  function wireDataChannel(dc: RTCDataChannel) {
    dcRef.current = dc
    setDataChannel(dc)
    dc.onopen = () => console.log('[webrtc] data channel open')
    dc.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        messageListenersRef.current.forEach(fn => fn(data))
      } catch {}
    }
    dc.onerror = (e) => console.error('[webrtc] dc error:', e)
  }

  const sendData = useCallback((payload: object): boolean => {
    const dc = dcRef.current
    if (!dc || dc.readyState !== 'open') return false
    dc.send(JSON.stringify(payload))
    return true
  }, [])

  const onDataMessage = useCallback((fn: (data: unknown) => void) => {
    messageListenersRef.current.add(fn)
    return () => messageListenersRef.current.delete(fn)
  }, [])

  function resetConnection() {
    pcRef.current?.close()
    pcRef.current = null
    dcRef.current = null
    setDataChannel(null)
    messageListenersRef.current.clear()
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
  }

  function createPeerConnection(): RTCPeerConnection {
    resetConnection()
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcRef.current = pc

    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!)
    })

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && signaling.peerSocketId.current) {
        signaling.send({
          type: 'ice_candidate',
          candidate: event.candidate.toJSON(),
          targetSocketId: signaling.peerSocketId.current,
        })
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('[webrtc] state:', pc.connectionState)
    }

    pc.ondatachannel = (event) => {
      console.log('[webrtc] received data channel')
      wireDataChannel(event.channel)
    }

    return pc
  }

  useEffect(() => {
    let destroyed = false

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (destroyed) { stream.getTracks().forEach(t => t.stop()); return }
        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          if (destroyed) { stream.getTracks().forEach(t => t.stop()); return }
          localStreamRef.current = stream
        } catch (err) {
          console.error('[webrtc] no media:', err)
        }
      }

      signaling.onMessage(async (msg) => {
        if (destroyed) return

        if (msg.type === 'matched') {
          console.log('[webrtc] matched role:', msg.role)
          const pc = createPeerConnection()

          if (msg.role === 'offerer') {
            const dc = pc.createDataChannel('echo-data')
            wireDataChannel(dc)
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            signaling.send({ type: 'sdp_offer', sdp: pc.localDescription!, targetSocketId: msg.peerSocketId })
          }
        }

        if (msg.type === 'sdp_offer') {
          const pc = pcRef.current
          if (!pc) return
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          signaling.send({ type: 'sdp_answer', sdp: pc.localDescription!, targetSocketId: msg.fromSocketId })
        }

        if (msg.type === 'sdp_answer') {
          const pc = pcRef.current
          if (!pc) return
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
        }

        if (msg.type === 'ice_candidate') {
          const pc = pcRef.current
          if (!pc || !msg.candidate) return
          try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)) } catch {}
        }

        if (msg.type === 'peer_disconnected') {
          resetConnection()
        }
      })
    }

    init()
    return () => {
      destroyed = true
      pcRef.current?.close()
      localStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMuted(m => !m)
  }, [])

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCameraOff(c => !c)
  }, [])

  const skip = useCallback(() => {
    signaling.send({ type: 'disconnect_peer' })
    resetConnection()
    onStatusChange('matching')
    signaling.rejoinQueue()
  }, [signaling, onStatusChange])

  const sendReaction = useCallback((emoji: string) => {
    sendData({ type: 'reaction', emoji })
  }, [])

  return { dataChannel, sendData, onDataMessage, toggleMute, toggleCamera, skip, sendReaction, muted, cameraOff }
}