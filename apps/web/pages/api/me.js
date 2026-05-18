const { getUserFromRequest } = require('../lib/auth')

export default async function handler(req, res) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Not authenticated' })
    return res.json({ ok: true, user: { id: user.id, email: user.email, role: user.role, orgId: user.orgId } })
  } catch (err) {
    console.error('me error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
