import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma.js'

// POST - Adicionar mensagem à conversa
export async function POST(request, { params }) {
  try {
    const { id } = await params
    const messageData = await request.json()

    const message = await prisma.message.create({
      data: {
        content: messageData.content,
        type: messageData.type,
        image: messageData.image || null,
        generatedImageUrl: messageData.generatedImageUrl || null,
        hasPdfDownload: messageData.hasPdfDownload || false,
        pdfContent: messageData.pdfContent || null,
        isProofAnalysis: messageData.isProofAnalysis || false,
        conversationId: id
      }
    })

    // Atualizar timestamp da conversa
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Erro ao adicionar mensagem:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar mensagem' },
      { status: 500 }
    )
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
