const prisma = require('../../../../lib/prisma')
const { getUserFromRequest } = require('../../../../lib/auth')
const { encrypt, createHmacSignature } = require('../../../../lib/qr')
const crypto = require('crypto')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await getUserFromRequest(req)
    if (!user || (user.role !== 'hro' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden: HRO or Admin access required' })
    }

    const { orgId, scanType, sessionDate } = req.body || {}
    
    if (!orgId || !scanType || !sessionDate) {
      return res.status(400).json({ error: 'Missing required fields: orgId, scanType, sessionDate' })
    }

    if (!['in', 'out'].includes(scanType)) {
      return res.status(400).json({ error: 'Invalid scanType. Must be "in" or "out"' })
    }

    // Validate sessionDate is not in the future
    const today = new Date().toISOString().split('T')[0]
    if (sessionDate > today) {
      return res.status(400).json({ error: 'Cannot generate QR for future dates' })
    }

    // Check if an active QR session already exists for this date and type to avoid duplicates
    const existingSession = await prisma.qRSession.findFirst({
      where: {
        orgId,
        sessionDate: new Date(sessionDate),
        scanType,
        expiresAt: { gt: new Date() },
      },
    })

    if (existingSession) {
      // We return the existing session instead of creating a new one
      const payloadString = JSON.stringify({
        sessionId: existingSession.id,
        orgId,
        scanType,
        issuedAt: existingSession.createdAt.getTime(),
        expiresAt: existingSession.expiresAt.getTime(),
        nonce: 'existing-session',
      })
      const encryptedPayload = encrypt(payloadString)
      const signature = createHmacSignature(encryptedPayload)
      
      return res.status(200).json({ 
        ok: true, 
        qrCodeData: `${encryptedPayload}.${signature}`, 
        expiresAt: existingSession.expiresAt,
        message: 'Existing active session retrieved'
      })
    }

    // Generate a new unique session
    const sessionId = crypto.randomUUID()
    const issuedAt = Date.now()
    const expiresAt = issuedAt + (24 * 60 * 60 * 1000) // 24 hours validity
    const nonce = crypto.randomBytes(16).toString('hex')

    const qrPayload = {
      sessionId,
      orgId,
      scanType,
      issuedAt,
      expiresAt,
      nonce,
    }

    const payloadString = JSON.stringify(qrPayload)
    const encryptedPayload = encrypt(payloadString)
    const signature = createHmacSignature(encryptedPayload)

    // Store session in Neon DB
    await prisma.qRSession.create({
      data: {
        id: sessionId,
        orgId,
        tokenHash: encryptedPayload,
        tokenSignature: signature,
        sessionDate: new Date(sessionDate),
        scanType,
        expiresAt: new Date(expiresAt),
      },
    })

    return res.status(201).json({ 
      ok: true, 
      qrCodeData: `${encryptedPayload}.${signature}`, 
      expiresAt: new Date(expiresAt).toISOString() 
    })
  } catch (err) {
    console.error('QR Generation Error:', err)
    return res.status(500).json({ error: 'Internal server error during QR generation' })
  }
}
