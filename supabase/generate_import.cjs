const fs = require('fs')
const path = require('path')

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

const csv = fs.readFileSync(path.join(__dirname, 'productos_supabase.csv'), 'utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
const lines = csv.split('\n').filter(l => l.trim())
const header = parseCSVLine(lines[0])
console.log('Header:', header)

const rows = lines.slice(1).map(l => {
  const cols = parseCSVLine(l)
  return {
    csvId: parseInt(cols[0]),
    almacen: cols[1],
    referencia: cols[2],
    codBarra: cols[3],
    producto: cols[4],
    categoria: cols[5],
    precioVenta: cols[6],
    cantidad: cols[7],
    proveedor: cols[8]
  }
})

console.log(`Total rows: ${rows.length}`)

const proveedores = [...new Set(rows.map(r => r.proveedor))].sort()
const withPlaceholder = proveedores.map(p => (p.trim() === '' ? 'SIN PROVEEDOR' : p))
const provedoresFinal = [...new Set(withPlaceholder)].sort()
console.log(`Unique proveedores: ${provedoresFinal.length}`)

const uidEmp = (i) => `emp_csv${String(i + 1).padStart(3, '0')}`
const uidPrd = (csvId) => `prd_csv${String(csvId).padStart(5, '0')}`

const proveedorMap = {}
provedoresFinal.forEach((p, i) => { proveedorMap[p] = uidEmp(i) })

const escSQL = (s) => s == null ? 'null' : `'${String(s).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`

let sql = `-- =====================================================================
-- Seed: productos y proveedores importados desde productos_supabase.csv
-- Generado automáticamente. Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

`

sql += `BEGIN;\n\n`
sql += `-- PROVEEDORES (companies)\n`
sql += `INSERT INTO public.companies (id, name)\nVALUES\n`
const empValues = provedoresFinal.map((p, i) => {
  const id = uidEmp(i)
  const name = escSQL(p)
  return `  (${escSQL(id)}, ${name})`
})
sql += empValues.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n'

const prdValues = rows.map(r => {
  const id = escSQL(uidPrd(r.csvId))
  const name = escSQL(r.producto)
  const ref = escSQL(r.referencia)
  const codBarra = r.codBarra ? escSQL(r.codBarra) : 'null'
  const almacen = r.almacen ? escSQL(r.almacen) : 'null'
  const provKey = r.proveedor.trim() === '' ? 'SIN PROVEEDOR' : r.proveedor
  const companyId = escSQL(proveedorMap[provKey])
  const precioVenta = r.precioVenta && !isNaN(r.precioVenta) ? r.precioVenta : 'null'
  const stock = r.cantidad && !isNaN(r.cantidad) ? r.cantidad : 'null'
  const cat = r.categoria ? escSQL(r.categoria) : 'null'
  return `  (${id}, ${name}, ${ref}, ${codBarra}, ${almacen}, ${companyId}, null, null, ${cat}, null, null, ${precioVenta}, ${stock}, null)`
})

const BATCH = 500
const colsRow = `INSERT INTO public.products (id, name, referencia, codigo_barras, almacen, company_id, brand_id, product_line_id, categoria, unit, purchase_price, sale_price, stock, min_stock)`
sql += `-- PRODUCTOS (products) en lotes de ${BATCH}\n`
for (let i = 0; i < prdValues.length; i += BATCH) {
  const chunk = prdValues.slice(i, i + BATCH)
  sql += `\n-- Lote ${Math.floor(i / BATCH) + 1} (${i + 1}–${i + chunk.length})\n`
  sql += colsRow + `\nVALUES\n`
  sql += chunk.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n'
}
sql += `\nCOMMIT;\n`

const outPath = path.join(__dirname, '0010_seed_productos.sql')
fs.writeFileSync(outPath, sql, 'utf-8')
console.log(`Written to ${outPath} (${(Buffer.byteLength(sql) / 1024).toFixed(0)} KB)`)
