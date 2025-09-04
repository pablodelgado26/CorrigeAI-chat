import jwt from 'jsonwebtoken'

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key')
    return { success: true, data: decoded }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export function getUserFromToken(request) {
  try {
    const authHeader = request.headers.get('authorization')
    console.log('🔐 Auth Header recebido:', authHeader)
    
    const token = authHeader?.replace('Bearer ', '')
    console.log('🎫 Token extraído:', token ? 'SIM' : 'NÃO')
    
    if (!token) {
      console.log('❌ Token não fornecido')
      return { success: false, error: 'Token não fornecido' }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key')
    console.log('✅ Token válido, userId:', decoded.userId)
    return { success: true, data: decoded }
  } catch (error) {
    console.log('❌ Erro ao verificar token:', error.message)
    return { success: false, error: 'Token inválido' }
  }
}
