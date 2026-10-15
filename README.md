# Filtro de compras CASYCO

App web del filtro de autorización de órdenes de compra de DESARROLLO E INGENIERÍA CASYCO.

- **Captura (Compras):** OC de Odoo, monto, proveedor, obra, quién solicita y observaciones.
- **Filtro de autorización:** Hotelería (Manuel Castillo) e Industrial (Jesús Castillo), con alarmas de días.
- **Pagos:** Santander / cuenta personal (Manuel) y Banorte (Dulce), con estados de cuenta por cuenta.
- **Estado financiero, resumen semanal, depósitos y saldos por obra** y reportes ejecutivos.

## Cómo funciona
- Página estática publicada con GitHub Pages (`index.html`).
- Datos y usuarios en Supabase (tabla `docs`, ver `supabase/estructura.sql`). Sólo usuarios con sesión iniciada pueden leer o escribir.
- Para dar acceso a alguien: Supabase → Authentication → Users → Add user (correo y contraseña, con "Auto Confirm User").

## Instalar como app
- **iPhone/iPad:** abrir el link en Safari → Compartir → Agregar a pantalla de inicio.
- **Mac:** abrir el link en Safari → Archivo → Agregar al Dock.
