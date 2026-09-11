const fs = require('fs')
const path = require('path')

const URL = 'https://vtxtsaapavyjlivghdss.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0eHRzYWFwYXZ5amxpdmdoZHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDE0NTksImV4cCI6MjEwNDM3NzQ1OX0.VgQz4kp_s-1gmDURRTfa8ubGRLbz0oqoLt9il16IA-I'

async function getToken() {
  const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@thaliana.com', password: 'SZqfASgXAXraj5ap' })
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('login failed: ' + JSON.stringify(data))
  return data.access_token
}

async function listCompanies(token) {
  const res = await fetch(`${URL}/rest/v1/companies?select=id,name`, {
    headers: { apikey: ANON, Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('list failed: ' + res.status + ' ' + await res.text())
  return res.json()
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  const [header, ...rows] = lines
  const cols = header.split(',')
  return rows.map(l => {
    const v = []
    let cur = '', q = false
    for (let i = 0; i < l.length; i++) {
      const ch = l[i]
      if (ch === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++ } else q = !q }
      else if (ch === ',' && !q) { v.push(cur); cur = '' }
      else cur += ch
    }
    v.push(cur)
    const o = {}
    cols.forEach((c, i) => { o[c.trim()] = v[i].trim() })
    return o
  })
}

async function main() {
  const token = await getToken()
  const existing = await listCompanies(token)
  const existingNames = new Set(existing.map(c => c.name.trim().toLowerCase()))

  const csv = fs.readFileSync(path.join(__dirname, 'proveedores_supabase.csv'), 'utf-8')
  const provs = parseCSV(csv)

  const missing = provs.filter(p => !existingNames.has(p.proveedor.trim().toLowerCase()))

  console.log(`Total CSV: ${provs.length} | En DB: ${existing.length} | Faltantes: ${missing.length}`)

  if (missing.length === 0) {
    console.log('No missing suppliers.')
    return
  }

  // ids: emp_csv<NNN> continuing after existing emp_csv ids
  const usedEmp = new Set(existing.map(c => c.id))
  let next = 1
  const rows = []
  for (const p of missing) {
    let id
    do { id = `emp_csv${String(next).padStart(3, '0')}`; next++ } while (usedEmp.has(id))
    usedEmp.add(id)
    rows.push({ id, name: p.proveedor })
  }

  console.log('Insertando:')
  rows.forEach(r => console.log(`  ${r.id}\t${r.name}`))

  const res = await fetch(`${URL}/rest/v1/companies`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(rows)
  })
  const body = await res.text()
  if (!res.ok) throw new Error('insert failed: ' + res.status + ' ' + body)
  console.log('OK insertados:', body.length > 0 ? JSON.parse(body).length : rows.length)
}

main().catch(e => { console.error(e.message); process.exit(1) })