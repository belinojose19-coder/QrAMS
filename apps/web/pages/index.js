import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>QrAMS — Attendance via QR</h1>
      <p>Simple prototype: Admin portal, HRO portal, Employee PWA.</p>
      <ul>
        <li><Link href="/admin/login">Organization Admin portal</Link></li>
        <li><Link href="/hro/login">HRO portal</Link></li>
        <li><a href="/manifest.json" target="_blank" rel="noreferrer">Install PWA (manifest)</a></li>
      </ul>
    </main>
  )
}
