import { useState } from 'react'
import { useNLP } from './hooks/useNLP'
import { ResultPanel } from './components/ResultPanel'
import { AudioInput } from './components/AudioInput'
import { TokenCounter } from './components/TokenCounter'
import { S, EXAMPLES } from './strings'

export function App() {
  const [text, setText] = useState('')

  const sentimentState = useNLP(text, 'sentiment')
  const dialectState = useNLP(text, 'dialect')
  const nerState = useNLP(text, 'ner')

  function handleExample(exampleText: string) {
    setText(exampleText)
  }

  return (
    /* per `keyboard-nav`: skip-to-content link for keyboard users */
    <>
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: '-100px',
          right: '0',
          background: 'var(--color-confidence-high)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '4px',
          zIndex: 100,
          fontSize: '14px',
        }}
        onFocus={e => { (e.currentTarget as HTMLAnchorElement).style.top = '8px' }}
        onBlur={e => { (e.currentTarget as HTMLAnchorElement).style.top = '-100px' }}
      >
        انتقل إلى المحتوى الرئيسي
      </a>

      {/* per `viewport-units`: min-h-dvh on mobile avoids 100vh address-bar mismatch */}
      <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', padding: '0 16px 40px' }}>
        {/* per `container-width`: max-w consistent on desktop */}
        <main
          id="main-content"
          role="main"
          aria-label={S.appTitle}
          style={{ maxWidth: '900px', margin: '0 auto' }}
        >
          {/* Header */}
          <header style={{ paddingTop: '32px', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* per `heading-hierarchy`: h1 at page level */}
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)' }}>
                {S.appTitle}
              </h1>
              {/* per `touch-target-size`: mic button is 44×44px */}
              <AudioInput onTranscript={text => setText(text)} />
            </div>
            {/* per `visual-hierarchy`: tagline at muted weight below title */}
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px', lineHeight: 1.6 }}>
              {S.appTagline}
            </p>
          </header>

          {/* Textarea */}
          <div style={{ marginBottom: '12px' }}>
            {/* per `form-labels`: visually-hidden label for screen readers */}
            <label
              htmlFor="arabic-input"
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0,0,0,0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              {S.appTitle}
            </label>
            <textarea
              id="arabic-input"
              dir="rtl"
              lang="ar"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={S.placeholder}
              rows={5}
              maxLength={10000}
              style={{
                width: '100%',
                fontFamily: 'var(--font-arabic)',
                /* per `readable-font-size`: 18px so no iOS auto-zoom */
                fontSize: '18px',
                lineHeight: 1.7,
                color: 'var(--color-text)',
                background: 'var(--color-surface)',
                border: 'none',
                borderRadius: 'var(--radius-panel)',
                padding: '14px 16px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                /* per `touch-friendly-input`: min-height meets touch requirements */
                minHeight: '120px',
              }}
              /* per `focus-states`: delegated to :focus-visible in index.css */
              onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.outline = '2px solid var(--color-confidence-high)' }}
              onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.outline = 'none' }}
            />
            <TokenCounter text={text} />
          </div>

          {/* Example buttons */}
          {/* per `touch-target-size`: example buttons min-height 44px */}
          <div
            style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}
            role="group"
            aria-label="أمثلة جاهزة"
          >
            {EXAMPLES.map(ex => (
              <button
                key={ex.key}
                onClick={() => handleExample(ex.text)}
                style={{
                  fontFamily: 'var(--font-arabic)',
                  fontSize: '14px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  /* per `state-clarity`: hover state visible */
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.75' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Result panels — per `mobile-first`: single column on mobile, 3-col on md+ */}
          <div
            style={{
              display: 'grid',
              gap: '12px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            }}
          >
            <ResultPanel
              task="sentiment"
              title={S.sentimentTask}
              idlePrompt={S.sentimentIdle}
              state={sentimentState}
            />
            <ResultPanel
              task="dialect"
              title={S.dialectTask}
              idlePrompt={S.dialectIdle}
              state={dialectState}
              note={S.dialectNote}
            />
            <ResultPanel
              task="ner"
              title={S.nerTask}
              idlePrompt={S.nerIdle}
              state={nerState}
            />
          </div>
        </main>
      </div>
    </>
  )
}
