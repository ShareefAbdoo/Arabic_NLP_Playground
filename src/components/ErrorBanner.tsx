import { motion } from 'framer-motion'
import { S } from '../strings'
import type { ErrorKind } from '../hooks/useNLP'

interface Props {
  kind: ErrorKind
  onRetry?: () => void
}

function messageFor(kind: ErrorKind): string {
  switch (kind) {
    case 'rate-limit': return S.rateLimit
    case 'model-loading': return S.modelLoading
    case 'unavailable': return S.modelUnavailable
    case 'network': return S.networkError
    default: return S.unknownError
  }
}

export function ErrorBanner({ kind, onRetry }: Props) {
  const message = messageFor(kind)

  return (
    /* per `duration-timing`: 200ms slide-in from top */
    /* per `aria-live-errors`: role="alert" for immediate screen reader announcement */
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        borderRadius: 'var(--radius-panel)',
        padding: '10px 14px',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}
    >
      <span>{message}</span>
      {/* per `error-recovery`: always provide a retry path */}
      {onRetry && kind !== 'rate-limit' && kind !== 'unavailable' && (
        <button
          onClick={onRetry}
          style={{
            background: 'none',
            border: '1px solid var(--color-text-muted)',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '12px',
            color: 'var(--color-text)',
            cursor: 'pointer',
            /* per `touch-target-size`: retry button meets 44px via min-height */
            minHeight: '32px',
            touchAction: 'manipulation',
          }}
        >
          {S.retry}
        </button>
      )}
    </motion.div>
  )
}
