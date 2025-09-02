import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/auth/refresh - Refresh do token JWT
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

    // Verificar token (permite token expirado para refresh)
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Token expirado, tentar decodificar sem verificar expiração
        decoded = jwt.decode(token)
        if (!decoded) {
          return NextResponse.json(
            { error: 'Token inválido' },
            { status: 401 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        )
      }
    }

    // Buscar usuário atualizado
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Gerar novo token
    const newToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    )

    // Atualizar timestamp do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: 'Token renovado com sucesso',
      user: {
        ...user,
        lastActivity: new Date()
      },
      token: newToken
    })

  } catch (error) {
    console.error('Erro no refresh:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
