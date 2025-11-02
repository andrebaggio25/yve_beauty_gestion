import { Navigation } from '@/components/Navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NotificationCenter } from '@/components/NotificationCenter'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        <Navigation />
        <main className="flex-1 md:ml-64 mb-20 md:mb-0 overflow-y-auto">
          {/* Header with notifications */}
          <div className="hidden md:flex items-center justify-end p-4 border-b border-gray-200 bg-white">
            <NotificationCenter />
          </div>
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
