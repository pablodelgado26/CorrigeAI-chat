import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Middleware para verificar autenticação JWT
 * @param {Request} request - Request object
 * @returns {Object} Dados do usuário ou erro
 */
export async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return {
        success: false,
        error: 'Token de autenticação necessário',
        status: 401
      }
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return {
        success: false,
        error: 'Usuário não encontrado',
        status: 404
      }
    }

    return {
      success: true,
      user,
      decoded
    }

  } catch (error) {
    console.error('Erro na verificação de autenticação:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return {
        success: false,
        error: 'Token inválido',
        status: 401
      }
    }
    
    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        error: 'Token expirado',
        status: 401
      }
    }

    return {
      success: false,
      error: 'Erro interno na autenticação',
      status: 500
    }
  }
}

/**
 * Middleware para verificar se usuário é admin
 * @param {Request} request - Request object
 * @returns {Object} Dados do usuário admin ou erro
 */
export async function verifyAdmin(request) {
  const authResult = await verifyAuth(request)
  
  if (!authResult.success) {
    return authResult
  }

  if (authResult.user.role !== 'ADMIN') {
    return {
      success: false,
      error: 'Acesso negado. Apenas administradores.',
      status: 403
    }
  }

  return authResult
}

/**
 * Verifica se usuário pode acessar recurso (próprio ou admin)
 * @param {Request} request - Request object
 * @param {string} resourceUserId - ID do usuário dono do recurso
 * @returns {Object} Resultado da verificação
 */
export async function verifyResourceAccess(request, resourceUserId) {
  const authResult = await verifyAuth(request)
  
  if (!authResult.success) {
    return authResult
  }

  const isOwner = authResult.user.id === resourceUserId
  const isAdmin = authResult.user.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: 'Acesso negado a este recurso',
      status: 403
    }
  }

  return {
    ...authResult,
    isOwner,
    isAdmin
  }
}

/**
 * Gera token JWT
 * @param {Object} payload - Dados para incluir no token
 * @param {string} expiresIn - Tempo de expiração
 * @returns {string} Token JWT
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn }
  )
}

/**
 * Formata resposta de erro de autenticação
 * @param {string} message - Mensagem de erro
 * @param {number} status - Status HTTP
 * @returns {Response} Response com erro
 */
export function authErrorResponse(message, status = 401) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}
