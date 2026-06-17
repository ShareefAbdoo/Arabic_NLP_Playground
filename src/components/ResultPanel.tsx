import { ConfidenceBar } from './ConfidenceBar'
import { NERHighlighter } from './NERHighlighter'
import { LoadingText } from './LoadingText'
import { ErrorBanner } from './ErrorBanner'
import type { Task, NLPState } from '../hooks/useNLP'

interface Props {
  task: Task
  title: string
  idlePrompt: string
  state: NLPState
  note?: string
}

export function ResultPanel({ task, title, idlePrompt, state, note }: Props) {
  const { status, data, errorKind } = state

  return (
    /* per `aria-labels`: role="region" with aria-label for landmark navigation */
    <section
      role="region"
      aria-label={title}
      aria-live="polite"
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-panel)',
        padding: '16px',
        /* per `content-jumping`: min-height prevents layout shift between states */
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h2
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--color-text)',
          marginBottom: '12px',
        }}
      >
        {title}
      </h2>

      {status === 'idle' && (
        /* per `empty-states`: helpful per-panel prompt instead of blank */
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '14px',
            textAlign: 'center',
            margin: 'auto 0',
            padding: '16px 0',
          }}
        >
          {idlePrompt}
        </p>
      )}

      {status === 'loading' && <LoadingText />}

      {status === 'error' && errorKind && (
        <ErrorBanner kind={errorKind} />
      )}

      {status === 'success' && data && (
        <>
          {data.kind === 'classification' && (
            <div>
              {data.results.map(({ label, score }) => (
                <ConfidenceBar key={label} label={label} score={score} />
              ))}
              {/* per `color-not-only` honesty: flag approximate LLM-based results */}
              {note && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginTop: '8px' }}>
                  {note}
                </p>
              )}
            </div>
          )}
          {data.kind === 'ner' && task === 'ner' && (
            <NERHighlighter rawText={data.rawText} tokens={data.tokens} />
          )}
        </>
      )}
    </section>
  )
}
