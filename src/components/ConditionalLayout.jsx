'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar/index.jsx'
import Footer from './Footer/index.jsx'

export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth/')

  if (isAuthPage) {
    // Para páginas de autenticação, retorna apenas o conteúdo
    return (
      <div className="auth-page-layout">
        {children}
      </div>
    )
  }

  // Para outras páginas, retorna o layout completo
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}
