import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromToken } from '@/utils/auth'

const prisma = new PrismaClient()

export async function POST(request, { params }) {
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
    const { id: conversationId } = await params
    const messageData = await request.json()

    // Verificar se a conversa pertence ao usuário
    const conversation = await prisma.conversation.findFirst({
      where: { 
        id: conversationId,
        userId 
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    // Filtrar campos válidos para o Prisma
    const { type, image, generatedImageUrl, ...validMessageData } = messageData
    
    const message = await prisma.message.create({
      data: {
        ...validMessageData,
        conversationId,
        userId,
        role: messageData.type === 'USER' ? 'user' : 'assistant',
        imageUrl: messageData.image || messageData.generatedImageUrl || null
      }
    })

    // Atualizar timestamp da conversa
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Erro ao criar mensagem:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET - Buscar mensagens da conversa
export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { timestamp: 'asc' }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar mensagens' },
      { status: 500 }
    )
  }
}
