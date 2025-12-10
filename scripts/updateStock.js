import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env');
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
const url = (process.env.VITE_SUPABASE_URL || env.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || '').trim();
const anon = (process.env.VITE_SUPABASE_ANON_KEY || env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1] || '').trim();

if (!url || !anon) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

const supabase = createClient(url, anon);

const items = [
  // Cascadas
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
  // Leds
  ['Led rojo 100', 2500, 'Leds', 5],
  ['Led azul 100', 2500, 'Leds', 8],
  ['Led lila 100', 2500, 'Leds', 2],
  ['Led blanco 100', 2500, 'Leds', 4],
  ['Led calido 100', 2500, 'Leds', 1],
  ['Led multi 200', 3500, 'Leds', 3],
  ['Led rojo 200', 3500, 'Leds', 3],
  ['Led azul 200', 2500, 'Leds', 4],
  ['Led multi 100', 2500, 'Leds', 10],
  // Solar
  ['Luz solar copo de nieve multi', 3500, 'Solar', 3],
  ['Luz solar gota calida', 3500, 'Solar', 3],
  ['Luz solar gota multi', 3500, 'Solar', 3],
  ['Luz solar pelota', 3500, 'Solar', 1],
  // Cenefa
  ['Cenefa estrella blanca 120', 6000, 'Cenefa', 4],
  ['Cenefa estrella multi 120', 6000, 'Cenefa', 1],
  ['Cenefa estrella calida 120', 6000, 'Cenefa', 2],
  // Manguera
  ['Manguera calida', 8000, 'Manguera', 3],
  ['Manguera blanca', 8000, 'Manguera', 3],
  ['Manguera multi', 8000, 'Manguera', 4],
  ['Manguera blanca-azul', 8000, 'Manguera', 2],
  // Otros
  ['Rapidita multi 100', 10000, 'Otros', 9],
  ['Malla multi 144', 7000, 'Otros', 5],
  ['Cortina calida 250', 10000, 'Otros', 2],
  ['Luz fuego artificial calida', 4000, 'Otros', 3],
  ['Luz fuego artificial multi', 4000, 'Otros', 3],
  ['Lampara diseno vela calida', 10000, 'Otros', 3],
  ['Meteorito multicolor', 7000, 'Otros', 1],
  ['Meteorito calida', 7000, 'Otros', 3],
  ['Luz ampolleta jardin', 13000, 'Otros', 7],
  // Bolsas
  ['Bolsas pequena', 500, 'Bolsas', 12],
  ['Bolsa mediana', 1000, 'Bolsas', 12],
  ['Bolsa grande', 1500, 'Bolsas', 12],
  ['Bolsa tipo peluche', 1500, 'Bolsas', 4],
  // Esferas
  ['9 esferas rojas con lineas blancas', 6500, 'Esferas', 2],
  ['9 esferas rojas diseno copo de nieve', 3000, 'Esferas', 3],
  ['9 esferas diseno verde', 5000, 'Esferas', 2],
  ['9 esferas diseno rojo', 6500, 'Esferas', 2],
  ['16 esferas arbol rosado', 10000, 'Esferas', 2],
  ['16 esferas arbol plateado', 10000, 'Esferas', 2],
  ['16 esferas arbol dorado', 10000, 'Esferas', 2],
  ['7 esferas rojo', 5000, 'Esferas', 2],
  ['7 esferas dorado', 5000, 'Esferas', 2],
  ['7 esferas plateado', 5000, 'Esferas', 2],
  ['10 esferas rosada', 3500, 'Esferas', 2],
  ['10 esferas plateada', 3500, 'Esferas', 2],
  ['10 esferas dorado', 3500, 'Esferas', 2],
  ['10 esferas rojo', 3500, 'Esferas', 2],
  ['maletin bolas calipso', 10000, 'Esferas', 1],
  ['maletin bolas celeste', 10000, 'Esferas', 1],
  ['maletin bolas rojo', 10000, 'Esferas', 1],
  ['bolas plateadas 20', 12000, 'Esferas', 1],
  ['esferas forma trineo', 3500, 'Esferas', 3],
  ['esferas (caja diseno casa- rojo- dorado- plateado)', 3500, 'Esferas', 3],
  // Decoracion
  ['Guirnalda verde', 1500, 'Decoracion', 16],
  ['guirnalda marco puerta rojo', 5000, 'Decoracion', 1],
  ['guirnalda marco puerta dorado', 5000, 'Decoracion', 1],
  ['adorno madera grande', 2000, 'Decoracion', 2],
  ['adorno madera mediano', 1500, 'Decoracion', 9],
  ['adorno madera pequeno', 1000, 'Decoracion', 8],
  ['adornos rojos brillantes', 1200, 'Decoracion', 17],
  ['adornos muneco de nieve', 1000, 'Decoracion', 2],
  ['adornos tipo peluche dorado', 1000, 'Decoracion', 13],
  ['Corona puerta', 1200, 'Decoracion', 12],
  ['Bota roja copos', 1500, 'Decoracion', 6],
  ['Bota viejo pascuero', 1500, 'Decoracion', 3],
  ['Bota diseno- botones (relieve)', 2500, 'Decoracion', 2],
  ['adornos ceramica', 1500, 'Decoracion', 2],
  ['adornos ninas', 1000, 'Decoracion', 8],
  ['Fundas cojines', 1000, 'Decoracion', 2],
  ['estrella arbol', 2000, 'Decoracion', 6],
  ['camino de mesa', 1000, 'Decoracion', 4],
  ['adornos luces (antiguos)', 1000, 'Decoracion', 2],
  ['Camino de mesa delgado', 1000, 'Decoracion', 2],
  ['patas largas', 5000, 'Decoracion', 2],
  ['mantel', 1000, 'Decoracion', 3],
  ['botas pequenas', 1000, 'Decoracion', 2],
  ['adorno tipo peluche rojo', 1000, 'Decoracion', 2],
  ['pelota cascabel', 1500, 'Decoracion', 3],
  ['nombres', 1000, 'Decoracion', 6],
  ['servilletas', 1000, 'Decoracion', 10],
  ['colgante botas (4)', 1500, 'Decoracion', 3],
  ['colgantes viajito (4)', 1500, 'Decoracion', 2],
  ['tarjeta de navidad', 1000, 'Decoracion', 20],
  ['Vasos coca-cola', 2000, 'Decoracion', 18],
  ['arboles de navidad 1.80', 15000, 'Decoracion', 1],
  ['Cinta arbol pequena', 1000, 'Decoracion', 40],
  ['Cinta arbol grande', 1000, 'Decoracion', 30],
  ['Cojin arboles blanco', 12000, 'Decoracion', 3],
  ['Cojin copo de nieve rojo', 12000, 'Decoracion', 3],
  ['adorno donas doradas (3)', 3000, 'Decoracion', 4],
  ['adornos caja con cinta blanca', 100, 'Decoracion', 3],
  ['Cintas', 600, 'Decoracion', 100],
  ['Scotch', 250, 'Decoracion', 48],
];

const byName = new Map(items.map(([name, price, category, stock]) => [name, { price, category, stock }]));

const main = async () => {
  // Desactivar todo lo anterior para limpiar pruebas.
  await supabase.from('products').update({ is_active: false }).neq('id', 0);

  let updated = 0;
  let inserted = 0;
  for (const [name, price, category, stock] of items) {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('name', name)
      .limit(1);
    if (error) {
      console.error('Error consultando', name, error.message);
      process.exit(1);
    }

    if (data && data.length) {
      const id = data[0].id;
      const { error: updError } = await supabase
        .from('products')
        .update({
          default_price: price,
          category,
          stock,
          is_active: true,
        })
        .eq('id', id);
      if (updError) {
        console.error('Error actualizando', name, updError.message);
        process.exit(1);
      }
      updated += 1;
    } else {
      const { error: insError } = await supabase.from('products').insert({
        name,
        default_price: price,
        category,
        stock,
        is_active: true,
      });
      if (insError) {
        console.error('Error insertando', name, insError.message);
        process.exit(1);
      }
      inserted += 1;
    }
  }

  console.log(`Actualizados ${updated}, insertados ${inserted}. Total catálogo ${items.length}.`);
};

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
