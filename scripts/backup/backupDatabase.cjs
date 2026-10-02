// Daily data backup of the Supabase database (the Free plan has no
// automatic backups). Read-only: dumps every table of the `public` schema
// plus the auth accounts as gzipped JSON into backups/<timestamp>/, writes a
// manifest (row counts + applied migrations) and keeps the newest
// KEEP_BACKUPS folders. The schema itself lives in supabase/migrations.
//
//   node scripts/backup/backupDatabase.cjs
//
// Needs SUPABASE_DB_PASSWORD in .env. The backups contain customer data and
// password hashes: keep the folder private (it's git-ignored) and ideally
// copy it somewhere off this PC now and then.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const root = path.resolve(__dirname, "..", "..");
const KEEP_BACKUPS = 30;

for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const { Client } = require(path.join(root, "node_modules/pg"));
const ref = require(path.join(root, "supabase/.temp/linked-project.json")).ref;

function writeGz(file, value) {
  fs.writeFileSync(file, zlib.gzipSync(JSON.stringify(value)));
}

(async () => {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const backupsDir = path.join(root, "backups");
  const target = path.join(backupsDir, stamp);
  fs.mkdirSync(target, { recursive: true });

  const client = new Client({
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: "postgres",
    database: "postgres",
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // One consistent snapshot across all tables.
  await client.query("begin transaction isolation level repeatable read read only");
  const counts = {};
  try {
    const tables = (
      await client.query(
        "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name",
      )
    ).rows.map((row) => row.table_name);

    for (const table of tables) {
      const { rows } = await client.query(`select * from public."${table}"`);
      writeGz(path.join(target, `${table}.json.gz`), rows);
      counts[table] = rows.length;
    }

    const authUsers = (
      await client.query(
        `select id, email, phone, encrypted_password, email_confirmed_at, banned_until,
                raw_app_meta_data, raw_user_meta_data, created_at, updated_at
         from auth.users order by created_at`,
      )
    ).rows;
    writeGz(path.join(target, "auth_users.json.gz"), authUsers);
    counts.auth_users = authUsers.length;

    const migrations = (
      await client.query("select version from supabase_migrations.schema_migrations order by version").catch(() => ({ rows: [] }))
    ).rows.map((row) => row.version);

    fs.writeFileSync(
      path.join(target, "manifest.json"),
      JSON.stringify({ createdAt: new Date().toISOString(), project: ref, rowCounts: counts, migrations }, null, 2),
    );
  } finally {
    await client.query("rollback");
    await client.end();
  }

  // Retention: keep only the newest KEEP_BACKUPS backup folders.
  const folders = fs
    .readdirSync(backupsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  for (const old of folders.slice(0, Math.max(0, folders.length - KEEP_BACKUPS))) {
    fs.rmSync(path.join(backupsDir, old), { recursive: true, force: true });
  }

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  console.log(`${new Date().toISOString()} Backup OK: ${target} (${total} Zeilen in ${Object.keys(counts).length} Tabellen)`);
})().catch((error) => {
  console.error(`${new Date().toISOString()} Backup FEHLGESCHLAGEN: ${error.message}`);
  process.exit(1);
});
