import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const FRAMES = ['ت', 'تح', 'تحل', 'تحلي', 'تحليل']

export function LoadingText() {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    /* per `duration-timing`: 150ms stagger between frames */
    const id = setInterval(() => {
      setFrame(f => (f + 1) % FRAMES.length)
    }, 150)
    return () => clearInterval(id)
  }, [])

  return (
    /* per `aria-labels`: aria-live="polite" so screen readers announce loading state */
    <div
      role="status"
      aria-live="polite"
      aria-label="جارٍ التحليل"
      style={{
        color: 'var(--color-text-muted)',
        fontSize: '20px',
        textAlign: 'center',
        padding: '16px 0',
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* per `transform-performance`: only animate opacity, not layout properties */}
      <motion.span
        key={frame}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        /* per `duration-timing`: 150ms micro-interaction, ease-out entering */
        transition={{ duration: 0.15, ease: 'easeOut' }}
        aria-hidden="true"
      >
        {FRAMES[frame]}
      </motion.span>
    </div>
  )
}
