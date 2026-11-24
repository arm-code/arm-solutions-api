/* eslint-disable no-console */
/**
 * Administración de usuarios por línea de comandos (no hay registro público).
 *
 *   node dist/src/scripts/user-admin.js list
 *   node dist/src/scripts/user-admin.js set-password <email> [--business <slug>]
 *
 * `set-password` crea el usuario si no existe o cambia su contraseña. Con
 * `--business` lo agrega además como admin de ese negocio. La contraseña se
 * pide sin eco; para scripts puede pasarse en la variable NEW_PASSWORD.
 *
 * Con Docker:  docker compose exec api node dist/src/scripts/user-admin.js ...
 * (usa `docker compose exec` desde una terminal real para el prompt oculto).
 */
import * as bcrypt from 'bcryptjs';
import { Client } from 'pg';

const MIN_PASSWORD_LENGTH = 10;

function readHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      return reject(new Error('Sin terminal interactiva: define NEW_PASSWORD o usa `exec -it`.'));
    }
    process.stdout.write(prompt);
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const onData = (ch: string) => {
      for (const c of ch) {
        if (c === '\r' || c === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.off('data', onData);
          process.stdout.write('\n');
          return resolve(value);
        }
        if (c === '\u0003') process.exit(130); // Ctrl+C
        if (c === '\u007f' || c === '\b') value = value.slice(0, -1);
        else value += c;
      }
    };
    process.stdin.on('data', onData);
  });
}

async function getPassword(): Promise<string> {
  const fromEnv = process.env.NEW_PASSWORD;
  if (fromEnv) return fromEnv;
  const first = await readHidden('Nueva contraseña: ');
  const second = await readHidden('Repite la contraseña: ');
  if (first !== second) throw new Error('Las contraseñas no coinciden.');
  return first;
}

async function main() {
  const [command, emailArg, ...rest] = process.argv.slice(2);
  const db = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  });
  await db.connect();

  try {
    if (command === 'list') {
      const { rows } = await db.query(
        `SELECT u.email, u.is_active, (u.password_hash IS NOT NULL) AS has_password,
                coalesce(string_agg(b.slug || ':' || bu.role, ', '), '-') AS negocios
           FROM armsolutions.users u
           LEFT JOIN armsolutions.business_users bu ON bu.user_id = u.id
           LEFT JOIN armsolutions.businesses b ON b.id = bu.business_id
          GROUP BY u.id ORDER BY u.email`,
      );
      console.table(rows);
      return;
    }

    if (command === 'set-password' && emailArg) {
      const email = emailArg.trim().toLowerCase();
      const slugIdx = rest.indexOf('--business');
      const slug = slugIdx >= 0 ? rest[slugIdx + 1] : undefined;

      const password = await getPassword();
      if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      }
      const hash = await bcrypt.hash(password, 12);

      const { rows } = await db.query(
        `INSERT INTO armsolutions.users (email, password_hash) VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()
         RETURNING id`,
        [email, hash],
      );
      const userId = rows[0].id as string;
      console.log(`OK: contraseña guardada para ${email}`);

      if (slug) {
        const biz = await db.query(`SELECT id FROM armsolutions.businesses WHERE slug = $1`, [slug]);
        if (!biz.rows[0]) throw new Error(`No existe el negocio "${slug}".`);
        await db.query(
          `INSERT INTO armsolutions.business_users (business_id, user_id, role)
           VALUES ($1, $2, 'admin') ON CONFLICT (business_id, user_id) DO NOTHING`,
          [biz.rows[0].id, userId],
        );
        console.log(`OK: ${email} es admin de "${slug}"`);
      }
      return;
    }

    console.error('Uso: list | set-password <email> [--business <slug>]');
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main().catch((err: Error) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
