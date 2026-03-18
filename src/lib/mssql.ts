import sql from 'mssql';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export type MsSqlConfig = {
  server: string;
  database: string;
  user: string;
  password: string;
  port?: number;
  encrypt?: boolean;
};

function getConfig(): MsSqlConfig {
  const server = requireEnv('MSSQL_HOST').trim();
  const database = requireEnv('MSSQL_DB').trim();
  const user = requireEnv('MSSQL_USER').trim();
  const password = requireEnv('MSSQL_PASS');
  const port = process.env.MSSQL_PORT ? Number(process.env.MSSQL_PORT) : undefined;
  const encrypt =
    process.env.MSSQL_ENCRYPT != null
      ? String(process.env.MSSQL_ENCRYPT).toLowerCase() === 'true'
      : true;

  return { server, database, user, password, port, encrypt };
}

declare global {
  // eslint-disable-next-line no-var
  var __riskDashboardSqlPool: sql.ConnectionPool | undefined;
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (global.__riskDashboardSqlPool) return global.__riskDashboardSqlPool;

  const cfg = getConfig();
  const pool = await sql.connect({
    server: cfg.server,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password,
    port: cfg.port,
    options: {
      encrypt: cfg.encrypt ?? true,
      trustServerCertificate: false,
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30_000,
    },
  });

  global.__riskDashboardSqlPool = pool;
  return pool;
}

