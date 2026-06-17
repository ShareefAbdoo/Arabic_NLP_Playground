import { useState, useEffect, useRef } from 'react'

export type Task = 'sentiment' | 'dialect' | 'ner'
export type Status = 'idle' | 'loading' | 'success' | 'error'
export type ErrorKind = 'rate-limit' | 'model-loading' | 'network' | 'unavailable' | 'unknown'

export interface LabelScore {
  label: string
  score: number
}

export interface NERToken {
  text: string
  type: string
  score: number
  start: number
  end: number
}

export type NLPData =
  | { kind: 'classification'; results: LabelScore[] }
  | { kind: 'ner'; tokens: NERToken[]; rawText: string }

export interface NLPState {
  status: Status
  data: NLPData | null
  errorKind: ErrorKind | null
}

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? ''
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN ?? ''
const DEBOUNCE_MS = 300
const MIN_LENGTH = 4

// Sentiment + NER run on hf-inference text/token-classification models.
const CLASSIFY_MODELS: Record<'sentiment' | 'ner', string> = {
  sentiment: 'CAMeL-Lab/bert-base-arabic-camelbert-mix-sentiment',
  ner: 'CAMeL-Lab/bert-base-arabic-camelbert-mix-ner',
}

// Dialect: no free BERT dialect classifier survives on hf-inference (all deprecated),
// so we classify via the chat LLM router and parse a JSON confidence map.
const CHAT_URL = 'https://router.huggingface.co/v1/chat/completions'
const CHAT_MODEL = 'meta-llama/Llama-3.1-8B-Instruct'
// Country-level dialects (LLM lets us define any labels, unlike a fixed BERT model).
export const DIALECT_LABELS = [
  'MSA', 'Saudi', 'Gulf', 'Iraqi', 'Levantine', 'Egyptian', 'Sudanese', 'Yemeni', 'Maghrebi',
] as const
// Number of top dialects shown in the panel (keeps it clean vs. all 9).
const DIALECT_TOP_N = 4

const DIALECT_SYSTEM_PROMPT = `You are an expert in Arabic dialectology. Classify Arabic text into these dialects, weighting distinctive lexical markers heavily:
- MSA (فصحى): formal, no colloquial markers.
- Saudi (سعودية، نجدي/حجازي): markers وش، ابغى، أبي، عساك، الحين، دحين، كذا، زين، مرة (=very), ايش، تو.
- Gulf (خليجية، إماراتي/كويتي/قطري/بحريني/عماني): markers شلون، وايد (=very), چذي، شفيك، عقب، يبه، عيل.
- Iraqi (عراقية): markers شكو ماكو، اكو، ماكو، هواية، چان، هسه، گاع، شلونك.
- Levantine (شامية): markers شو، هيك، هلق، منيح، بدي، كتير، عم+فعل، لسا.
- Egyptian (مصرية): markers ايه، ازاي، عايز، كده، دلوقتي، مش، علشان، ده.
- Sudanese (سودانية): markers شنو، داير، زول، ياخي، شديد، بتاع، قروش.
- Yemeni (يمنية): markers شي، باش، عيش، قد، ذا، حقّ، معك، ماشي.
- Maghrebi (مغاربية): markers واش، بزاف، دابا، كيفاش، غادي، ديال، باش، بغيت، مزيان.
Respond with ONLY a JSON object with keys MSA, Saudi, Gulf, Iraqi, Levantine, Egyptian, Sudanese, Yemeni, Maghrebi and numeric confidence 0-1. No prose, no code fences.`

function postJson(body: unknown, token?: string): RequestInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return { method: 'POST', headers, body: JSON.stringify(body) }
}

function dialectChatBody(text: string) {
  return {
    model: CHAT_MODEL,
    temperature: 0,
    max_tokens: 150,
    messages: [
      { role: 'system', content: DIALECT_SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
  }
}

function buildRequest(task: Task, text: string): { url: string; init: RequestInit } {
  if (task === 'dialect') {
    if (WORKER_URL) return { url: `${WORKER_URL}/dialect`, init: postJson({ inputs: text }) }
    if (HF_TOKEN) return { url: CHAT_URL, init: postJson(dialectChatBody(text), HF_TOKEN) }
    throw new Error('Set VITE_WORKER_URL or VITE_HF_TOKEN in .env.local')
  }

  const body: Record<string, unknown> = { inputs: text }
  if (task === 'ner') body.parameters = { aggregation_strategy: 'simple' }

  if (WORKER_URL) return { url: `${WORKER_URL}/${task}`, init: postJson(body) }
  if (HF_TOKEN) {
    return {
      url: `https://router.huggingface.co/hf-inference/models/${CLASSIFY_MODELS[task]}`,
      init: postJson(body, HF_TOKEN),
    }
  }
  throw new Error('Set VITE_WORKER_URL or VITE_HF_TOKEN in .env.local')
}

function parseDialect(raw: unknown): LabelScore[] {
  const resp = raw as { choices?: Array<{ message?: { content?: string } }> }
  const content = resp.choices?.[0]?.message?.content ?? ''
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) return []
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(match[0]) as Record<string, unknown>
  } catch {
    return []
  }
  return DIALECT_LABELS.map(label => {
    const v = parsed[label]
    const score = typeof v === 'number' ? Math.max(0, Math.min(1, v)) : 0
    return { label, score }
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, DIALECT_TOP_N)
}

function parseClassification(raw: unknown): LabelScore[] {
  if (!Array.isArray(raw)) return []
  return (raw as Array<{ label: string; score: number }>)
    .filter(item => typeof item.label === 'string' && typeof item.score === 'number')
    .sort((a, b) => b.score - a.score)
}

function parseNER(raw: unknown, rawText: string): NERToken[] {
  if (!Array.isArray(raw)) return []
  const items = raw as Array<{
    entity_group?: string
    entity?: string
    word: string
    score: number
    start: number
    end: number
  }>

  const merged: NERToken[] = []
  for (const item of items) {
    const type = item.entity_group ?? item.entity ?? 'MISC'
    const word = item.word.startsWith('##') ? item.word.slice(2) : item.word

    const prev = merged[merged.length - 1]
    if (prev && prev.type === type && item.start <= prev.end + 1) {
      prev.text = rawText.slice(prev.start, item.end)
      prev.end = item.end
      prev.score = Math.max(prev.score, item.score)
    } else {
      merged.push({ text: word, type, score: item.score, start: item.start, end: item.end })
    }
  }
  return merged
}

function errorKindFor(status: number, body: string): ErrorKind {
  if (status === 429) return 'rate-limit'
  if (status === 503 || body.includes('loading')) return 'model-loading'
  // 400/410 from the router mean the model is no longer served (deprecated / unsupported)
  if (status === 400 || status === 410) return 'unavailable'
  return 'unknown'
}

export function useNLP(text: string, task: Task): NLPState {
  const [state, setState] = useState<NLPState>({ status: 'idle', data: null, errorKind: null })
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (abortRef.current) abortRef.current.abort()

    if (text.length === 0) {
      setState({ status: 'idle', data: null, errorKind: null })
      return
    }

    if (text.length < MIN_LENGTH) return

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller

      setState({ status: 'loading', data: null, errorKind: null })

      try {
        const { url, init } = buildRequest(task, text)
        const res = await fetch(url, { ...init, signal: controller.signal })
        const body = await res.text()

        if (!res.ok) {
          setState({ status: 'error', data: null, errorKind: errorKindFor(res.status, body) })
          return
        }

        const json = JSON.parse(body) as unknown

        if (task === 'ner') {
          setState({
            status: 'success',
            data: { kind: 'ner', tokens: parseNER(json, text), rawText: text },
            errorKind: null,
          })
        } else if (task === 'dialect') {
          setState({
            status: 'success',
            data: { kind: 'classification', results: parseDialect(json) },
            errorKind: null,
          })
        } else {
          const results = Array.isArray(json) && Array.isArray(json[0])
            ? parseClassification(json[0])
            : parseClassification(json)
          setState({ status: 'success', data: { kind: 'classification', results }, errorKind: null })
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setState({
          status: 'error',
          data: null,
          errorKind: !navigator.onLine ? 'network' : 'unknown',
        })
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [text, task])

  return state
}
