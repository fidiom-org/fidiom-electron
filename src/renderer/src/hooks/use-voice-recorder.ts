import { useCallback, useRef, useState } from 'react'

export interface VoiceRecorder {
  recording: boolean
  start: () => Promise<void>
  stop: () => Promise<Uint8Array | null>
  cancel: () => void
}

export const useVoiceRecorder = (): VoiceRecorder => {
  const [recording, setRecording] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const procRef = useRef<ScriptProcessorNode | null>(null)
  const chunksRef = useRef<Float32Array[]>([])

  const cleanup = (): void => {
    procRef.current?.disconnect()
    procRef.current = null
    void ctxRef.current?.close()
    ctxRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const start = useCallback(async (): Promise<void> => {
    chunksRef.current = []
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    })
    streamRef.current = stream
    const ctx = new AudioContext({ sampleRate: 16000 })
    ctxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)
    const proc = ctx.createScriptProcessor(4096, 1, 1)
    procRef.current = proc
    proc.onaudioprocess = (e): void => {
      chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)))
    }
    source.connect(proc)
    proc.connect(ctx.destination)
    setRecording(true)
  }, [])

  const stop = useCallback(async (): Promise<Uint8Array | null> => {
    setRecording(false)
    const chunks = chunksRef.current
    cleanup()
    if (chunks.length === 0) return null

    let total = 0
    for (const chunk of chunks) total += chunk.length
    const merged = new Float32Array(total)
    let offset = 0
    for (const chunk of chunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }
    return new Uint8Array(merged.buffer)
  }, [])

  const cancel = useCallback((): void => {
    setRecording(false)
    chunksRef.current = []
    cleanup()
  }, [])

  return { recording, start, stop, cancel }
}
