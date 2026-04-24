// Tiny CSV utilities — edge-safe, no deps.
// Spec: RFC 4180. Double-quote any value that contains a comma, quote,
// CR, or LF; escape embedded quotes by doubling them.

export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'string' ? value : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
): string {
  const header = columns.map((c) => escapeCsvField(c.header)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCsvField(row[c.key])).join(','))
    .join('\n');
  return rows.length === 0 ? header + '\n' : `${header}\n${body}\n`;
}

// A minimal CSV parser that handles quoted fields with commas, newlines,
// and doubled-quote escaping. Returns a list of row objects keyed by the
// header row.
export function parseCsv(input: string): { headers: string[]; rows: Record<string, string>[] } {
  const text = input.replace(/^﻿/, ''); // strip BOM
  const rowsRaw: string[][] = [];
  let field = '';
  let row: string[] = [];
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\r') {
      i += 1;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rowsRaw.push(row);
      field = '';
      row = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rowsRaw.push(row);
  }
  if (rowsRaw.length === 0) return { headers: [], rows: [] };

  const headers = rowsRaw[0].map((h) => h.trim());
  const rows = rowsRaw.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    for (let idx = 0; idx < headers.length; idx += 1) {
      obj[headers[idx]] = (r[idx] ?? '').trim();
    }
    return obj;
  });
  return { headers, rows };
}
