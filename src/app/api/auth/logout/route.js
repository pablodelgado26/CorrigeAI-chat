import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/auth/logout - Logout do usuário
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação necessário' },
        { status: 401 }
      )
    }

    // Verificar se o token é válido
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      
      // Atualizar timestamp do usuário
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { updatedAt: new Date() }
      })
    } catch (tokenError) {
      // Token inválido, mas ainda processamos o logout
      console.log('Token inválido no logout:', tokenError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    })

  } catch (error) {
    console.error('Erro no logout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
