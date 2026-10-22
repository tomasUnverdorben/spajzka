import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, isAbsolute, join, normalize, relative, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { createInviteCode, createSessionToken, hashPassword, hashToken, normalizeEmail, parseCookies, verifyPassword } from "./auth.ts";

const root = resolve(import.meta.dirname, "..");
const dataDirectory = resolve(root, process.env.DATA_DIRECTORY || "data");
await mkdir(dataDirectory, { recursive: true });
const db = new DatabaseSync(join(dataDirectory, "spajzka.sqlite"));
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS households (id TEXT PRIMARY KEY, name TEXT NOT NULL, invite_code TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS household_members (household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL, PRIMARY KEY (household_id, user_id));
  CREATE TABLE IF NOT EXISTS household_state (household_id TEXT PRIMARY KEY REFERENCES households(id) ON DELETE CASCADE, data_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL);
`);

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const secureCookies = process.env.COOKIE_SECURE === "true";
const sessionDays = 30;
const rateLimit = new Map<string, { count: number; resetAt: number }>();
let shuttingDown = false;

type AppError = Error & { code?: string; statusCode?: number };
function appError(message: string, code: string, statusCode: number): AppError { return Object.assign(new Error(message), { code, statusCode }); }
function json(response: ServerResponse, status: number, payload: unknown, headers: Record<string, string> = {}): void {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  response.end(JSON.stringify(payload));
}
async function body(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of request) { size += chunk.length; if (size > 1_000_000) throw appError("Požadavek je příliš velký.", "PAYLOAD_TOO_LARGE", 413); chunks.push(chunk); }
  try { return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; }
  catch { throw appError("Neplatný JSON.", "INVALID_JSON", 400); }
}
function sameOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin;
  if (!origin) return true;
  const expected = `${secureCookies ? "https" : "http"}://${request.headers.host}`;
  return origin === expected;
}
function enforceRateLimit(request: IncomingMessage): void {
  const key = request.socket.remoteAddress || "unknown"; const now = Date.now(); const current = rateLimit.get(key);
  if (!current || current.resetAt < now) { rateLimit.set(key, { count: 1, resetAt: now + 60_000 }); return; }
  current.count += 1; if (current.count > 40) throw appError("Příliš mnoho pokusů. Zkuste to za chvíli.", "RATE_LIMITED", 429);
}
function sessionCookie(token: string, maxAge: number): string {
  return `spajzka_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secureCookies ? "; Secure" : ""}`;
}
function currentUser(request: IncomingMessage): { id: string; email: string; name: string; householdId: string; householdName: string; inviteCode: string; role: string } | null {
  const token = parseCookies(request.headers.cookie).spajzka_session;
  if (!token) return null;
  const row = db.prepare(`SELECT u.id, u.email, u.name, hm.household_id householdId, h.name householdName, h.invite_code inviteCode, hm.role
    FROM sessions s JOIN users u ON u.id=s.user_id JOIN household_members hm ON hm.user_id=u.id JOIN households h ON h.id=hm.household_id
    WHERE s.token_hash=? AND s.expires_at>?`).get(hashToken(token), new Date().toISOString()) as ReturnType<typeof currentUser>;
  return row || null;
}
function createSession(userId: string): { cookie: string } {
  const { token, hash } = createSessionToken(); const expires = new Date(Date.now() + sessionDays * 86_400_000).toISOString();
  db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").run(hash, userId, expires);
  return { cookie: sessionCookie(token, sessionDays * 86_400) };
}
function publicSession(user: NonNullable<ReturnType<typeof currentUser>>) {
  return { user: { id: user.id, email: user.email, name: user.name }, household: { id: user.householdId, name: user.householdName, inviteCode: user.inviteCode, role: user.role } };
}

async function api(request: IncomingMessage, response: ServerResponse, pathname: string): Promise<boolean> {
  if (!pathname.startsWith("/api/")) return false;
  if (shuttingDown) { json(response, 503, { error: { code: "SHUTTING_DOWN", message: "Server se vypíná." } }); return true; }
  if (!["GET", "HEAD"].includes(request.method || "GET") && !sameOrigin(request)) throw appError("Požadavek pochází z nepovoleného zdroje.", "INVALID_ORIGIN", 403);

  if (pathname === "/api/health" && request.method === "GET") { json(response, 200, { status: "ok" }); return true; }
  if (pathname === "/api/auth/register" && request.method === "POST") {
    enforceRateLimit(request); const input = await body(request); const name = String(input.name || "").trim(); const email = normalizeEmail(String(input.email || "")); const password = String(input.password || ""); const inviteCode = String(input.inviteCode || "").trim().toUpperCase(); const householdName = String(input.householdName || "Naše rodina").trim();
    if (name.length < 2 || !email.includes("@")) throw appError("Vyplňte platné jméno a e-mail.", "VALIDATION_ERROR", 400);
    if (db.prepare("SELECT 1 FROM users WHERE email=?").get(email)) throw appError("Účet s tímto e-mailem už existuje.", "EMAIL_EXISTS", 409);
    const passwordData = await hashPassword(password); const userId = randomUUID(); const now = new Date().toISOString();
    db.exec("BEGIN");
    try {
      db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?)").run(userId, email, name, passwordData.hash, passwordData.salt, now);
      let household = inviteCode ? db.prepare("SELECT id,name FROM households WHERE invite_code=?").get(inviteCode) as { id: string; name: string } | undefined : undefined;
      if (inviteCode && !household) throw appError("Zvací kód neexistuje.", "INVALID_INVITE", 404);
      if (!household) { household = { id: randomUUID(), name: householdName || "Naše rodina" }; db.prepare("INSERT INTO households VALUES(?,?,?,?)").run(household.id, household.name, createInviteCode(), now); db.prepare("INSERT INTO household_state VALUES(?,?,0,?)").run(household.id, "{}", now); }
      db.prepare("INSERT INTO household_members VALUES(?,?,?)").run(household.id, userId, inviteCode ? "member" : "owner"); db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
    const session = createSession(userId); const user = currentUser({ ...request, headers: { ...request.headers, cookie: `spajzka_session=${session.cookie.split("=")[1].split(";")[0]}` } } as IncomingMessage);
    json(response, 201, publicSession(user!), { "Set-Cookie": session.cookie }); return true;
  }
  if (pathname === "/api/auth/login" && request.method === "POST") {
    enforceRateLimit(request); const input = await body(request); const email = normalizeEmail(String(input.email || "")); const password = String(input.password || "");
    const row = db.prepare("SELECT id,password_hash passwordHash,password_salt passwordSalt FROM users WHERE email=?").get(email) as { id: string; passwordHash: string; passwordSalt: string } | undefined;
    if (!row || !(await verifyPassword(password, row.passwordSalt, row.passwordHash))) throw appError("E-mail nebo heslo není správné.", "INVALID_CREDENTIALS", 401);
    const session = createSession(row.id); json(response, 200, { ok: true }, { "Set-Cookie": session.cookie }); return true;
  }
  if (pathname === "/api/auth/logout" && request.method === "POST") {
    const token = parseCookies(request.headers.cookie).spajzka_session; if (token) db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hashToken(token));
    json(response, 200, { ok: true }, { "Set-Cookie": sessionCookie("", 0) }); return true;
  }
  const user = currentUser(request);
  if (!user) throw appError("Nejdřív se přihlaste.", "UNAUTHENTICATED", 401);
  if (pathname === "/api/session" && request.method === "GET") { json(response, 200, publicSession(user)); return true; }
  if (pathname === "/api/state" && request.method === "GET") {
    const row = db.prepare("SELECT data_json data,version,updated_at updatedAt FROM household_state WHERE household_id=?").get(user.householdId) as { data: string; version: number; updatedAt: string };
    json(response, 200, { data: JSON.parse(row.data), version: row.version, updatedAt: row.updatedAt }); return true;
  }
  if (pathname === "/api/state" && request.method === "PUT") {
    const input = await body(request); const data = input.data; if (!data || typeof data !== "object") throw appError("Chybí data domácnosti.", "VALIDATION_ERROR", 400);
    const serialized = JSON.stringify(data); if (Buffer.byteLength(serialized) > 750_000) throw appError("Data domácnosti jsou příliš velká.", "PAYLOAD_TOO_LARGE", 413);
    const current = db.prepare("SELECT data_json data,version,updated_at updatedAt FROM household_state WHERE household_id=?").get(user.householdId) as { data: string; version: number; updatedAt: string };
    if (typeof input.version === "number" && input.version !== current.version) { json(response, 409, { error: { code: "STATE_CONFLICT", message: "Domácnost mezitím upravil někdo jiný." }, current: { data: JSON.parse(current.data), version: current.version, updatedAt: current.updatedAt } }); return true; }
    const now = new Date().toISOString(); db.prepare("UPDATE household_state SET data_json=?,version=version+1,updated_at=? WHERE household_id=? AND version=?").run(serialized, now, user.householdId, current.version);
    const version = (db.prepare("SELECT version FROM household_state WHERE household_id=?").get(user.householdId) as { version: number }).version;
    json(response, 200, { version, updatedAt: now }); return true;
  }
  if (pathname === "/api/household/invite" && request.method === "POST") {
    if (user.role !== "owner") throw appError("Zvací kód může změnit jen správce domácnosti.", "FORBIDDEN", 403);
    const inviteCode = createInviteCode(); db.prepare("UPDATE households SET invite_code=? WHERE id=?").run(inviteCode, user.householdId); json(response, 200, { inviteCode }); return true;
  }
  throw appError("API cesta neexistuje.", "NOT_FOUND", 404);
}

const mime: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".json": "application/json; charset=utf-8" };
async function staticFile(response: ServerResponse, pathname: string): Promise<void> {
  const requested = pathname === "/" ? "index.html" : pathname.slice(1); const file = normalize(resolve(root, requested));
  const relativePath = relative(root, file);
  if (relativePath.startsWith("..") || isAbsolute(relativePath) || relativePath === "data" || relativePath.startsWith(`data${process.platform === "win32" ? "\\" : "/"}`)) throw appError("Soubor nenalezen.", "NOT_FOUND", 404);
  try { const content = await readFile(file); response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; base-uri 'self'; frame-ancestors 'none'" }); response.end(content); }
  catch { throw appError("Soubor nenalezen.", "NOT_FOUND", 404); }
}

const server = createServer(async (request, response) => {
  try { const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`); if (!(await api(request, response, url.pathname))) await staticFile(response, url.pathname); }
  catch (error) { const app = error as AppError; if ((app.statusCode || 500) >= 500) console.error(app); json(response, app.statusCode || 500, { error: { code: app.code || "INTERNAL_ERROR", message: app.statusCode && app.statusCode < 500 ? app.message : "Něco se pokazilo na serveru." } }); }
});
server.listen(port, host, () => console.log(`Špajzka běží na http://${host}:${port}`));
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => { if (shuttingDown) return; shuttingDown = true; server.close(() => { db.close(); process.exit(0); }); setTimeout(() => process.exit(1), 10_000).unref(); });
