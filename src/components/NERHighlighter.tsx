import { S } from '../strings'
import type { NERToken } from '../hooks/useNLP'

interface Props {
  rawText: string
  tokens: NERToken[]
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  PER: S.per,
  LOC: S.loc,
  ORG: S.org,
  MISC: S.misc,
}

// CAMeL-Lab NER returns PERS for person; normalize all variants to canonical types
function normalizeType(type: string): 'PER' | 'LOC' | 'ORG' | 'MISC' {
  const t = type.toUpperCase()
  if (t === 'PER' || t === 'PERS' || t === 'PERSON') return 'PER'
  if (t === 'LOC' || t === 'GPE' || t === 'LOCATION') return 'LOC'
  if (t === 'ORG' || t === 'ORGANIZATION') return 'ORG'
  return 'MISC'
}

function entityStyles(type: string): { bg: string; text: string } {
  const t = normalizeType(type)
  if (t === 'PER') return { bg: 'var(--color-entity-per-bg)', text: 'var(--color-entity-per-text)' }
  if (t === 'LOC') return { bg: 'var(--color-entity-loc-bg)', text: 'var(--color-entity-loc-text)' }
  if (t === 'ORG') return { bg: 'var(--color-entity-org-bg)', text: 'var(--color-entity-org-text)' }
  return { bg: 'var(--color-entity-misc-bg)', text: 'var(--color-entity-misc-text)' }
}

export function NERHighlighter({ rawText, tokens }: Props) {
  if (tokens.length === 0) {
    return (
      <div>
        <p style={{ color: 'var(--color-text)', lineHeight: 1.7, marginBottom: '12px' }}>{rawText}</p>
        {/* per `empty-states`: always explain why the panel is empty */}
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{S.nerNoEntities}</p>
      </div>
    )
  }

  const segments: React.ReactNode[] = []
  let cursor = 0

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.start > cursor) {
      segments.push(
        <span key={`text-${cursor}`}>{rawText.slice(cursor, token.start)}</span>
      )
    }

    const { bg, text } = entityStyles(token.type)
    const typeLabel = ENTITY_TYPE_LABELS[normalizeType(token.type)] ?? token.type

    segments.push(
      <span key={`entity-${i}`} style={{ display: 'inline-block', position: 'relative', margin: '0 2px' }}>
        {/* per `aria-labels` + `voiceover-sr`: role="mark" with meaningful aria-label */}
        <mark
          role="mark"
          aria-label={`كيان من نوع ${typeLabel}: ${token.text}`}
          style={{
            background: bg,
            color: text,
            borderRadius: '4px',
            padding: '0 4px',
            fontWeight: 500,
          }}
        >
          {token.text}
        </mark>
        {/* entity type badge above the mark */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-16px',
            right: '0',
            fontSize: '10px',
            color: text,
            whiteSpace: 'nowrap',
            fontWeight: 600,
            letterSpacing: '0.03em',
          }}
        >
          {typeLabel}
        </span>
      </span>
    )

    cursor = token.end
  }

  if (cursor < rawText.length) {
    segments.push(<span key={`text-end`}>{rawText.slice(cursor)}</span>)
  }

  return (
    <p style={{ color: 'var(--color-text)', lineHeight: 2.2, paddingTop: '8px' }}>
      {segments}
    </p>
  )
}
