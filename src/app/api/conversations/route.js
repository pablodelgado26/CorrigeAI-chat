import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromToken } from '@/utils/auth'

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    // Verificar autenticação
    const authResult = getUserFromToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const userId = authResult.data.userId

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request) {
  try {
    // Verificar autenticação
    const authResult = getUserFromToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const userId = authResult.data.userId
    const { title } = await request.json()

    const conversation = await prisma.conversation.create({
      data: {
        title: title || 'Nova Conversa',
        userId
      }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Erro ao criar conversa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Limpar todas as conversas
export async function DELETE() {
  try {
    await prisma.message.deleteMany()
    await prisma.conversation.deleteMany()

    return NextResponse.json({ message: 'Todas as conversas foram removidas' })
  } catch (error) {
    console.error('Erro ao limpar conversas:', error)
    return NextResponse.json(
      { error: 'Erro ao limpar conversas' },
      { status: 500 }
    )
  }
}
