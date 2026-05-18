const prisma = require('../../../../lib/prisma')
const { hashPassword, createSession, setSessionCookie } = require('../../../../lib/auth')
const { rateLimit } = require('../../../../lib/rateLimiter')
const { isEmail, isPassword, isOrgName } = require('../../../../lib/validate')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Basic rate limiting per IP for register
  const rl = rateLimit(req, res, { key: 'register', windowMs: 15 * 60 * 1000, max: 5 })
  if (rl.limited) return res.status(429).json({ error: 'Too many requests' })

  const { orgName, email, password } = req.body || {}
  if (!orgName || !email || !password) return res.status(400).json({ error: 'Missing fields' })
  if (!isOrgName(orgName)) return res.status(400).json({ error: 'Invalid organization name' })
  if (!isEmail(email)) return res.status(400).json({ error: 'Invalid email' })
  if (!isPassword(password)) return res.status(400).json({ error: 'Password too short (min 8 chars)' })

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const codeBase = orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || `org-${Date.now()}`
    let code = codeBase
    let org = null
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        org = await prisma.organization.create({ data: { name: orgName, code } })
        break
      } catch (e) {
        // on unique constraint collisions, append suffix and retry
        code = `${codeBase}-${Math.random().toString(36).slice(2, 6)}`
      }
    }
    if (!org) return res.status(500).json({ error: 'Failed to create organization' })

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({ data: { email, password: passwordHash, orgId: org.id, role: 'admin' } })

    const token = await createSession(user.id)
    setSessionCookie(res, token)

    return res.status(201).json({ ok: true, user: { id: user.id, email: user.email, orgId: org.id, role: user.role } })
  } catch (err) {
    console.error('register error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
