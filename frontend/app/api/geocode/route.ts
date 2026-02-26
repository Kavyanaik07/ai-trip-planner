import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}&language=en`,
    )

    const data = await res.json()

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ error: 'No results' }, { status: 404 })
    }

    // Parse Google response into same shape the plan page expects
    const components = data.results[0].address_components
    const get = (type: string) =>
      components.find((c: any) => c.types.includes(type))?.long_name || ''

    const address = {
      city:    get('locality') || get('administrative_area_level_2'),
      town:    get('sublocality_level_1'),
      state:   get('administrative_area_level_1'),
      country: get('country'),
      region:  get('administrative_area_level_1'),
    }

    return NextResponse.json({ address })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
