import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getRequestsSheetName,
  getSheetsClient,
  getSpreadsheetId,
} from '@/lib/googleSheets';
import { createRequestSchema, requestRowSchema } from '@/lib/requestsSchema';

function mapValuesToRow(rowNumber: number, values: (string | null | undefined)[]) {
  const [
    timestamp,
    user_chat_id,
    user_name,
    request_type,
    risk_code,
    request_text,
    status,
    response_text,
    response_at,
  ] = values.map((v) => (v == null ? '' : String(v)));

  return requestRowSchema.parse({
    row_number: rowNumber,
    timestamp,
    user_chat_id,
    user_name,
    request_type,
    risk_code,
    request_text,
    status,
    response_text,
    response_at,
  });
}

export async function GET(req: Request) {
  try {
    const role = String(req.headers.get('x-rd-role') || '').toLowerCase();
    const username = String(req.headers.get('x-rd-user') || '').trim();

    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const sheetName = getRequestsSheetName();

    const range = `${sheetName}!A1:I`;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) {
      return NextResponse.json({ items: [] });
    }

    // rows[0] is header
    const items = rows
      .slice(1)
      .map((r, idx) => mapValuesToRow(idx + 2, r))
      .filter((r) => r.timestamp || r.request_text || r.user_name);

    const scoped =
      role === 'admin' || role === 'risk_manager'
        ? items
        : items.filter((r) => r.user_name === username);

    // newest first
    scoped.sort((a, b) => b.row_number - a.row_number);

    return NextResponse.json({
      items: scoped,
      me: { username, role: role || 'user' },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e?.message || String(e),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const input = createRequestSchema.parse(body);
    const role = String(req.headers.get('x-rd-role') || '').toLowerCase();
    const username = String(req.headers.get('x-rd-user') || '').trim();

    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const sheetName = getRequestsSheetName();

    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      'web',
      // Do not allow spoofing: store authenticated username
      username || input.user_name,
      input.request_type,
      input.risk_code,
      input.request_text,
      'pending',
      '',
      '',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:I`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    return NextResponse.json({ ok: true, me: { username, role: role || 'user' } });
  } catch (e: any) {
    const zerr = e instanceof z.ZodError ? e.flatten() : null;
    return NextResponse.json(
      {
        error: e?.message || String(e),
        details: zerr,
      },
      { status: 400 },
    );
  }
}

