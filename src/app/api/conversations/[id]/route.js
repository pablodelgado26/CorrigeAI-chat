import { NextResponse } from 'next/server'
import prisma from '../../lib/prisma.js'
import { getUserFromToken } from '@/utils/auth'

// GET - Buscar conversa específica com mensagens
export async function GET(request, { params }) {
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
    const { id } = await params

    const conversation = await prisma.conversation.findFirst({
      where: { 
        id,
        userId // Garantir que o usuário só veja suas próprias conversas
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Erro ao buscar conversa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Atualizar título da conversa
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const { title } = await request.json()

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { title }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Erro ao atualizar conversa:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar conversa' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar conversa específica
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    await prisma.conversation.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Conversa removida com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar conversa:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar conversa' },
      { status: 500 }
    )
  }
}
