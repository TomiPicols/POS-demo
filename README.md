<p align="center">
  <img src="public/caja-feria-logo.png" alt="Caja Feria logo" width="120" />
</p>

<h1 align="center">Caja Feria · Punto de Venta para ferias y eventos 🎄🛒</h1>

<p align="center">
  <b>Vende rápido. Controla tu stock. Cierra caja sin dolores de cabeza.</b>
</p>

<p align="center">
  <img alt="Stack" src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white&labelColor=20232a" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-frontend-646CFF?logo=vite&logoColor=white&labelColor=191919" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-backend_as_a_service-3ECF8E?logo=supabase&logoColor=white&labelColor=181818" />
  <img alt="Tailwind" src="https://img.shields.io/badge/TailwindCSS-UI-38BDF8?logo=tailwindcss&logoColor=white&labelColor=0F172A" />
</p>

---

## 🎯 ¿Qué es Caja Feria?

**Caja Feria** es una aplicación de punto de venta (POS) pensada para ferias y eventos de temporada:

- Ferias navideñas y de decoración  
- Emprendedores que montan puestos por días o semanas  
- Ferias municipales y comunitarias  
- Kermesses de colegios y ventas solidarias  

Está diseñada para escenarios donde:

- El tiempo de atención es clave ⏱️  
- El stock es limitado 📦  
- Hay que dejar un cierre de caja claro al final del día ✅  

---

## 💎 Por qué es distinta

- **Simple de usar**: la puede usar alguien que nunca ha tocado un POS antes.
- **Pensada para ferias**: soporta pedidos en paralelo, pagos pendientes y stock acotado.
- **Visual y minimalista**: interfaz limpia, con foco en los productos y en el flujo de venta.
- **Tecnología moderna**: React + Vite + Supabase + Tailwind; ideal para extender y personalizar.

---

## ✨ Funcionalidades principales

### 🧾 Registro de ventas rápido
- Interfaz tipo “cartas” de producto.
- Filtros por categoría (esferas, decoración, luces, etc.).
- Buscador rápido para encontrar productos por nombre.

### 📦 Control de stock
- Cada producto muestra el stock disponible.
- Indicación visual de productos agotados.
- Previene sobreventas en ferias con inventario limitado.

### 💳 Múltiples formas de pago
- Efectivo, Tarjeta, Transferencia y estado Pendiente.
- Pensado para la realidad de ferias y ventas en terreno.

### 🧺 Pedidos en paralelo
- Manejo de **varios pedidos abiertos al mismo tiempo**.
- Ideal cuando un cliente sigue eligiendo mientras otro ya quiere pagar.

### ⏸️ Gestión de pedidos pendientes
- Marca pedidos como Pendientes.
- Permite retomarlos luego cuando el cliente vuelve a pagar.

### ✅ Cierres de caja con auditoría
- Resumen de ventas por medio de pago.
- Registro de cierres de caja con observaciones.
- Ayuda a detectar diferencias entre lo teórico y lo que hay en la caja.

### 👥 Usuarios autenticados
- Acceso mediante usuario/contraseña.
- Reglas de seguridad basadas en Supabase (Row Level Security).

---

## 🧱 Stack tecnológico

- **Frontend:** React 19 + Vite + TypeScript  
- **Estilos:** Tailwind CSS  
- **Backend-as-a-service:** Supabase  
  - PostgreSQL gestionado  
  - Autenticación de usuarios  
  - Row-Level Security (RLS)  
- **Despliegue:** pensado para Netlify / Vercel / similares

Estructura general:

```txt
POS-demo/
├─ public/           # assets públicos (favicon, logo, etc.)
├─ src/              # código fuente (React)
│  ├─ components/
│  ├─ pages/
│  ├─ lib/           # cliente Supabase, helpers, etc.
│  └─ main.tsx
├─ index.html
├─ package.json
└─ vite.config.ts
