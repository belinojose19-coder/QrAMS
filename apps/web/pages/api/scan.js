const prisma = require('../../lib/prisma')
const { getUserFromRequest } = require('../../lib/auth')
const { decrypt, verifyHmacSignature } = require('../../lib/qr')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { qrData, latitude, longitude } = req.body || {}
    if (!qrData) return res.status(400).json({ error: 'QR data is required' })

    // 1. Split and verify the QR signature
    const [encryptedPayload, signature] = qrData.split('.')
    if (!encryptedPayload || !signature) {
      return res.status(400).json({ error: 'Invalid QR format' })
    }

    if (!verifyHmacSignature(encryptedPayload, signature)) {
      return res.status(401).json({ error: 'Invalid or tampered QR code' })
    }

    // 2. Decrypt and parse payload
    const decryptedString = decrypt(encryptedPayload)
    if (!decryptedString) {
      return res.status(400).json({ error: 'Could not decrypt QR data' })
    }

    const payload = JSON.parse(decryptedString)
    const { sessionId, orgId, scanType, expiresAt } = payload

    // 3. Validate Expiry (accept number or ISO string)
    const expMs = typeof expiresAt === 'number' ? expiresAt : new Date(expiresAt).getTime()
    if (isNaN(expMs) || Date.now() > expMs) {
      return res.status(403).json({ error: 'This QR session has expired' })
    }

    // 4. Verify Session exists in DB
    const session = await prisma.qRSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return res.status(404).json({ error: 'QR session not found or already invalidated' })
    }

    // 5. Find the employee record for the logged-in user
    const employee = await prisma.employee.findFirst({
      where: {
        user_id: user.id,
        orgId: orgId,
      },
    })

    if (!employee) {
      return res.status(403).json({ error: 'User is not registered as an employee for this organization' })
    }

    // 6. Business Rule: 30-minute cooldown for the same scan type
    const lastLog = await prisma.dTRLog.findFirst({
      where: {
        employeeId: employee.id,
        type: scanType,
        logTimestamp: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 mins
        },
      },
      orderBy: { logTimestamp: 'desc' },
    })

    if (lastLog) {
      const lastTs = new Date(lastLog.logTimestamp).getTime()
      const diffMinutes = Math.ceil((Date.now() - lastTs) / (1000 * 60))
      return res.status(429).json({
        error: `Cooldown active. Please wait ${Math.max(0, 30 - diffMinutes)} more minutes before scanning ${scanType} again.`
      })
    }

    // 7. Business Rule: Max 4 logs per day (2 In, 2 Out)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const dailyCount = await prisma.dTRLog.count({
      where: {
        employeeId: employee.id,
        type: scanType,
        logTimestamp: {
          gte: todayStart,
        },
      },
    })

    if (dailyCount >= 2) {
      return res.status(403).json({ error: `Daily limit reached. You can only scan ${scanType} twice per day.` })
    }

    // 8. Create the DTR Log
    const log = await prisma.dTRLog.create({
      data: {
        employeeId: employee.id,
        qrSessionId: sessionId,
        type: scanType,
        logTimestamp: new Date(),
      },
    })

    return res.status(201).json({ 
      ok: true, 
      message: `Successfully logged ${scanType} at ${new Date().toLocaleTimeString()}`,
      logId: log.id 
    })

  } catch (err) {
    console.error('Scan Error:', err)
    return res.status(500).json({ error: 'Internal server error during scan processing' })
  }
}
