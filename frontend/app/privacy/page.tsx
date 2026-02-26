import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4', padding: '80px 40px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,700;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <Link href="/auth/signin" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: 'rgba(26,22,18,0.42)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '48px' }}>
          ← Back
        </Link>

        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '40px', fontWeight: 700, color: '#1a1612', marginBottom: '8px', lineHeight: 1.1 }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: 'rgba(26,22,18,0.38)', marginBottom: '48px' }}>
          Last updated: June 2025 · thisWay (thiswayletsgo.com)
        </p>

        {[
          {
            title: 'What we collect',
            body: 'We collect your email address (for login), and the travel preferences you provide when planning a trip — destination, dates, budget, energy level, and travel style. We do not collect payment information.',
          },
          {
            title: 'How we use it',
            body: 'Your data is used solely to generate personalised travel itineraries. We do not use your data for advertising, and we never sell it to third parties.',
          },
          {
            title: 'Authentication',
            body: 'We use Google OAuth and NextAuth for authentication. No passwords are stored. Authentication tokens are encrypted and stored securely.',
          },
          {
            title: 'Data storage',
            body: 'Your trip data is stored in Supabase (hosted in the Asia-Pacific region). Data is encrypted at rest and in transit.',
          },
          {
            title: 'Cookies',
            body: 'We use session cookies for authentication only. No tracking or advertising cookies are used.',
          },
          {
            title: 'Your rights',
            body: 'You can request deletion of your account and all associated data at any time by emailing hello@thiswayletsgo.com. We will process deletion requests within 14 days.',
          },
          {
            title: 'Third-party services',
            body: 'We use Google (authentication), Supabase (database), and Gemini API (AI itinerary generation). Each service is governed by their own privacy policies. We share only the minimum data necessary.',
          },
          {
            title: 'Contact',
            body: 'Privacy questions or data requests: hello@thiswayletsgo.com.',
          },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: '36px', paddingBottom: '36px', borderBottom: i < 7 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '20px', fontWeight: 700, color: '#1a1612', marginBottom: '10px' }}>{s.title}</h2>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '15px', color: 'rgba(26,22,18,0.62)', lineHeight: 1.75, fontWeight: 300 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
