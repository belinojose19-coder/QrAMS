const crypto = require('crypto')

const ENC_KEY = process.env.QR_ENCRYPTION_KEY || '' // base64 or hex
const HMAC_KEY = process.env.QR_SECRET_KEY || ''

function ensureKeys() {
  if (!ENC_KEY || !HMAC_KEY) {
    throw new Error('Missing QR encryption or HMAC key. Set QR_ENCRYPTION_KEY and QR_SECRET_KEY in env')
  }
}

function _deriveKey(encKey) {
  // Accept base64 or hex; normalize to Buffer of length 32
  let b
  try {
    b = Buffer.from(encKey, 'base64')
    if (b.length === 32) return b
  } catch (e) {}
  try {
    b = Buffer.from(encKey, 'hex')
    if (b.length === 32) return b
  } catch (e) {}
  // fallback: derive 32 bytes from provided string
  return crypto.createHash('sha256').update(encKey).digest()
}

function encrypt(plainText) {
  ensureKeys()
  const key = _deriveKey(ENC_KEY)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // store as base64: iv(12) || tag(16) || ciphertext
  return Buffer.concat([iv, tag, ciphertext]).toString('base64')
}

function decrypt(token) {
  ensureKeys()
  try {
    const key = _deriveKey(ENC_KEY)
    const data = Buffer.from(token, 'base64')
    const iv = data.slice(0, 12)
    const tag = data.slice(12, 28)
    const ciphertext = data.slice(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return plain.toString('utf8')
  } catch (e) {
    return null
  }
}

function createHmacSignature(payload) {
  ensureKeys()
  const h = crypto.createHmac('sha256', HMAC_KEY)
  h.update(payload)
  return h.digest('hex')
}

function verifyHmacSignature(payload, signature) {
  ensureKeys()
  if (!signature) return false
  const expected = createHmacSignature(payload)
  // constant time compare
  try {
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(signature, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch (e) {
    return false
  }
}

module.exports = { encrypt, decrypt, createHmacSignature, verifyHmacSignature }
