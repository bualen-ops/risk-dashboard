import { google } from 'googleapis';

export type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function loadServiceAccountFromEnv(): ServiceAccountCredentials {
  const raw = requireEnv('GOOGLE_SERVICE_ACCOUNT_JSON');
  let obj: any;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON must be valid JSON (stringified service account credentials)',
    );
  }

  const client_email = String(obj.client_email || '').trim();
  // Vercel обычно хранит private_key с \n, надо восстановить переводы строк
  const private_key = String(obj.private_key || '').replace(/\\n/g, '\n');

  if (!client_email || !private_key) {
    throw new Error('Service account JSON missing client_email/private_key');
  }

  return { client_email, private_key };
}

export function getSheetsClient() {
  const creds = loadServiceAccountFromEnv();
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export function getSpreadsheetId(): string {
  return requireEnv('GOOGLE_SHEETS_SPREADSHEET_ID').trim();
}

export function getRequestsSheetName(): string {
  return (process.env.REQUESTS_SHEET_NAME || 'Requests').trim();
}

