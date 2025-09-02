import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// GET /api/users/profile - Buscar perfil do usuário logado
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação necessário' },
        { status: 401 }
      )
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Buscar perfil completo do usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        conversations: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { messages: true }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 20
        },
        _count: {
          select: {
            conversations: true,
            messages: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Calcular estatísticas
    const stats = {
      totalConversations: user._count.conversations,
      totalMessages: user._count.messages,
      averageMessagesPerConversation: user._count.conversations > 0 
        ? Math.round(user._count.messages / user._count.conversations * 100) / 100 
        : 0,
      memberSince: user.createdAt,
      lastActivity: user.updatedAt
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        stats
      }
    })

  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
