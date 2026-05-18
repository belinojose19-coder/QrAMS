import React, { useState } from 'react'
import { useRouter } from 'next/router'

export default function HroDashboard({ user }) {
  const [orgId, setOrgId] = useState('')
  const [scanType, setScanType] = useState('in')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  async function generateQR(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setQrData(null)

    try {
      const res = await fetch('/api/hro/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, scanType, sessionDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate QR')
      setQrData(data.qrCodeData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>HRO Dashboard</h1>
      <p>Welcome, {user.email}</p>
      
      <div style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8, maxWidth: 400 }}>
        <h3 style={{ marginTop: 0 }}>Generate Attendance QR</h3>
        <form onSubmit={generateQR}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block' }}>Organization ID:</label>
            <input 
              style={{ width: '100%', padding: 8 }} 
              value={orgId} 
              onChange={(e) => setOrgId(e.target.value)} 
              placeholder="Enter Org UUID" 
              required 
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block' }}>Scan Type:</label>
            <select style={{ width: '100%', padding: 8 }} value={scanType} onChange={(e) => setScanType(e.target.value)}>
              <option value="in">Time In / Break In</option>
              <option value="out">Break Out / Time Out</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block' }}>Date:</label>
            <input 
              type="date" 
              style={{ width: '100%', padding: 8 }} 
              value={sessionDate} 
              onChange={(e) => setSessionDate(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, cursor: 'pointer' }}>
            {loading ? 'Generating...' : 'Generate QR Code'}
          </button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      </div>

      {qrData && (
        <div style={{ marginTop: 24, textAlign: 'center', border: '2px dashed #000', padding: 20, display: 'inline-block' }}>
          <h3 style={{ marginTop: 0 }}>Scan Me!</h3>
          <div style={{ background: '#eee', padding: 20, wordBreak: 'break-all', fontFamily: 'monospace' }}>
            {qrData}
          </div>
          <p style={{ fontSize: '12px', color: '#666' }}>(In a real app, this string would be a QR image)</p>
          <p><strong style={{ textTransform: 'uppercase' }}>{scanType}</strong> | <strong style={{ textTransform: 'uppercase' }}>{sessionDate}</strong></p>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <a href="/api/auth/logout" style={{ color: 'red' }}>Log out</a>
      </div>
    </main>
  )
}

export async function getServerSideProps(context) {
  const { req } = context
  const { getUserFromRequest } = require('../../lib/auth')
  const user = await getUserFromRequest(req)
  if (!user || (user.role !== 'hro' && user.role !== 'admin')) {
    return { redirect: { destination: '/hro/login', permanent: false } }
  }
  return { props: { user: { id: user.id, email: user.email, role: user.role } } }
}

