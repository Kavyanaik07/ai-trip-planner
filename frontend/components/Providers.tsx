'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-body)',
            borderRadius: '12px',
            border: '1px solid #e5d9c7',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          },
          success: { iconTheme: { primary: '#357538', secondary: 'white' } },
          error:   { iconTheme: { primary: '#f95340', secondary: 'white' } },
        }}
      />
    </SessionProvider>
  )
}