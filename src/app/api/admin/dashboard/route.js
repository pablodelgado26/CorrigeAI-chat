import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromToken } from '@/utils/auth'

const prisma = new PrismaClient()

// GET /api/admin/dashboard - Dashboard administrativo
export async function GET(request) {
  try {
    // Verificar autenticação usando o middleware
    const authResult = getUserFromToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { id: authResult.data.userId },
      select: { id: true, role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    // Buscar estatísticas do sistema
    const [
      totalUsers,
      totalConversations,
      totalMessages,
      activeUsersLast30Days,
      recentUsers,
      topActiveUsers,
      conversationsToday,
      messagesLast7Days
    ] = await Promise.all([
      // Total de usuários
      prisma.user.count(),
      
      // Total de conversas
      prisma.conversation.count(),
      
      // Total de mensagens
      prisma.message.count(),
      
      // Usuários ativos nos últimos 30 dias
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Usuários recentes (últimos 10)
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              conversations: true,
              messages: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Usuários mais ativos (por número de mensagens)
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              conversations: true,
              messages: true
            }
          }
        },
        orderBy: {
          messages: {
            _count: 'desc'
          }
        },
        take: 10
      }),
      
      // Conversas criadas hoje
      prisma.conversation.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Mensagens dos últimos 7 dias (agrupadas por dia)
      prisma.message.groupBy({
        by: ['createdAt'],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    // Calcular crescimento de usuários (últimos 30 dias vs 30 dias anteriores)
    const usersLast30Days = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })

    const usersPrevious30Days = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })

    const userGrowthRate = usersPrevious30Days > 0 
      ? ((usersLast30Days - usersPrevious30Days) / usersPrevious30Days * 100).toFixed(1)
      : 100

    // Processar dados de mensagens por dia
    const messagesByDay = messagesLast7Days.reduce((acc, item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + item._count
      return acc
    }, {})

    // Estatísticas gerais
    const stats = {
      overview: {
        totalUsers,
        totalConversations,
        totalMessages,
        activeUsersLast30Days,
        conversationsToday,
        userGrowthRate: `${userGrowthRate}%`,
        averageMessagesPerUser: totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0,
        averageConversationsPerUser: totalUsers > 0 ? Math.round(totalConversations / totalUsers) : 0
      },
      growth: {
        newUsersLast30Days: usersLast30Days,
        newUsersPrevious30Days: usersPrevious30Days,
        growthRate: userGrowthRate
      },
      activity: {
        messagesByDay,
        conversationsToday
      },
      users: {
        recent: recentUsers,
        topActive: topActiveUsers
      }
    }

    return NextResponse.json({
      success: true,
      dashboard: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar dashboard:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
