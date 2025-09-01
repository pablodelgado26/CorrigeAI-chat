// Script de teste para verificar se o Prisma está funcionando
import { prisma } from './src/lib/prisma.js'

async function testDatabase() {
  try {
    console.log('🧪 Testando conexão com o banco de dados...')
    
    // Teste 1: Listar conversas existentes
    const conversations = await prisma.conversation.findMany()
    console.log(`✅ Conversas encontradas: ${conversations.length}`)
    
    // Teste 2: Criar uma conversa de teste
    const testConversation = await prisma.conversation.create({
      data: {
        title: 'Teste de Conexão'
      }
    })
    console.log(`✅ Conversa de teste criada: ${testConversation.id}`)
    
    // Teste 3: Criar uma mensagem de teste
    const testMessage = await prisma.message.create({
      data: {
        content: 'Esta é uma mensagem de teste',
        type: 'USER',
        conversationId: testConversation.id
      }
    })
    console.log(`✅ Mensagem de teste criada: ${testMessage.id}`)
    
    // Teste 4: Buscar conversa com mensagens
    const conversationWithMessages = await prisma.conversation.findUnique({
      where: { id: testConversation.id },
      include: { messages: true }
    })
    console.log(`✅ Conversa recuperada com ${conversationWithMessages.messages.length} mensagens`)
    
    // Limpar dados de teste
    await prisma.message.delete({ where: { id: testMessage.id } })
    await prisma.conversation.delete({ where: { id: testConversation.id } })
    console.log('✅ Dados de teste removidos')
    
    console.log('🎉 Todos os testes passaram! O banco de dados está funcionando corretamente.')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
