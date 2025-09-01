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
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return { success: false, error: 'Token não fornecido' }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key')
    return { success: true, data: decoded }
  } catch (error) {
    return { success: false, error: 'Token inválido' }
  }
}
