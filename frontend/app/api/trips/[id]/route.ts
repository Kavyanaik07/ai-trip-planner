import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for server-side operations — bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// DELETE /api/trips/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete itinerary first (foreign key)
    await supabase.from('itineraries').delete().eq('trip_id', id)

    // Delete trip
    const { error } = await supabase.from('trips').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete trip error:', error)
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 })
  }
}

// GET /api/trips/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json(trip)
  } catch (error) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }
}
