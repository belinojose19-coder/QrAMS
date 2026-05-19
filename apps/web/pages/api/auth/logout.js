const { clearSession } = require('../../../lib/auth')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await clearSession(req, res)
    return res.json({ ok: true })
  } catch (err) {
    console.error('logout error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
