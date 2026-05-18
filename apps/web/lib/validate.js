function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function isPassword(v) {
  return typeof v === 'string' && v.length >= 8
}

function isOrgName(v) {
  return typeof v === 'string' && v.trim().length >= 2
}

module.exports = { isEmail, isPassword, isOrgName }
