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

const products = [
  // Cascadas (Luces)
  { name: 'Cascada blanca 100', price: 5500, category: 'Cascadas', stock: 6 },
  { name: 'Cascada calida 100', price: 5500, category: 'Cascadas', stock: 9 },
  { name: 'Cascada multi 100', price: 5500, category: 'Cascadas', stock: 10 },
  { name: 'Cascada blanca 200', price: 6500, category: 'Cascadas', stock: 6 },
  { name: 'Cascada calida 200', price: 6500, category: 'Cascadas', stock: 6 },
  { name: 'Cascada multi 200', price: 6500, category: 'Cascadas', stock: 7 },
  { name: 'Cascada casa estrella calida 136', price: 8500, category: 'Cascadas', stock: 8 },
  { name: 'Cascada multi nieve 200', price: 8500, category: 'Cascadas', stock: 6 },
  { name: 'Cascada estrella 120', price: 8500, category: 'Cascadas', stock: 6 },
  { name: 'Cascada esfera regalo multi 110', price: 8500, category: 'Cascadas', stock: 2 },
  { name: 'Cascada esfera navidad calida', price: 10000, category: 'Cascadas', stock: 3 },
  { name: 'Cascada brillo multi', price: 10000, category: 'Cascadas', stock: 1 },

  // Leds (Luces)
  { name: 'Led rojo 100', price: 2500, category: 'Leds', stock: 5 },
  { name: 'Led azul 100', price: 2500, category: 'Leds', stock: 8 },
  { name: 'Led lila 100', price: 2500, category: 'Leds', stock: 2 },
  { name: 'Led blanco 100', price: 2500, category: 'Leds', stock: 4 },
  { name: 'Led calido 100', price: 2500, category: 'Leds', stock: 1 },
  { name: 'Led multi 200', price: 3500, category: 'Leds', stock: 3 },
  { name: 'Led rojo 200', price: 3500, category: 'Leds', stock: 3 },
  { name: 'Led azul 200', price: 2500, category: 'Leds', stock: 4 },
  { name: 'Led multi 100', price: 2500, category: 'Leds', stock: 10 },

  // Solar (Luces)
  { name: 'Luz solar copo de nieve multi', price: 3500, category: 'Solar', stock: 3 },
  { name: 'Luz solar gota calida', price: 3500, category: 'Solar', stock: 3 },
  { name: 'Luz solar gota multi', price: 3500, category: 'Solar', stock: 3 },
  { name: 'Luz solar pelota', price: 3500, category: 'Solar', stock: 1 },

  // Cenefa (Luces)
  { name: 'Cenefa estrella blanca 120', price: 6000, category: 'Cenefa', stock: 4 },
  { name: 'Cenefa estrella multi 120', price: 6000, category: 'Cenefa', stock: 1 },
  { name: 'Cenefa estrella calida 120', price: 6000, category: 'Cenefa', stock: 2 },

  // Manguera (Luces)
  { name: 'Manguera calida', price: 8000, category: 'Manguera', stock: 3 },
  { name: 'Manguera blanca', price: 8000, category: 'Manguera', stock: 3 },
  { name: 'Manguera multi', price: 8000, category: 'Manguera', stock: 4 },
  { name: 'Manguera blanca-azul', price: 8000, category: 'Manguera', stock: 2 },

  // Otros (Luces)
  { name: 'Rapidita multi 100', price: 10000, category: 'Otros', stock: 9 },
  { name: 'Malla multi 144', price: 7000, category: 'Otros', stock: 5 },
  { name: 'Cortina calida 250', price: 10000, category: 'Otros', stock: 2 },
  { name: 'Luz fuego artificial calida', price: 4000, category: 'Otros', stock: 3 },
  { name: 'Luz fuego artificial multi', price: 4000, category: 'Otros', stock: 3 },
  { name: 'Lampara diseno vela calida', price: 10000, category: 'Otros', stock: 3 },
  { name: 'Meteorito multicolor', price: 7000, category: 'Otros', stock: 1 },
  { name: 'Meteorito calida', price: 7000, category: 'Otros', stock: 3 },
  { name: 'Luz ampolleta jardin', price: 13000, category: 'Otros', stock: 7 },

  // Bolsas (Decoracion)
  { name: 'Bolsas pequena', price: 500, category: 'Bolsas', stock: 12 },
  { name: 'Bolsa mediana', price: 1000, category: 'Bolsas', stock: 12 },
  { name: 'Bolsa grande', price: 1500, category: 'Bolsas', stock: 12 },
  { name: 'Bolsa tipo peluche', price: 1500, category: 'Bolsas', stock: 4 },

  // Esferas
  { name: '9 esferas rojas con lineas blancas', price: 6500, category: 'Esferas', stock: 2 },
  { name: '9 esferas rojas diseno copo de nieve', price: 3000, category: 'Esferas', stock: 3 },
  { name: '9 esferas diseno verde', price: 5000, category: 'Esferas', stock: 2 },
  { name: '9 esferas diseno rojo', price: 6500, category: 'Esferas', stock: 2 },
  { name: '16 esferas arbol rosado', price: 10000, category: 'Esferas', stock: 2 },
  { name: '16 esferas arbol plateado', price: 10000, category: 'Esferas', stock: 2 },
  { name: '16 esferas arbol dorado', price: 10000, category: 'Esferas', stock: 2 },
  { name: '7 esferas rojo', price: 5000, category: 'Esferas', stock: 2 },
  { name: '7 esferas dorado', price: 5000, category: 'Esferas', stock: 2 },
  { name: '7 esferas plateado', price: 5000, category: 'Esferas', stock: 2 },
  { name: '10 esferas rosada', price: 3500, category: 'Esferas', stock: 2 },
  { name: '10 esferas plateada', price: 3500, category: 'Esferas', stock: 2 },
  { name: '10 esferas dorado', price: 3500, category: 'Esferas', stock: 2 },
  { name: '10 esferas rojo', price: 3500, category: 'Esferas', stock: 2 },
  { name: 'maletin bolas calipso', price: 10000, category: 'Esferas', stock: 1 },
  { name: 'maletin bolas celeste', price: 10000, category: 'Esferas', stock: 1 },
  { name: 'maletin bolas rojo', price: 10000, category: 'Esferas', stock: 1 },
  { name: 'bolas plateadas 20', price: 12000, category: 'Esferas', stock: 1 },
  { name: 'esferas forma trineo', price: 3500, category: 'Esferas', stock: 3 },
  { name: 'esferas (caja diseno casa- rojo- dorado- plateado)', price: 3500, category: 'Esferas', stock: 3 },

  // Decoracion general
  { name: 'Guirnalda verde', price: 1500, category: 'Decoracion', stock: 16 },
  { name: 'guirnalda marco puerta rojo', price: 5000, category: 'Decoracion', stock: 1 },
  { name: 'guirnalda marco puerta dorado', price: 5000, category: 'Decoracion', stock: 1 },
  { name: 'adorno madera grande', price: 2000, category: 'Decoracion', stock: 2 },
  { name: 'adorno madera mediano', price: 1500, category: 'Decoracion', stock: 9 },
  { name: 'adorno madera pequeno', price: 1000, category: 'Decoracion', stock: 8 },
  { name: 'adornos rojos brillantes', price: 1200, category: 'Decoracion', stock: 17 },
  { name: 'adornos muneco de nieve', price: 1000, category: 'Decoracion', stock: 2 },
  { name: 'adornos tipo peluche dorado', price: 1000, category: 'Decoracion', stock: 13 },
  { name: 'Corona puerta', price: 1200, category: 'Decoracion', stock: 12 },
  { name: 'Bota roja copos', price: 1500, category: 'Decoracion', stock: 6 },
  { name: 'Bota viejo pascuero', price: 1500, category: 'Decoracion', stock: 3 },
  { name: 'Bota diseno- botones (relieve)', price: 2500, category: 'Decoracion', stock: 2 },
  { name: 'adornos ceramica', price: 1500, category: 'Decoracion', stock: 2 },
  { name: 'adornos ninas', price: 1000, category: 'Decoracion', stock: 8 },
  { name: 'Fundas cojines', price: 1000, category: 'Decoracion', stock: 2 },
  { name: 'estrella arbol', price: 2000, category: 'Decoracion', stock: 6 },
  { name: 'camino de mesa', price: 1000, category: 'Decoracion', stock: 4 },
  { name: 'adornos luces (antiguos)', price: 1000, category: 'Decoracion', stock: 2 },
  { name: 'Camino de mesa delgado', price: 1000, category: 'Decoracion', stock: 2 },
  { name: 'patas largas', price: 5000, category: 'Decoracion', stock: 2 },
  { name: 'mantel', price: 1000, category: 'Decoracion', stock: 3 },
  { name: 'botas pequenas', price: 1000, category: 'Decoracion', stock: 2 },
  { name: 'adorno tipo peluche rojo', price: 1000, category: 'Decoracion', stock: 2 },
  { name: 'pelota cascabel', price: 1500, category: 'Decoracion', stock: 3 },
  { name: 'nombres', price: 1000, category: 'Decoracion', stock: 6 },
  { name: 'servilletas', price: 1000, category: 'Decoracion', stock: 10 },
  { name: 'colgante botas (4)', price: 1500, category: 'Decoracion', stock: 3 },
  { name: 'colgantes viajito (4)', price: 1500, category: 'Decoracion', stock: 2 },
  { name: 'tarjeta de navidad', price: 1000, category: 'Decoracion', stock: 20 },
  { name: 'Vasos coca-cola', price: 2000, category: 'Decoracion', stock: 18 },
  { name: 'arboles de navidad 1.80', price: 15000, category: 'Decoracion', stock: 1 },
  { name: 'Cinta arbol pequena', price: 1000, category: 'Decoracion', stock: 40 },
  { name: 'Cinta arbol grande', price: 1000, category: 'Decoracion', stock: 30 },
  { name: 'Cojin arboles blanco', price: 12000, category: 'Decoracion', stock: 3 },
  { name: 'Cojin copo de nieve rojo', price: 12000, category: 'Decoracion', stock: 3 },
  { name: 'adorno donas doradas (3)', price: 3000, category: 'Decoracion', stock: 4 },
  { name: 'adornos caja con cinta blanca', price: 100, category: 'Decoracion', stock: 3 },
  { name: 'Cintas', price: 600, category: 'Decoracion', stock: 100 },
  { name: 'Scotch', price: 250, category: 'Decoracion', stock: 48 },
];

const ensureStockColumn = async () => {
  const { error } = await supabase.from('products').select('stock').limit(1);
  if (error && `${error.message}`.toLowerCase().includes('stock')) {
    throw new Error(
      'La columna "stock" no existe en la tabla products. Ejecuta supabase/sql/001_add_stock_column.sql en el panel SQL y vuelve a correr este script.',
    );
  }
};

const main = async () => {
  await ensureStockColumn();

  await supabase.from('products').update({ is_active: false }).neq('id', 0);

  const payload = products.map(({ name, price, category, stock }) => ({
    name,
    default_price: price,
    category,
    stock,
    is_active: true,
  }));

  const { error } = await supabase.from('products').insert(payload);
  if (error) {
    console.error('No se pudieron insertar los productos', error);
    process.exit(1);
  }

  console.log(`Insertados ${payload.length} productos. Los existentes quedaron inactivos.`);
};

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
