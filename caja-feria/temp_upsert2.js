import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
const env = fs.readFileSync('.env','utf-8');
const url=(process.env.VITE_SUPABASE_URL||(env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]||'')).trim();
const anon=(process.env.VITE_SUPABASE_ANON_KEY||(env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]||'')).trim();
if(!url||!anon){console.error('Missing supabase env');process.exit(1);}
const supabase=createClient(url,anon);
const products=[
  // Bolsas (Decoración)
  ['Bolsas pequeña',500,'Decoracion',12],
  ['Bolsa mediana',1000,'Decoracion',12],
  ['Bolsa grande',1500,'Decoracion',12],
  ['Bolsa tipo peluche',1500,'Decoracion',4],
  // Esferas
  ['9 esferas rojas con lineas blancas',6500,'Esferas',2],
  ['9 esferas rojas diseño copo de nieve',3000,'Esferas',3],
  ['9 esferas diseño verde',5000,'Esferas',2],
  ['9 esferas diseño rojo',6500,'Esferas',2],
  ['16 esferas arbol rosado',10000,'Esferas',2],
  ['16 esferas arbol plateado',10000,'Esferas',2],
  ['16 esferas arbol dorado',10000,'Esferas',2],
  ['7 esferas rojo',5000,'Esferas',2],
  ['7 esferas dorado',5000,'Esferas',2],
  ['7 esferas plateado',5000,'Esferas',2],
  ['10 esferas rosada',3500,'Esferas',2],
  ['10 esferas plateada',3500,'Esferas',2],
  ['10 esferas dorado',3500,'Esferas',2],
  ['10 esferas rojo',3500,'Esferas',2],
  ['maletin bolas calipso',10000,'Esferas',1],
  ['maletin bolas celeste',10000,'Esferas',1],
  ['maletin bolas rojo',10000,'Esferas',1],
  ['bolas plateadas 20',12000,'Esferas',1],
  ['esferas forma trineo',3500,'Esferas',3],
  ['esferas (caja diseño casa- rojo- dorado- plateado)',3500,'Esferas',3],
  // Decoracion
  ['Guirnalda verde',1500,'Decoracion',16],
  ['guirnalda marco puerta rojo',5000,'Decoracion',1],
  ['guirnalda marco puerta dorado',5000,'Decoracion',1],
  ['adorno madera grande',2000,'Decoracion',2],
  ['adorno madera mediano',1500,'Decoracion',9],
  ['adorno madera pequeño',1000,'Decoracion',8],
  ['adornos rojos brillantes',1200,'Decoracion',17],
  ['adornos muñeco de nieve',1000,'Decoracion',2],
  ['adornos tipo peluche dorado',1000,'Decoracion',13],
  ['Corona puerta',1200,'Decoracion',12],
  ['Bota roja copos',1500,'Decoracion',6],
  ['Bota viejo pascuero',1500,'Decoracion',3],
  ['Bota diseño- botones (relieve)',2500,'Decoracion',2],
  ['adornos ceramica',1500,'Decoracion',2],
  ['adornos niñas',1000,'Decoracion',8],
  ['Fundas cojines',1000,'Decoracion',2],
  ['estrella arbol',2000,'Decoracion',6],
  ['camino de mesa',1000,'Decoracion',4],
  ['adornos luces (antiguos)',1000,'Decoracion',2],
  ['Camino de mesa delgado',1000,'Decoracion',2],
  ['patas largas',5000,'Decoracion',2],
  ['mantel',1000,'Decoracion',3],
  ['botas pequeñas',1000,'Decoracion',2],
  ['adorno tipo peluche rojo',1000,'Decoracion',2],
  ['pelota cascabel',1500,'Decoracion',3],
  ['nombres',1000,'Decoracion',6],
  ['servilletas',1000,'Decoracion',10],
  ['colgante botas (4)',1500,'Decoracion',3],
  ['colgantes viajito (4)',1500,'Decoracion',2],
  ['tarjeta de navidad',1000,'Decoracion',20],
  ['Vasos coca- cola',2000,'Decoracion',18],
  ['arboles de navidad 1.80',15000,'Decoracion',1],
  ['Cinta arbol pequeña',1000,'Decoracion',40],
  ['Cinta arbol grande',1000,'Decoracion',30],
  ['Cojin arboles blanco',12000,'Decoracion',3],
  ['Cojin copo de nieve rojo',12000,'Decoracion',3],
  ['adorno donas doradas (3)',3000,'Decoracion',4],
  ['adornos caja con cinta blanca',100,'Decoracion',3],
  ['Cintas',600,'Decoracion',100],
  ['Scotch',250,'Decoracion',48],
];

const run = async () => {
  const payload = products.map(([name, price, category, stock]) => ({
    name,
    default_price: price,
    category,
    stock,
    is_active: true,
  }));
  const { error } = await supabase.from('products').insert(payload);
  if (error) {
    console.error('Insert error', error);
    process.exit(1);
  }
  console.log('Inserted extra', payload.length);
};
run();
