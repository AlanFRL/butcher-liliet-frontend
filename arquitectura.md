Sistema Carnicería — Arquitectura, Módulos, Casos de Uso y Plan de Prototipo
0) Objetivo del sistema

Sistema online para carnicería con:

POS (Punto de Venta) rápido (PC/táctil/móvil).

Caja/turnos (apertura, movimientos, cierre con arqueo).

Productos y stock.

Integración con periféricos en PC de caja:

Impresora de tickets por USB/red.

Lector de códigos de barras (USB tipo teclado).

Balanza etiquetadora (principalmente por etiquetas con barcode; conexión directa a PC como fase futura).

A futuro:

Pantalla cliente con total y QR de pago.

1) Arquitectura general (alto nivel)
1.1 Componentes

A) Frontend (React PWA)

UI principal (POS, Caja, Productos, Inventario, Reportes).

Responsivo (PC y móvil).

Operación rápida (atajos, favoritos, búsqueda instantánea).

Se comunica con Backend API.

Para imprimir y periféricos en PC: se comunica con Agente Local en localhost.

B) Backend (API NestJS)

Reglas de negocio y seguridad.

Orquesta transacciones: ventas, movimientos de stock, caja.

Auditoría de operaciones críticas.

Expone API REST y (futuro) WebSocket para pantalla cliente/estado pagos.

C) Base de Datos (PostgreSQL)

Persistencia central: usuarios, productos, ventas, caja, inventario, auditoría.

Reglas de integridad (constraints) y consistencia.

D) Agente Local (Windows)

App/servicio instalado en cada PC de caja.

Expone API local (HTTP) en http://localhost:<puerto>.

Gestiona periféricos del SO:

impresión ticket/cierre por USB o red

(futuro) lectura balanza por cable/serial

Mantiene configuración local por terminal (impresora seleccionada, formato, etc.).

1.2 Flujo general de datos

Usuario opera en Frontend.

Frontend llama al Backend para crear/confirmar operaciones.

Backend valida permisos/reglas, guarda en DB y responde.

Si hay impresión:

Frontend manda el “documento a imprimir” al Agente Local (localhost).

Agente imprime y retorna estado “OK/ERROR”.

(Futuro) pantalla cliente/QR: Backend + WebSocket para actualizaciones en tiempo real.

2) Repos / Proyectos (separación clara)

Cada proyecto debe conocer la existencia de los otros y su contrato.

2.1 frontend-pwa

Responsabilidad

UI/UX (POS, Caja, Productos, Inventario).

Manejo de sesión (cuando aplique).

Integración con Backend API.

Integración con Agente Local:

detectar disponibilidad (/health)

enviar trabajos de impresión (/print/*)

No hace

Reglas críticas de negocio (eso va en backend).

Acceso directo a USB/serial (eso va en agente).

2.2 backend-api

Responsabilidad

Autenticación y autorización (roles/permisos).

Reglas y consistencia:

venta = registro + detalle + movimiento inventario + efecto caja

Auditoría.

Reportes y consultas.

No hace

Impresión física (solo prepara “payload” de impresión).

Acceso a hardware.

2.3 local-agent-windows

Responsabilidad

Detectar impresoras instaladas.

Configurar impresora por defecto para tickets.

Recibir payload de impresión y ejecutar impresión.

Registrar logs locales (para soporte).

(Futuro) puerto serial/USB balanza.

No hace

Guardar ventas en DB.

Validar reglas de caja/stock (solo ejecuta acciones de hardware).

3) Contratos entre sistemas (interfaces)
3.1 Contrato Frontend ↔ Backend (API)

REST JSON.

Respuestas con estructura consistente (status, data, error).

(Recomendado) versionado: /api/v1/...

Endpoints base (mínimo MVP)

Auth:

POST /auth/login

POST /auth/logout (opcional)

GET /auth/me

Productos:

GET /products

POST /products

PUT /products/:id

PATCH /products/:id/status

Caja:

POST /cash/open

POST /cash/movement

POST /cash/close

GET /cash/current

Ventas:

POST /sales (crear borrador/pendiente o directo)

POST /sales/:id/pay (confirmar pago)

POST /sales/:id/cancel (opcional MVP)

Reportes (mínimo):

GET /reports/sales/summary?from=&to=

3.2 Contrato Frontend ↔ Agente Local (localhost)

HTTP local (JSON).

El agente corre en la PC, escuchando en un puerto configurado (ej. 5270).

El frontend debe “probar conexión” antes de imprimir.

Endpoints del agente (MVP)

GET /health → { status: "ok", version: "x.y.z" }

GET /printers → lista de impresoras detectadas

POST /config/printer → set impresora por defecto para tickets

POST /print/ticket → imprime ticket de venta

POST /print/cash-close → imprime cierre de caja

GET /logs/recent (opcional) → últimos eventos

Payload estándar de impresión (propuesta)

Enviar un JSON “agnóstico” para que el agente lo traduzca:

{
  "docType": "TICKET",
  "meta": {
    "businessName": "Carnicería X",
    "terminal": "CAJA-1",
    "cashier": "Juan",
    "dateTime": "2025-12-29T10:15:00"
  },
  "items": [
    { "name": "Carne molida", "qty": 1.25, "unit": "kg", "unitPrice": 35.0, "total": 43.75 }
  ],
  "totals": { "subtotal": 43.75, "discount": 0, "tax": 0, "total": 43.75 },
  "payment": { "method": "CASH", "paid": 50, "change": 6.25 },
  "footer": ["Gracias por su compra"]
}


Este contrato evita depender de la impresora; si cambia el modelo, solo cambia el agente.

4) Modelo de usuarios y permisos (propuesta para prototipo)

Aún sin DB, esto se define para pantallas/flows.

Roles iniciales

ADMIN

Configuración general, usuarios, permisos.

Puede todo.

ENCARGADO (MANAGER)

Gestiona productos, precios, inventario.

Ve reportes.

Puede abrir/cerrar caja si se requiere.

CAJERO (CASHIER)

Opera POS.

Abre/cierra su caja (si aplica).

No puede eliminar productos ni ver ciertos reportes sensibles.

Puede reimprimir tickets solo si permiso.

En prototipo, puedes simular roles con un selector “modo” sin login real.

¿Habrá login?

Recomendación:

Sí habrá login en producción (mínimo PIN).

Para prototipo inicial (UI/UX), puedes:

comenzar sin login y con “usuario simulado”

luego agregar login real sin rehacer todo.

5) Navegación post-login (pantallas principales)
Pantalla inicial recomendada (después de login)

Dashboard Operativo (según rol)

Estado de caja: ABIERTA/CERRADA

Acciones rápidas:

Abrir caja / Ir al POS

Cerrar caja

Productos (si rol permite)

Resumen del día (ventas totales, tickets)

Menú/Navbar (estructura)

POS / Ventas

Comandas / Pendientes (fase 2 si aplica)

Caja

Abrir

Movimientos

Cierre

Historial (solo manager/admin)

Productos

Inventario

Reportes

Configuración (solo admin)

6) Módulos y Casos de Uso (CU)
M1. Seguridad y usuarios

CU01 Gestionar Usuarios (Admin)

crear/editar/desactivar

asignar roles

CU02 Autenticación (todos)

login (usuario+PIN o user/pass)

logout

recuperar/rotar PIN (admin)

CU03 Auditoría

listar eventos críticos por fecha/usuario

M2. Productos

CU10 Gestionar Producto (CRUD)

listar, crear, editar, activar/desactivar

CU11 Consultar Producto

búsqueda rápida (POS)

favoritos (fase prototipo)

M3. Inventario

CU20 Registrar Movimiento de Inventario

entrada compra, merma, ajuste, consumo interno

CU21 Consultar Stock

stock actual

kardex (fase 2)

CU22 Inventario físico

conteo y ajuste (fase 3)

M4. Caja y turnos

CU30 Abrir Caja

monto apertura, usuario, terminal

CU31 Movimientos de Caja

ingreso/retiro con motivo

CU32 Cerrar Caja

resumen del turno

arqueo efectivo

diferencias con motivo

impresión cierre

CU33 Historial de Cajas

consultar y reimprimir (permiso)

M5. Ventas (POS)

CU40 Registrar Venta

agregar productos por búsqueda

(futuro) agregar por escaneo

editar/eliminar ítems

CU41 Cobrar Venta

efectivo (cambio)

QR (mostrar QR / marcar pagado)

mixto (fase 2)

imprimir ticket

CU42 Anular/Devolver Venta (fase 2)

motivo obligatorio, auditoría

M6. Periféricos (Agente Local)

CU50 Configurar Impresora

listar impresoras

seleccionar predeterminada

prueba impresión

CU51 Imprimir Documentos

ticket

cierre

reimpresión con auditoría (backend controla permiso)

CU52 Integrar Balanza (futuro)

formato códigos balanza

lectura directa serial (fase futura)

M7. Reportes

CU60 Reporte de Ventas

por rango fecha

por usuario

por método pago

CU61 Reporte Productos

top vendidos, por categoría

CU62 Reporte Inventario

mermas, ajustes (fase 2/3)

7) Flujos operativos (normal)
7.1 Registro de productos (flujo normal)

Manager/Admin → Productos → “Nuevo”

Completa:

nombre, categoría

tipo venta (peso/unidad)

precio

estado activo

(opcional) PLU/código balanza

Guardar

Verificar búsqueda y disponibilidad en POS

7.2 Uso de balanza etiquetadora (flujo recomendado)

En balanza seleccionar producto (PLU)

Pesar corte

Imprimir etiqueta con barcode (incluye producto + peso/precio según configuración)

Pegar etiqueta y llevar al mostrador

En caja (cuando haya lector):

escanear barcode para cargar ítem automáticamente

Conectar balanza a PC es opcional y se deja para fase futura.

7.3 Venta (flujo normal)

Precondición: Caja ABIERTA.

POS → buscar/agregar productos

Ajustar cantidades/pesos

Ver total

Cobrar:

efectivo → paga con → cambio

QR → mostrar QR → confirmar pago

Confirmar → backend registra venta

Front llama a agente local → imprime ticket

7.4 Cierre de caja

Caja → Cerrar

Sistema muestra totales (efectivo/QR + movimientos)

Usuario ingresa efectivo contado

Sistema calcula diferencia y pide motivo si aplica

Confirmar cierre → backend guarda cierre

Front llama agente → imprime cierre

8) MVP vs Fases (para planificar sin bloquear el prototipo)
MVP (para operar en tienda)

Productos CRUD

Abrir/cerrar caja

POS manual (sin escaneo)

Cobro efectivo + QR manual

Impresión ticket y cierre (agente)

Reporte simple (ventas por día)

Fase 2

Lector código de barras

Interpretación códigos balanza

Ventas pendientes (comandas)

Anulaciones/devoluciones controladas

Pagos mixtos

Fase 3

Inventario físico + kardex completo

Pantalla cliente en tiempo real (WebSocket)

Integración directa balanza por cable (si se requiere)

Multi-sucursal

9) Lineamientos del prototipo (Frontend-first)

El prototipo debe:

simular usuario actual (ej. “Cajero Demo”)

simular estado de caja (abierta/cerrada)

permitir flujo completo visual:

abrir caja → POS → cobrar → “imprimir” (mock) → cierre

API real no requerida inicialmente (usar mocks).

10) Crear un nuevo proyecto React desde 0 (recomendado: Vite)

Rápido, moderno, ideal para PWA.

Requisitos

Node.js LTS instalado

npm o pnpm

Pasos

Crear proyecto con Vite + React + TypeScript:

npm create vite@latest frontend-pwa -- --template react-ts
cd frontend-pwa
npm install
npm run dev


Estructura recomendada de carpetas (mínimo):

src/app (rutas/layout)

src/features (módulos: pos, caja, productos)

src/components (UI reusable)

src/services (api client, agent client)

src/types (DTOs compartidos)

(Opcional temprano) agregar router:

npm i react-router-dom


(Opcional) preparar PWA (más adelante en el prototipo)

agregar manifest + service worker con plugin (se define luego).

11) Nota sobre el Agente Local (para repos del agente)

Se desarrollará como app Windows (.NET) tipo:

Windows Service o

Tray app con auto-inicio

Debe exponer API local y logs.

Debe permitir selección de impresora.

12) Glosario

POS: pantalla de ventas/cobro.

Caja/Turno: sesión de cajero con apertura y cierre.

Arqueo: conteo de efectivo real vs esperado.

Comanda: pedido pendiente previo a cobro (fase 2).

PLU: código de producto usado en balanzas.

Fin del documento