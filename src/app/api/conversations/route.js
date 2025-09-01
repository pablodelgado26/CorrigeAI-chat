import { NextResponse } from 'next/server'
import prisma from '../lib/prisma.js'

// GET - Buscar todas as conversas
export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar conversas' },
      { status: 500 }
    )
  }
}

// POST - Criar nova conversa
export async function POST(request) {
  try {
    const { title } = await request.json()

    const conversation = await prisma.conversation.create({
      data: {
        title: title || 'Nova Conversa'
      }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Erro ao criar conversa:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conversa' },
      { status: 500 }
    )
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
