import { NextResponse } from 'next/server';
import { getPool } from '@/lib/mssql';

type RiskRow = {
  risk_code: string;
  description: string;
  status: string;
  owner: string;
  probability: number | null;
  impact: number | null;
};

function toNum(v: any): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();

    const pool = await getPool();

    // Same as bot LIST_RISKS query, with optional search filter.
    const baseSql = `
      SELECT TOP 200
        r.Code AS risk_code,
        r.Name AS description,
        rs.Name AS status,
        r.Owner AS owner,
        l.Probability AS probability,
        l.ImpactOnProject AS impact
      FROM rm.Risk r
      LEFT JOIN rm.RiskStatus rs ON r.StatusId = rs.Id
      LEFT JOIN (
        SELECT
          RiskId,
          Probability,
          ImpactOnProject,
          ROW_NUMBER() OVER (PARTITION BY RiskId ORDER BY DateCreated DESC) AS rn
        FROM rm.StateRecord
        WHERE DateDeleted IS NULL
      ) l ON l.RiskId = r.Id AND l.rn = 1
      WHERE r.DateDeleted IS NULL
    `;

    const request = pool.request();
    let sqlText = baseSql;

    if (q) {
      request.input('q', `%${q}%`);
      sqlText += `
        AND (
          r.Code LIKE @q
          OR r.Name LIKE @q
          OR r.Owner LIKE @q
          OR rs.Name LIKE @q
        )
      `;
    }

    sqlText += ` ORDER BY r.Code`;

    const res = await request.query(sqlText);
    const rows = (res.recordset || []) as any[];

    const items: RiskRow[] = rows.map((r) => ({
      risk_code: String(r.risk_code ?? ''),
      description: String(r.description ?? ''),
      status: String(r.status ?? ''),
      owner: String(r.owner ?? ''),
      probability: toNum(r.probability),
      impact: toNum(r.impact),
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 },
    );
  }
}

