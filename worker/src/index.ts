interface Env {
  HF_TOKEN: string
}

// Sentiment + NER use hf-inference classification models.
const MODEL_MAP: Record<string, string> = {
  '/sentiment': 'CAMeL-Lab/bert-base-arabic-camelbert-mix-sentiment',
  '/ner': 'CAMeL-Lab/bert-base-arabic-camelbert-mix-ner',
}

// Dialect: no free BERT dialect model survives on hf-inference, so classify via the chat LLM.
const CHAT_URL = 'https://router.huggingface.co/v1/chat/completions'
const CHAT_MODEL = 'meta-llama/Llama-3.1-8B-Instruct'
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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    /* CORS preflight — required, browser sends OPTIONS before every POST */
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const url = new URL(req.url)
    const isDialect = url.pathname === '/dialect'
    const model = MODEL_MAP[url.pathname]
    if (!model && !isDialect) {
      return new Response('Not found', { status: 404 })
    }

    const body = await req.text()

    /* Input size cap — abuse prevention, per CEO plan spec */
    if (body.length > 10_000) {
      return new Response('Input too large', { status: 400 })
    }

    let parsed: { inputs: string }
    try {
      parsed = JSON.parse(body) as { inputs: string }
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    /* Dialect: forward to the chat LLM router instead of a classification model */
    if (isDialect) {
      const chatRes = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: CHAT_MODEL,
          temperature: 0,
          max_tokens: 150,
          messages: [
            { role: 'system', content: DIALECT_SYSTEM_PROMPT },
            { role: 'user', content: parsed.inputs },
          ],
        }),
      })
      return new Response(await chatRes.text(), {
        status: chatRes.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    /* NER: inject aggregation_strategy=simple so HF does BIO→entity_group merge */
    const hfBody =
      url.pathname === '/ner'
        ? JSON.stringify({ inputs: parsed.inputs, parameters: { aggregation_strategy: 'simple' } })
        : body

    const hfRes = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: hfBody,
    })

    return new Response(await hfRes.text(), {
      status: hfRes.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  },
}
