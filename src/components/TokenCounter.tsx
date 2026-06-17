import { S } from '../strings'

interface Props {
  text: string
}

export function TokenCounter({ text }: Props) {
  if (!text) return null

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const estimated = Math.round(wordCount * 1.3)
  const isWarning = estimated >= 390

  return (
    <div
      style={{
        fontSize: '12px',
        color: isWarning ? 'var(--color-confidence-mid)' : 'var(--color-text-muted)',
        textAlign: 'left',
        marginTop: '4px',
        fontVariantNumeric: 'tabular-nums',
      }}
      /* per `aria-live-errors`: notify screen readers when warning appears */
      aria-live={isWarning ? 'polite' : undefined}
    >
      {isWarning
        ? S.tokenWarning
        : `~${estimated} رمز`}
    </div>
  )
}
