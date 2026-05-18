const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const cookie = require('cookie')
const prisma = require('./prisma')

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'qrams_session'
const SESSION_TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || '7', 10)

async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function createSession(userId) {
  const token = crypto.randomBytes(48).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
  await prisma.sessionToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })
  return token
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production'
  const cookieStr = cookie.serialize(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  })
  res.setHeader('Set-Cookie', cookieStr)
}

async function getTokenFromRequest(req) {
  const cookies = cookie.parse(req.headers.cookie || '')
  const token = cookies[SESSION_COOKIE_NAME]
  return token || null
}

async function getUserFromRequest(req) {
  const token = await getTokenFromRequest(req)
  if (!token) return null
  const tokenHash = hashToken(token)
  const session = await prisma.sessionToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })
  if (!session) return null
  if (new Date(session.expiresAt) < new Date()) {
    try {
      await prisma.sessionToken.delete({ where: { tokenHash } })
    } catch (e) {
      // ignore
    }
    return null
  }
  return session.user
}

async function clearSession(req, res) {
  const token = await getTokenFromRequest(req)
  if (token) {
    const tokenHash = hashToken(token)
    try {
      await prisma.sessionToken.delete({ where: { tokenHash } })
    } catch (e) {
      // ignore
    }
  }
  const cookieStr = cookie.serialize(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })
  res.setHeader('Set-Cookie', cookieStr)
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  setSessionCookie,
  getUserFromRequest,
  clearSession,
  getTokenFromRequest,
}
