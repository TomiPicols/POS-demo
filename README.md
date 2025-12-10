# POS Feria – Demo de Punto de Venta para ferias 🎄

Este repositorio contiene una **demo de punto de venta (POS)** pensada para ferias / eventos (por ejemplo, feria de Navidad).  
La aplicación está construida como una **SPA** con **React + Vite + TypeScript** y usa **Supabase** como backend-as-a-service (auth, base de datos y RLS).


---

## 🧱 Stack tecnológico

- **Frontend:** React 19 + Vite + TypeScript
- **Estilos:** Tailwind CSS
- **Backend-as-a-service:** Supabase
  - PostgreSQL gestionado
  - Auth (usuarios/roles)
  - Row Level Security (RLS)
- **Infraestructura:** Netlify (deploy automático desde GitHub)
- **Base de datos:** scripts SQL en `supabase/sql`

---

## ✨ Funcionalidades (overview)

> Ajusta esta lista según lo que efectivamente hace tu app.

- Flujo de **venta rápida** para feria / puesto:
  - Registro de productos vendidos.
  - Cálculo automático de totales.
- **Control de stock**:
  - Columna de stock en la tabla de productos.
  - Descuento de stock al registrar ventas (según lógica implementada en el frontend).
- **Seguimiento de pagos**:
  - Tracking del estado de pago de las ventas (pagado / pendiente).
- **Cierres de caja y auditoría**:
  - Registro de cierres de caja.
  - Tablas de auditoría para revisar movimientos.
- **Autenticación con Supabase**:
  - Login de usuarios (por ejemplo cajeros / administradores).
  - Acceso restringido a datos según usuario/rol mediante RLS.

---

## 📁 Estructura del repositorio

```txt
POS-demo/
├─ caja-feria/              # App principal (SPA React + Vite)
│  ├─ public/
│  ├─ src/
│  │  ├─ components/        # Componentes reutilizables de UI
│  │  ├─ pages/             # Pantallas principales
│  │  ├─ hooks/             # Hooks personalizados (si aplica)
│  │  ├─ lib/               # Cliente Supabase y utilidades
│  │  └─ main.tsx           # Punto de entrada de la app
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ tailwind.config.mjs
├─ supabase/
│  └─ sql/                  # Scripts SQL para la base de datos
│     ├─ 001_add_stock_column.sql
│     ├─ 002_rls_auth.sql
│     ├─ 003_add_paid_tracking.sql
│     └─ 004_add_cash_closing_audit.sql
├─ package.json             # Dependencias a nivel raíz (si se usan)
└─ README.md
