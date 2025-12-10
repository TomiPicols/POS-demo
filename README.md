# Caja Feria – Punto de Venta para ferias y eventos 🎄🛒

**Caja Feria** es una aplicación de punto de venta (POS) pensada para **ferias temporales, eventos especiales y campañas de temporada**.  
Está optimizada para escenarios como ferias navideñas, kermesses, ferias municipales o ventas solidarias, donde se necesita:

- Vender rápido.
- Controlar un stock limitado.
- Hacer cierres de caja claros al final del día.

---

## 🎯 ¿Para quién es?

Caja Feria puede ser útil para:

- **Ferias navideñas y de temporada** (decoración, regalos, artesanía).
- **Emprendedores** que montan puestos por días o semanas.
- **Municipios** que organizan ferias y necesitan orden en las cajas.
- **Colegios y centros comunitarios** que hacen kermesses o bingos.
- **ONGs y fundaciones** que realizan ventas solidarias puntuales.

La idea es entregar una herramienta liviana, clara y visualmente amigable para que cualquier persona pueda usarla en caja sin enredarse.

---

## ✨ Funcionalidades principales

- 🧾 **Registro de ventas rápido**  
  Interfaz con tarjetas de producto y filtros por categoría para seleccionar productos en pocos clics.

- 📦 **Control de stock**  
  Cada producto muestra el stock disponible y avisa cuando está agotado, ayudando a evitar sobreventas.

- 💳 **Múltiples formas de pago**  
  Soporte para **Efectivo**, **Tarjeta**, **Transferencia** y estado **Pendiente**, adaptándose a la realidad de las ferias.

- 🧺 **Pedidos en paralelo**  
  Posibilidad de llevar **varios pedidos abiertos** (por ejemplo, si un cliente sigue eligiendo y otro ya quiere pagar).

- ⏸️ **Gestión de pedidos pendientes**  
  Registro de pedidos que aún no se han pagado completamente, ideal para reservas o pagos diferidos.

- ✅ **Cierres de caja con auditoría**  
  Módulo de cierre para comparar lo esperado vs lo contado en caja y dejar un registro de cada cierre.

- 👥 **Usuarios con autenticación**  
  Acceso mediante usuario/contraseña y seguridad basada en políticas de Supabase (RLS).

- 🧼 **Interfaz simple y minimalista**  
  Diseñada para que cajeros y encargados puedan aprender a usarla en pocos minutos.

---

## 🧱 Stack tecnológico (resumen)

- **Frontend:** React + Vite + TypeScript  
- **Estilos:** Tailwind CSS  
- **Backend-as-a-service:** [Supabase](https://supabase.com/)  
  - PostgreSQL gestionado  
  - Autenticación de usuarios  
  - Row-Level Security (RLS) para control de acceso  
- **Infraestructura de despliegue:** pensada para servicios tipo Netlify / Vercel
```txt
