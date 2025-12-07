import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
const env = fs.readFileSync('.env','utf-8');
const url=(process.env.VITE_SUPABASE_URL||(env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]||'')).trim();
const anon=(process.env.VITE_SUPABASE_ANON_KEY||(env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]||'')).trim();
if(!url||!anon){console.error('Missing supabase env');process.exit(1);} 
const supabase=createClient(url,anon);

const items = [
  // Cascadas
  ['Cascada blanca 100', 5500, 'Cascadas'],
  ['Cascada calida 100', 5500, 'Cascadas'],
  ['Cascada multi 100', 5500, 'Cascadas'],
  ['Cascada blanca 200', 6500, 'Cascadas'],
  ['Cascada calida 200', 6500, 'Cascadas'],
  ['Cascada multi 200', 6500, 'Cascadas'],
  ['Cascada casa estrella calida 136', 8500, 'Cascadas'],
  ['Cascada multi nieve 200', 8500, 'Cascadas'],
  ['Cascada estrella 120', 8500, 'Cascadas'],
  ['Cascada esfera regalo multi 110', 8500, 'Cascadas'],
  ['Cascada esfera navidad calida', 10000, 'Cascadas'],
  ['Cascada brillo multi', 10000, 'Cascadas'],
  // Leds
  ['Led rojo 100', 2500, 'Leds'],
  ['Led azul 100', 2500, 'Leds'],
  ['Led lila 100', 2500, 'Leds'],
  ['Led blanco 100', 2500, 'Leds'],
  ['Led calido 100', 2500, 'Leds'],
  ['Led multi 200', 3500, 'Leds'],
  ['Led rojo 200', 3500, 'Leds'],
  ['Led azul 200', 2500, 'Leds'],
  ['Led multi 100', 2500, 'Leds'],
  // Solar
  ['Luz solar copo de nieve multi', 3500, 'Solar'],
  ['Luz solar gota calida', 3500, 'Solar'],
  ['Luz solar gota multi', 3500, 'Solar'],
  ['Luz solar pelota', 3500, 'Solar'],
  // Cenefa
  ['Cenefa estrella blanca 120', 6000, 'Cenefa'],
  ['Cenefa estrella multi 120', 6000, 'Cenefa'],
  ['Cenefa estrella calida 120', 6000, 'Cenefa'],
  // Manguera
  ['Manguera calida', 8000, 'Manguera'],
  ['Manguera blanca', 8000, 'Manguera'],
  ['Manguera multi', 8000, 'Manguera'],
  ['Manguera blanca-azul', 8000, 'Manguera'],
  // Otros
  ['Rapidita multi 100', 10000, 'Otros'],
  ['Malla multi 144', 7000, 'Otros'],
  ['Cortina calida 250', 10000, 'Otros'],
  ['Luz fuego artificial calida', 4000, 'Otros'],
  ['Luz fuego artificial multi', 4000, 'Otros'],
  ['Lampara diseño vela calida', 10000, 'Otros'],
  ['Meteorito multicolor', 7000, 'Otros'],
  ['Meteorito calida', 7000, 'Otros'],
  ['Luz ampolleta jardin', 13000, 'Otros'],
  // Bolsas
  ['Bolsas pequeña', 500, 'Decoracion'],
  ['Bolsa mediana', 1000, 'Decoracion'],
  ['Bolsa grande', 1500, 'Decoracion'],
  ['Bolsa tipo peluche', 1500, 'Decoracion'],
  // Esferas
  ['9 esferas rojas con lineas blancas', 6500, 'Esferas'],
  ['9 esferas rojas diseño copo de nieve', 3000, 'Esferas'],
  ['9 esferas diseño verde', 5000, 'Esferas'],
  ['9 esferas diseño rojo', 6500, 'Esferas'],
  ['16 esferas arbol rosado', 10000, 'Esferas'],
  ['16 esferas arbol plateado', 10000, 'Esferas'],
  ['16 esferas arbol dorado', 10000, 'Esferas'],
  ['7 esferas rojo', 5000, 'Esferas'],
  ['7 esferas dorado', 5000, 'Esferas'],
  ['7 esferas plateado', 5000, 'Esferas'],
  ['10 esferas rosada', 3500, 'Esferas'],
  ['10 esferas plateada', 3500, 'Esferas'],
  ['10 esferas dorado', 3500, 'Esferas'],
  ['10 esferas rojo', 3500, 'Esferas'],
  ['maletin bolas calipso', 10000, 'Esferas'],
  ['maletin bolas celeste', 10000, 'Esferas'],
  ['maletin bolas rojo', 10000, 'Esferas'],
  ['bolas plateadas 20', 12000, 'Esferas'],
  ['esferas forma trineo', 3500, 'Esferas'],
  ['esferas (caja diseño casa- rojo- dorado- plateado)', 3500, 'Esferas'],
  // Decoracion
  ['Guirnalda verde', 1500, 'Decoracion'],
  ['guirnalda marco puerta rojo', 5000, 'Decoracion'],
  ['guirnalda marco puerta dorado', 5000, 'Decoracion'],
  ['adorno madera grande', 2000, 'Decoracion'],
  ['adorno madera mediano', 1500, 'Decoracion'],
  ['adorno madera pequeño', 1000, 'Decoracion'],
  ['adornos rojos brillantes', 1200, 'Decoracion'],
  ['adornos muñeco de nieve', 1000, 'Decoracion'],
  ['adornos tipo peluche dorado', 1000, 'Decoracion'],
  ['Corona puerta', 1200, 'Decoracion'],
  ['Bota roja copos', 1500, 'Decoracion'],
  ['Bota viejo pascuero', 1500, 'Decoracion'],
  ['Bota diseño- botones (relieve)', 2500, 'Decoracion'],
  ['adornos ceramica', 1500, 'Decoracion'],
  ['adornos niñas', 1000, 'Decoracion'],
  ['Fundas cojines', 1000, 'Decoracion'],
  ['estrella arbol', 2000, 'Decoracion'],
  ['camino de mesa', 1000, 'Decoracion'],
  ['adornos luces (antiguos)', 1000, 'Decoracion'],
  ['Camino de mesa delgado', 1000, 'Decoracion'],
  ['patas largas', 5000, 'Decoracion'],
  ['mantel', 1000, 'Decoracion'],
  ['botas pequeñas', 1000, 'Decoracion'],
  ['adorno tipo peluche rojo', 1000, 'Decoracion'],
  ['pelota cascabel', 1500, 'Decoracion'],
  ['nombres', 1000, 'Decoracion'],
  ['servilletas', 1000, 'Decoracion'],
  ['colgante botas (4)', 1500, 'Decoracion'],
  ['colgantes viajito (4)', 1500, 'Decoracion'],
  ['tarjeta de navidad', 1000, 'Decoracion'],
  ['Vasos coca- cola', 2000, 'Decoracion'],
  ['arboles de navidad 1.80', 15000, 'Decoracion'],
  ['Cinta arbol pequeña', 1000, 'Decoracion'],
  ['Cinta arbol grande', 1000, 'Decoracion'],
  ['Cojin arboles blanco', 12000, 'Decoracion'],
  ['Cojin copo de nieve rojo', 12000, 'Decoracion'],
  ['adorno donas doradas (3)', 3000, 'Decoracion'],
  ['adornos caja con cinta blanca', 100, 'Decoracion'],
  ['Cintas', 600, 'Decoracion'],
  ['Scotch', 250, 'Decoracion'],
];

const run = async () => {
  await supabase.from('products').update({ is_active: false }).neq('id', 0);
  const payload = items.map(([name, price, category]) => ({ name, default_price: price, category, is_active: true }));
  const { error } = await supabase.from('products').insert(payload);
  if (error) {
    console.error('Insert error', error);
    process.exit(1);
  }
  console.log('Inserted', payload.length);
};
run();
