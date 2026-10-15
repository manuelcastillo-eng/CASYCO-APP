# Filtro de compras CASYCO

App web del filtro de autorización de órdenes de compra de DESARROLLO E INGENIERÍA CASYCO.

- **Captura (Compras):** OC de Odoo, monto, proveedor, obra, quién solicita y observaciones.
- **Filtro de autorización:** Hotelería (Manuel Castillo) e Industrial (Jesús Castillo), con alarmas de días.
- **Pagos:** Santander / cuenta personal (Manuel) y Banorte (Dulce), con estados de cuenta por cuenta.
- **Estado financiero, resumen semanal, depósitos y saldos por obra** y reportes ejecutivos.

## Cómo funciona
- Página estática publicada con GitHub Pages (`index.html`).
- Datos y usuarios en Supabase (tabla `docs`, ver `supabase/estructura.sql`). Sólo usuarios con sesión iniciada pueden leer o escribir.
- Para dar acceso a alguien:
  1. Supabase → Authentication → Users → Add user (correo y contraseña, con "Auto Confirm User").
  2. En la app: Catálogos → Usuarios y permisos → correo + permiso (Compras, Contabilidad o Dirección).

## Permisos
| Permiso | Ve | Puede |
|---|---|---|
| Compras | Captura, Filtro (consulta), Catálogos | Capturar OCs; registrar proveedores, obras y quién solicita |
| Contabilidad | Todo | Además: registrar pagos, depósitos y devoluciones |
| Dirección | Todo | Además: autorizar, mandar a revisión, cancelar y dar permisos |

Los permisos se aplican en la base de datos (`supabase/02-permisos-y-catalogos.sql`), no sólo en pantalla.

## Catálogos
- **Proveedores:** nombre comercial, beneficiario, CLABE (se valida el dígito de control) y banco (se sugiere con la CLABE). Sólo se pueden capturar OCs con proveedores registrados.
- **Obras** con su división, y **quién solicita**.

## Instalar como app
- **iPhone/iPad:** abrir el link en Safari → Compartir → Agregar a pantalla de inicio.
- **Mac:** abrir el link en Safari → Archivo → Agregar al Dock.
