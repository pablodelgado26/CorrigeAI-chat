import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request) {
  // Rotas que precisam de autenticação
  const protectedRoutes = ['/']
  
  // Rotas de autenticação (públicas)
  const authRoutes = ['/auth/login', '/auth/register']
  
  // Rotas da API que não precisam de auth
  const publicApiRoutes = ['/api/auth/login', '/api/auth/register']
  
  const { pathname } = request.nextUrl
  
  // Permitir rotas da API de auth
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  const isAuthRoute = authRoutes.includes(pathname)
  
  const token = request.cookies.get('authToken')?.value
  
  console.log('Middleware - pathname:', pathname, 'token:', !!token, 'isProtectedRoute:', isProtectedRoute)
  
  // Se é uma rota protegida e não tem token
  if (isProtectedRoute && !token) {
    console.log('Redirecionando para login - sem token')
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // Se tem token, verificar se é válido
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key')
      
      // Se está tentando acessar rotas de auth com token válido, redirecionar para home
      if (isAuthRoute) {
        console.log('Redirecionando para home - já logado')
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      console.log('Token inválido, removendo cookie')
      // Token inválido, remover e redirecionar para login se necessário
      const response = isProtectedRoute 
        ? NextResponse.redirect(new URL('/auth/login', request.url))
        : NextResponse.next()
      
      response.cookies.delete('authToken')
      return response
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|sobre).*)',
  ],
}
