import React, { useState } from 'react'

export default function EmployeeScan() {
  const [qrData, setQrData] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  async function handleScan(e) {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: '', message: '' })

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          qrData,
          latitude: 0, // In a real app, we'd use navigator.geolocation
          longitude: 0 
        }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Scan failed' })
      } else {
        setStatus({ type: 'success', message: data.message })
        setQrData('') // Clear input on success
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'Arial, sans-serif', maxWidth: 500, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Employee Scan</h1>
      
      <div style={{ 
        background: '#f9f9f9', 
        padding: 20, 
        borderRadius: 12, 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center' 
      }}>
        <p style={{ marginBottom: 16, color: '#666' }}>Enter the QR code string provided by your HRO</p>
        
        <form onSubmit={handleScan}>
          <input 
            style={{ 
              width: '100%', 
              padding: 12, 
              fontSize: '16px', 
              marginBottom: 16, 
              borderRadius: 8, 
              border: '1px solid #ccc' 
            }} 
            placeholder="Paste QR data here..." 
            value={qrData} 
            onChange={(e) => setQrData(e.target.value)} 
            required 
          />
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              width: '100%', 
              padding: 12, 
              fontSize: '16px', 
              fontWeight: 'bold', 
              backgroundColor: '#0070f3', 
              color: 'white', 
              border: 'none', 
              borderRadius: 8, 
              cursor: 'pointer' 
            }}
          >
            {loading ? 'Processing...' : 'Log Attendance'}
          </button>
        </form>

        {status.message && (
          <div style={{ 
            marginTop: 20, 
            padding: 12, 
            borderRadius: 8, 
            backgroundColor: status.type === 'success' ? '#d4edda' : '#f8d7da',
            color: status.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${status.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {status.message}
          </div>
        )}
      </div>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <a href="/api/auth/logout" style={{ color: '#666', fontSize: '14px' }}>Log out of account</a>
      </div>
    </main>
  )
}

export async function getServerSideProps(context) {
  const { req } = context
  const { getUserFromRequest } = require('../../lib/auth')
  const user = await getUserFromRequest(req)
  if (!user) {
    return { redirect: { destination: '/admin/login', permanent: false } }
  }
  return { props: { user } }
}
