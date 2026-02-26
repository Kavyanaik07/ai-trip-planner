import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Call AI service to generate itinerary
    const res = await fetch(`${process.env.AI_SERVICE_URL}/generate-itinerary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.AI_SERVICE_SECRET || 'abc123',
      },
      body: JSON.stringify(body),
    })

    const itinerary = await res.json()
    if (!res.ok) throw new Error(itinerary.error || 'Generation failed')

    // Save to Supabase
    await supabase
      .from('itineraries')
      .upsert({ trip_id: id, ...itinerary, updated_at: new Date().toISOString() })

    return NextResponse.json(itinerary)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}