const prisma = require('../../../lib/prisma')
const { verifyPassword, createSession, setSessionCookie } = require('../../../lib/auth')
const { rateLimit } = require('../../../lib/rateLimiter')
const { isEmail } = require('../../../lib/validate')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Rate limit login attempts per IP
  const rl = rateLimit(req, res, { key: 'login', windowMs: 60 * 1000, max: 6 })
  if (rl.limited) return res.status(429).json({ error: 'Too many login attempts' })

  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' })
  if (!isEmail(email)) return res.status(400).json({ error: 'Invalid email' })

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await verifyPassword(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = await createSession(user.id)
    setSessionCookie(res, token)

    return res.json({ ok: true, user: { id: user.id, email: user.email, role: user.role, orgId: user.orgId } })
  } catch (err) {
    console.error('login error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
const prisma = require('../../../../lib/prisma')
const { verifyPassword, createSession, setSessionCookie } = require('../../../../lib/auth')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' })

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await verifyPassword(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = await createSession(user.id)
    setSessionCookie(res, token)

    return res.json({ ok: true, user: { id: user.id, email: user.email, role: user.role, orgId: user.orgId } })
  } catch (err) {
    console.error('login error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
