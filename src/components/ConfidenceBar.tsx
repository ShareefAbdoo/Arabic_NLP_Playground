import { motion } from 'framer-motion'
import { LABEL_MAP } from '../strings'

interface Props {
  label: string
  score: number
}

function colorForScore(score: number): string {
  if (score >= 0.8) return 'var(--color-confidence-high)'
  if (score >= 0.5) return 'var(--color-confidence-mid)'
  return 'var(--color-confidence-low)'
}

export function ConfidenceBar({ label, score }: Props) {
  const pct = Math.round(score * 100)
  const arabic = LABEL_MAP[label] ?? label
  const color = colorForScore(score)

  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline mb-1">
        {/* per `weight-hierarchy`: label at 500, score at 400 */}
        <span style={{ color: 'var(--color-text)', fontWeight: 500, fontSize: '14px' }}>{arabic}</span>
        {/* per `color-not-only`: show numeric score alongside color coding */}
        <span style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
          {pct}٪
        </span>
      </div>
      {/* per `content-jumping`: reserve fixed height for bar so layout doesn't shift */}
      <div
        style={{
          height: 'var(--bar-height)',
          background: 'var(--color-surface)',
          borderRadius: '4px',
          overflow: 'hidden',
          direction: 'ltr',
        }}
      >
        {/* RTL fill: direction ltr on container + marginLeft: auto fills from right */}
        <div style={{ display: 'flex', height: '100%', justifyContent: 'flex-end' }}>
          {/* per `transform-performance`: animate via Framer Motion (uses transform internally) */}
          {/* per `duration-timing`: 400ms complex transition, ease-out entering */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ background: color, borderRadius: '4px', height: '100%' }}
            role="meter"
            aria-label={`${arabic}: ${pct}٪`}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </div>
  )
}
