import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { S } from '../strings'

interface Props {
  onTranscript: (text: string) => void
}

type RecordState = 'idle' | 'recording'

function getSpeechRecognitionClass(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  return (
    (window as Window & { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ??
    (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition ??
    null
  )
}

export function AudioInput({ onTranscript }: Props) {
  const [state, setState] = useState<RecordState>('idle')
  const [tooltip, setTooltip] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const SR = getSpeechRecognitionClass()
  if (!SR) return null

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const SRClass = SR!

  function start() {
    if (state === 'recording') {
      recognitionRef.current?.stop()
      setState('idle')
      return
    }

    const recognition = new SRClass()
    recognition.lang = 'ar'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        /* per CEO plan D4: only fire on isFinal to prevent rate limit exhaustion from partials */
        if (result.isFinal) {
          onTranscript(result[0].transcript)
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setTooltip(S.micDenied)
        setTimeout(() => setTooltip(null), 4000)
      }
      setState('idle')
    }

    recognition.onend = () => setState('idle')

    try {
      recognition.start()
      recognitionRef.current = recognition
      setState('recording')
    } catch {
      setState('idle')
    }
  }

  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  const isRecording = state === 'recording'

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* per `touch-target-size`: 44×44px — icon is 20px, padded to fill target */}
      {/* per `aria-labels`: icon-only button must have aria-label */}
      {/* per `cursor-pointer`: explicit cursor for web */}
      <button
        onClick={start}
        aria-label={isRecording ? 'إيقاف الاستماع' : 'بدء الإدخال الصوتي'}
        aria-pressed={isRecording}
        style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          borderRadius: '50%',
          background: isRecording ? 'var(--color-confidence-high)' : 'var(--color-surface)',
          color: isRecording ? '#fff' : 'var(--color-text-muted)',
          cursor: 'pointer',
          /* per `tap-delay`: manipulation removes 300ms tap delay */
          touchAction: 'manipulation',
          transition: 'background 0.2s ease, transform 0.1s ease',
          flexShrink: 0,
        }}
        onMouseDown={e => { (e.currentTarget).style.transform = 'scale(0.95)' }}
        onMouseUp={e => { (e.currentTarget).style.transform = 'scale(1)' }}
        onTouchStart={e => { (e.currentTarget).style.transform = 'scale(0.95)' }}
        onTouchEnd={e => { (e.currentTarget).style.transform = 'scale(1)' }}
      >
        {isRecording ? <MicOff size={20} aria-hidden="true" /> : <Mic size={20} aria-hidden="true" />}
      </button>

      {/* per `error-feedback`: tooltip near the button, not at top of page */}
      {tooltip && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            top: '48px',
            right: '0',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '12px',
            padding: '6px 10px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {tooltip}
        </div>
      )}

      {/* per `state-transition`: pulse ring shows recording is active */}
      {isRecording && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '50%',
            border: '2px solid var(--color-confidence-high)',
            animation: 'mic-pulse 1.5s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      <style>{
        `@keyframes mic-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes mic-pulse { 0%, 100% { opacity: 0.7; } }
        }`
      }</style>
    </div>
  )
}
