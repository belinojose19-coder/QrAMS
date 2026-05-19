import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function DTRViewer() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/dtr/logs')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch logs')
        setLogs(data.logs)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  return (
    <main style={{ padding: 24, fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>My Attendance Logs</h1>
        <a href="/scan" style={{ padding: '8px 16px', backgroundColor: '#0070f3', color: 'white', borderRadius: 6, textDecoration: 'none', fontWeight: 'bold' }}>
          Go to Scan
        </a>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading your logs...</div>
      ) : error ? (
        <div style={{ color: 'red', padding: 20, border: '1px solid red', borderRadius: 8 }}>
          {error}
        </div>
      ) : (
        <div>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              No logs found. Start scanning!
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: 12 }}>Date</th>
                  <th style={{ padding: 12 }}>Time</th>
                  <th style={{ padding: 12 }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 12 }}>{new Date(log.logTimestamp).toLocaleDateString()}</td>
                    <td style={{ padding: 12 }}>{new Date(log.logTimestamp).toLocaleTimeString()}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        backgroundColor: log.type === 'in' ? '#d4edda' : '#f8d7da',
                        color: log.type === 'in' ? '#155724' : '#721c24'
                      }}>
                        {log.type.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <a href="/api/auth/logout" style={{ color: '#666', fontSize: '14px' }}>Log out</a>
      </div>
    </main>
  )
}

export async function getServerSideProps(context) {
  const { req } = context
  const { getUserFromRequest } = require('../lib/auth')
  const user = await getUserFromRequest(req)
  if (!user) {
    return { redirect: { destination: '/admin/login', permanent: false } }
  }
  return { props: { user } }
}
