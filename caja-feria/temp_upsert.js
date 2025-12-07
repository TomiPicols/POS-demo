import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync('.env', 'utf-8');
const url = (process.env.VITE_SUPABASE_URL || (env.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || '')).trim();
const anon = (process.env.VITE_SUPABASE_ANON_KEY || (env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1] || '')).trim();
if (!url || !anon) {
  console.error('Missing Supabase env');
  process.exit(1);
}
const supabase = createClient(url, anon);
const products = [
  ['Cascada blanca 100', 5500, 'Cascadas', 6],
  ['Cascada calida 100', 5500, 'Cascadas', 9],
  ['Cascada multi 100', 5500, 'Cascadas', 10],
  ['Cascada blanca 200', 6500, 'Cascadas', 6],
  ['Cascada calida 200', 6500, 'Cascadas', 6],
  ['Cascada multi 200', 6500, 'Cascadas', 7],
  ['Cascada casa estrella calida 136', 8500, 'Cascadas', 8],
  ['Cascada multi nieve 200', 8500, 'Cascadas', 6],
  ['Cascada estrella 120', 8500, 'Cascadas', 6],
  ['Cascada esfera regalo multi 110', 8500, 'Cascadas', 2],
  ['Cascada esfera navidad calida', 10000, 'Cascadas', 3],
  ['Cascada brillo multi', 10000, 'Cascadas', 1],
  ['Led rojo 100', 2500, 'Leds', 5],
  ['Led azul 100', 2500, 'Leds', 8],
  ['Led lila 100', 2500, 'Leds', 2],
  ['Led blanco 100', 2500, 'Leds', 4],
  ['Led calido 100', 2500, 'Leds', 1],
  ['Led multi 200', 3500, 'Leds', 3],
  ['Led rojo 200', 3500, 'Leds', 3],
  ['Led azul 200', 2500, 'Leds', 4],
  ['Led multi 100', 2500, 'Leds', 10],
  ['Luz solar copo de nieve multi', 3500, 'Solar', 3],
  ['Luz solar gota calida', 3500, 'Solar', 3],
  ['Luz solar gota multi', 3500, 'Solar', 3],
  ['Luz solar pelota', 3500, 'Solar', 1],
  ['Cenefa estrella blanca 120', 6000, 'Cenefa', 4],
  ['Cenefa estrella multi 120', 6000, 'Cenefa', 1],
  ['Cenefa estrella calida 120', 6000, 'Cenefa', 2],
  ['Manguera calida', 8000, 'Manguera', 3],
  ['Manguera blanca', 8000, 'Manguera', 3],
  ['Manguera multi', 8000, 'Manguera', 4],
  ['Manguera blanca-azul', 8000, 'Manguera', 2],
  ['Rapidita multi 100', 10000, 'Otros', 9],
  ['Malla multi 144', 7000, 'Otros', 5],
  ['Cortina calida 250', 10000, 'Otros', 2],
  ['Luz fuego artificial calida', 4000, 'Otros', 3],
  ['Luz fuego artificial multi', 4000, 'Otros', 3],
  ['Lampara diseño vela calida', 10000, 'Otros', 3],
  ['Meteorito multicolor', 7000, 'Otros', 1],
  ['Meteorito calida', 7000, 'Otros', 3],
  ['Luz ampolleta jardin', 13000, 'Otros', 7],
];

const run = async () => {
  await supabase.from('products').update({ is_active: false }).neq('id', 0);
  const payload = products.map(([name, price, category]) => ({ name, default_price: price, category, is_active: true }));
  const { error } = await supabase.from('products').insert(payload);
  if (error) {
    console.error('Insert error', error);
    process.exit(1);
  }
  console.log('Inserted', payload.length, 'products');
};
run();
