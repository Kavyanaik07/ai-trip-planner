import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email) return NextResponse.json([])

  // Find user by email
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (!user) return NextResponse.json([])

  // Get all trips for this user
  const { data: trips, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json([])
  }

  return NextResponse.json(trips)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    destination, startDate, endDate, budget,
    currency, travelers, interests, travelStyle, userEmail
  } = body

  if (!destination || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Upsert user (create if doesn't exist)
    let userId: string | null = null

    if (userEmail) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single()

      if (existingUser) {
        userId = existingUser.id
      } else {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({ email: userEmail, name: body.userName || null })
          .select('id')
          .single()

        if (userError) {
          console.error('User creation error:', userError)
        } else {
          userId = newUser.id
        }
      }
    }

    // Insert trip into Supabase
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        user_id: userId,
        destination,
        start_date: startDate,
        end_date: endDate,
        budget: budget ? parseFloat(budget) : null,
        currency: currency || 'USD',
        travelers: travelers ?? 1,
        interests: interests ?? [],
        travel_style: travelStyle ?? 'balanced',
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Trip insert error:', error)
      // Fallback: return in-memory trip so app still works
      return NextResponse.json({
        id: crypto.randomUUID(),
        destination,
        startDate,
        endDate,
        budget: budget ? parseFloat(budget) : null,
        currency: currency || 'USD',
        travelers: travelers ?? 1,
        interests: interests ?? [],
        travelStyle: travelStyle ?? 'balanced',
        status: 'draft',
        createdAt: new Date().toISOString(),
      }, { status: 201 })
    }

    // Return trip in consistent camelCase format
    return NextResponse.json({
      id: trip.id,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      budget: trip.budget,
      currency: trip.currency,
      travelers: trip.travelers,
      interests: trip.interests,
      travelStyle: trip.travel_style,
      status: trip.status,
      createdAt: trip.created_at,
    }, { status: 201 })

  } catch (err: any) {
    console.error('POST /api/trips error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
