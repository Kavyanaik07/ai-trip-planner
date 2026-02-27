import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/reviews — fetch latest reviews for homepage
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, user_name, user_image, destination, review_text, rating, created_at')
      .order('created_at', { ascending: false })
      .limit(9)

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/reviews — submit a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_name, user_email, user_image, destination, review_text, rating, trip_id } = body

    if (!user_name || !user_email || !destination || !review_text || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
    }
    if (review_text.trim().length < 10) {
      return NextResponse.json({ error: 'Review too short' }, { status: 400 })
    }

    // Check if user already reviewed this trip
    if (trip_id) {
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('trip_id', trip_id)
        .eq('user_email', user_email)
        .single()
      if (existing) {
        return NextResponse.json({ error: 'You already reviewed this trip' }, { status: 409 })
      }
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({ user_name, user_email, user_image, destination, review_text, rating, trip_id })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
