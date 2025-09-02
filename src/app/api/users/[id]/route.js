import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// GET /api/users/[id] - Buscar usuário por ID
export async function GET(request, { params }) {
  try {
    const { id } = params
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
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões (próprio usuário ou admin)
    if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id },
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
            _count: {
              select: { messages: true }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 10
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

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    
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

// PUT /api/users/[id] - Atualizar usuário
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const { email, name, password, role } = await request.json()
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
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões
    const isOwnProfile = currentUser.id === id
    const isAdmin = currentUser.role === 'ADMIN'
    
    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Validações
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        )
      }
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Apenas admin pode alterar role
    if (role && !isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem alterar roles' },
        { status: 403 }
      )
    }

    // Preparar dados para atualização
    const updateData = {}
    
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (role && isAdmin) updateData.role = role.toUpperCase()
    
    if (password) {
      const saltRounds = 12
      updateData.password = await bcrypt.hash(password, saltRounds)
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    })

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 409 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Deletar usuário
export async function DELETE(request, { params }) {
  try {
    const { id } = params
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
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Apenas admin pode deletar usuários (exceto próprio perfil)
    const isOwnProfile = currentUser.id === id
    const isAdmin = currentUser.role === 'ADMIN'
    
    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Deletar usuário (cascade deletará conversas e mensagens)
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
