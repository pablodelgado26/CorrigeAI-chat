import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromToken } from '@/utils/auth'

const prisma = new PrismaClient()

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

// PATCH - Editar título da conversa
export async function PATCH(request, { params }) {
  try {
    console.log('🔧 PATCH: Iniciando edição de título')
    
    // Verificar autenticação
    const authResult = getUserFromToken(request)
    if (!authResult.success) {
      console.log('❌ PATCH: Falha na autenticação')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const userId = authResult.data.userId
    const { id } = await params
    const { title } = await request.json()

    console.log('📝 PATCH: Dados recebidos:', { id, title, userId })

    // Verificar se a conversa pertence ao usuário
    const existingConversation = await prisma.conversation.findFirst({
      where: { 
        id,
        userId
      }
    })

    if (!existingConversation) {
      console.log('❌ PATCH: Conversa não encontrada')
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    console.log('🔍 PATCH: Conversa encontrada, atualizando...')

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { 
        title: title.trim(),
        updatedAt: new Date()
      }
    })

    console.log('✅ PATCH: Título atualizado com sucesso')
    return NextResponse.json(conversation)
  } catch (error) {
    console.error('❌ PATCH: Erro ao editar título da conversa:', error)
    return NextResponse.json(
      { error: 'Erro ao editar título da conversa' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Deletar conversa específica
export async function DELETE(request, { params }) {
  try {
    console.log('🗑️ DELETE: Iniciando exclusão de conversa')
    
    // Verificar autenticação
    const authResult = getUserFromToken(request)
    if (!authResult.success) {
      console.log('❌ DELETE: Falha na autenticação')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const userId = authResult.data.userId
    const { id } = await params

    console.log('🔍 DELETE: Dados recebidos:', { id, userId })

    // Verificar se a conversa pertence ao usuário antes de deletar
    const conversation = await prisma.conversation.findFirst({
      where: { 
        id,
        userId
      }
    })

    if (!conversation) {
      console.log('❌ DELETE: Conversa não encontrada')
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    console.log('🔍 DELETE: Conversa encontrada, deletando...')

    // Deletar a conversa
    await prisma.conversation.delete({
      where: { id }
    })

    console.log('✅ DELETE: Conversa deletada com sucesso')
    return NextResponse.json({ message: 'Conversa removida com sucesso' })
  } catch (error) {
    console.error('❌ DELETE: Erro ao deletar conversa:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar conversa' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
