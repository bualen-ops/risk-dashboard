import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getRequestsSheetName,
  getSheetsClient,
  getSpreadsheetId,
} from '@/lib/googleSheets';
import { answerRequestSchema } from '@/lib/requestsSchema';

export async function POST(req: Request) {
  try {
    const role = String(req.headers.get('x-rd-role') || '').toLowerCase();
    if (role !== 'admin' && role !== 'risk_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const input = answerRequestSchema.parse(body);

    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const sheetName = getRequestsSheetName();

    // Columns:
    // A timestamp
    // B user_chat_id
    // C user_name
    // D request_type
    // E risk_code
    // F request_text
    // G status
    // H response_text
    // I response_at
    const responseAt = new Date().toISOString();
    const range = `${sheetName}!G${input.row_number}:I${input.row_number}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['answered', input.response_text, responseAt]],
      },
    });

    return NextResponse.json({ ok: true });
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

