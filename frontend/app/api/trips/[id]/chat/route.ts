import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Sanitize history — only keep role + content fields Python expects
    const history = (body.history || []).slice(-10).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || ''),
    }))

    // Sanitize trip_context — only pass what Python model needs
    const trip_context = {
      destination: body.trip_context?.destination || '',
      startDate: body.trip_context?.startDate || '',
      endDate: body.trip_context?.endDate || '',
      travelers: Number(body.trip_context?.travelers) || 1,
      currency: body.trip_context?.currency || 'USD',
    }

    const payload = {
      message: String(body.message || ''),
      trip_context,
      history,
      // Don't send current_itinerary — it can be large and cause 400s
    }

    const res = await fetch(`${process.env.AI_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.AI_SERVICE_SECRET || '',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('AI service error:', res.status, data)
      return NextResponse.json(
        { response: 'Sorry, something went wrong.', error: data },
        { status: 200 } // Return 200 so frontend shows the message
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Chat route error:', error.message)
    return NextResponse.json(
      { response: 'Could not connect. Make sure the AI service is running.' },
      { status: 200 }
    )
  }
}
