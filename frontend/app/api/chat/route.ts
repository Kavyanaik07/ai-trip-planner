import { NextRequest, NextResponse } from 'next/server'

// Proxies to the ai-service /chat endpoint which already runs Gemini
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    // Build history (all but last message) and extract current message
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }))
    const lastMessage = messages[messages.length - 1]

    const res = await fetch(`${process.env.AI_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.AI_SERVICE_SECRET || 'abc123',
      },
      body: JSON.stringify({
        message: lastMessage.content,
        trip_context: {}, // general assistant — no specific trip context
        history,
      }),
    })

    if (!res.ok) {
      throw new Error(`AI service responded with ${res.status}`)
    }

    const data = await res.json()

    return NextResponse.json({ message: data.response })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}