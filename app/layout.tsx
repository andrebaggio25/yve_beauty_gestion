import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/auth-context'
import { FaviconUpdater } from '@/components/FaviconUpdater'

export const metadata: Metadata = {
  title: 'Yve Gestión',
  description: 'Sistema de gestión financiera y administrativa',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning className="font-sans antialiased">
        <AuthProvider>
          <FaviconUpdater />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
