/**
 * Client-safe CSV generator & downloader with standard escaping.
 */

function escapeCsvCell(cell: string | number | null | undefined): string {
  if (cell === null || cell === undefined) return '""'
  const str = String(cell)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const headerLine = headers.map(escapeCsvCell).join(',')
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(','))
  const csvContent = [headerLine, ...rowLines].join('\r\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const dateSuffix = new Date().toISOString().split('T')[0]
  const cleanName = filename.endsWith('.csv')
    ? filename.replace('.csv', `-${dateSuffix}.csv`)
    : `${filename}-${dateSuffix}.csv`

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', cleanName)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
