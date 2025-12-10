/**
 * Crea usuarios en Supabase Auth con rol en app_metadata.
 * Requiere:
 *  - VITE_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY (solo local, NO subir a git)
 *
 * Ejecuta: node scripts/createUsers.js
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
const url = (process.env.VITE_SUPABASE_URL || env.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || '').trim();
const service = (process.env.SUPABASE_SERVICE_ROLE_KEY || env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1] || '').trim();

const isProbablyService = service && !service.toLowerCase().includes('anon') && !service.toLowerCase().includes('publish');

if (!url || !service || !isProbablyService) {
  console.error(
    'Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY, o la clave parece ser la anon/publishable. ' +
      'Ve a Supabase > Settings > API > (Secret keys) y copia la SERVICE ROLE KEY / Secret Key (no la anon). ' +
      'Colócala en .env local como SUPABASE_SERVICE_ROLE_KEY. No la subas a git.',
  );
  process.exit(1);
}

const supabase = createClient(url, service);

const users = [
  { email: 'barbara@navidadpos.cl', password: 'barbara123', role: 'user', full_name: 'Barbara Barrios' },
  { email: 'jonathan@navidadpos.cl', password: 'jhonna123', role: 'user', full_name: 'Jonathan Llaguel' },
  { email: 'fernanda@navidadpos.cl', password: 'fer123', role: 'user', full_name: 'Fernanda Salazar' },
  { email: 'fabiola@navidadpos.cl', password: 'fabi123', role: 'user', full_name: 'Fabiola Villagra' },
  { email: 'admin@navidadpos.cl', password: 'admin123', role: 'admin', full_name: 'Admin' },
];

const main = async () => {
  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
      app_metadata: { role: u.role },
    });
    if (error) {
      console.error('Error creando', u.email, error.message);
      process.exit(1);
    } else {
      console.log('Creado/ok', u.email, '-> role:', u.role, 'id:', data.user?.id);
    }
  }
};

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
