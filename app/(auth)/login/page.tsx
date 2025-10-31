'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      router.replace('/dashboard')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login'
      setError(message)
      setLoading(false)
    }
    // Note: não setamos loading(false) no sucesso pois o redirect vai limpar o componente
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Yve Gestión</h1>
          <p className="text-gray-600 mb-8">Sistema de gestão financeira</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-card hover:shadow-hover"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-600 text-sm">
            <p>Não tem uma conta? <Link href="/register" className="text-primary hover:text-primary-hover font-medium">Registre-se</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
