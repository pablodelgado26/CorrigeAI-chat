import { NextResponse } from 'next/server'
import prisma from '../../lib/prisma.js'

// GET - Buscar conversa específica com mensagens
export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
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
      { error: 'Erro ao buscar conversa' },
      { status: 500 }
    )
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
