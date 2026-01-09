Modelo de Datos (PostgreSQL) — Sistema Carnicería
Convenciones

PK: id tipo uuid

Fechas: created_at, updated_at (timestamp)

Soft delete opcional: deleted_at (si quieres)

Estados: enums o varchar con CHECK

Dinero: numeric(12,2) (evitar float)

Cantidades/pesos: numeric(12,3) (para kg/gr con precisión)

1) Seguridad y usuarios
1.1 roles

CU: CU01 Gestionar Usuarios (roles), CU02 Auth

id uuid PK

name varchar(50) UNIQUE (ADMIN, MANAGER, CASHIER)

description varchar(200) NULL

created_at, updated_at

1.2 users

CU: CU01, CU02, CU30–CU33, CU40–CU42, CU03 Auditoría

id uuid PK

role_id uuid FK → roles.id

username varchar(50) UNIQUE

full_name varchar(120)

pin_hash varchar(255) NULL (si login por PIN)

password_hash varchar(255) NULL (si login user/pass)

is_active boolean default true

last_login_at timestamp NULL

created_at, updated_at

1.3 audit_logs

CU: CU03 Auditoría (todo lo crítico)

id uuid PK

user_id uuid FK → users.id NULL (si evento de sistema)

action varchar(80) (ej: CASH_OPEN, SALE_VOID, PRODUCT_UPDATE)

entity_type varchar(60) (Sale, Product, CashSession…)

entity_id uuid NULL

payload jsonb NULL (detalle: antes/después, motivo)

ip varchar(45) NULL

user_agent varchar(200) NULL

created_at timestamp

2) Catálogo: productos y códigos
2.1 product_categories

CU: CU10 Gestionar Producto, CU11 Consultar

id uuid PK

name varchar(80) UNIQUE

created_at, updated_at

2.2 products

CU: CU10 Gestionar Producto, CU11 Consultar, CU40 Registrar Venta

id uuid PK

category_id uuid FK → product_categories.id NULL

sku varchar(50) UNIQUE (código interno)

name varchar(150)

sale_type varchar(20) CHECK IN ('WEIGHT','UNIT') (peso/unidad)

unit varchar(10) default 'kg' (kg, g, unit, etc.)

price numeric(12,2) (precio por kg o por unidad según sale_type)

tax_rate numeric(5,2) default 0 (porcentaje, si aplica)

is_active boolean default true

track_stock boolean default true

created_at, updated_at

(Recomendado) 2.3 product_prices (historial de precios)

CU: CU10 (edición), Reportes

id uuid PK

product_id uuid FK → products.id

price numeric(12,2)

starts_at timestamp

ends_at timestamp NULL

changed_by uuid FK → users.id NULL

created_at

2.4 product_barcodes

CU: CU53 Escaneo, CU52 Balanza (etiquetas), CU40 Venta por escaneo

id uuid PK

product_id uuid FK → products.id

barcode varchar(80) UNIQUE

type varchar(20) CHECK IN ('EAN','CUSTOM','SCALE')

notes varchar(120) NULL

created_at, updated_at

Para códigos “de balanza” (que incluyen peso/precio), normalmente NO se guardan todos (serían infinitos).
Aquí guardas códigos fijos (EAN del producto, etc.).
Los de balanza se interpretan con una configuración (ver scale_configs más abajo).

3) Pedidos y reservas
3.1 customers

CU: CU60 Gestionar Pedidos (nuevo)

id uuid PK

name varchar(150) NOT NULL

phone varchar(30) NOT NULL

email varchar(150) NULL

address text NULL

notes text NULL

created_at, updated_at

3.2 orders

CU: CU60 Gestionar Pedidos

id uuid PK

order_number integer UNIQUE NOT NULL (auto-incrementado: #001, #002...)

customer_id uuid FK → customers.id

customer_name varchar(150) NOT NULL (snapshot)

customer_phone varchar(30) NOT NULL (snapshot)

status varchar(20) CHECK IN ('PENDING','READY','DELIVERED','CANCELLED') default 'PENDING'

priority varchar(20) CHECK IN ('LOW','NORMAL','HIGH','URGENT') default 'NORMAL'

delivery_date date NOT NULL (fecha de entrega programada)

delivery_time time NOT NULL (hora de entrega programada)

subtotal numeric(12,2) NOT NULL

discount numeric(12,2) default 0

total numeric(12,2) NOT NULL

notes text NULL

created_by uuid FK → users.id NOT NULL (usuario que registró el pedido)

created_at timestamp NOT NULL

updated_at timestamp NOT NULL

completed_at timestamp NULL (cuando se marcó como DELIVERED)

cancelled_at timestamp NULL (cuando se canceló)

cancellation_reason text NULL (motivo de cancelación)

Índices recomendados:

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

3.3 order_items

CU: CU60 Gestionar Pedidos

id uuid PK

order_id uuid FK → orders.id ON DELETE CASCADE

product_id uuid FK → products.id (referencia para actualizar stock en el futuro)

product_name varchar(150) NOT NULL (snapshot)

product_sku varchar(50) NOT NULL (snapshot)

sale_type varchar(20) CHECK IN ('PESO','UNIDAD') NOT NULL

qty numeric(12,3) NOT NULL (cantidad: kg o unidades)

unit varchar(10) NOT NULL (kg, und)

unit_price numeric(12,2) NOT NULL (precio unitario al momento del pedido)

total numeric(12,2) NOT NULL (qty * unit_price)

notes text NULL (notas específicas del producto)

created_at timestamp NOT NULL

Justificación:

Los items guardan snapshots (nombre, SKU, precio) del producto al momento de crear el pedido
Esto preserva la información histórica aunque el producto cambie posteriormente
La relación con products.id se mantiene para futuras funcionalidades (descuento de stock automático)

4) Inventario (stock) por almacén + movimientos (kardex)
4.1 warehouses

CU: CU21 Consultar Stock, CU20 Movimientos

id uuid PK

name varchar(80) UNIQUE (Cámara, Mostrador, Bodega)

is_active boolean default true

created_at, updated_at

3.2 inventory_balances

CU: CU21 Consultar Stock (rápido)

id uuid PK

product_id uuid FK → products.id

warehouse_id uuid FK → warehouses.id

qty numeric(12,3) default 0 (kg o unidades según producto)

updated_at

Esta tabla es el “saldo actual” para consultas rápidas.
Se actualiza con cada movimiento.

3.3 inventory_movements

CU: CU20 Registrar Movimiento, CU40 Venta (salida), CU42 Devolución/Anulación

id uuid PK

type varchar(25) CHECK IN (
'PURCHASE_IN','ADJUST_IN','ADJUST_OUT','WASTE','SALE_OUT','RETURN_IN','TRANSFER_OUT','TRANSFER_IN','INTERNAL_USE'
)

product_id uuid FK → products.id

warehouse_id uuid FK → warehouses.id

qty numeric(12,3) (positivo siempre; el type define entrada/salida)

unit_cost numeric(12,2) NULL (si luego controlas costo)

reference_type varchar(40) NULL (Sale, CashSession, Manual, etc.)

reference_id uuid NULL (id de venta, etc.)

reason varchar(200) NULL (obligatorio en ajustes/mermas)

created_by uuid FK → users.id

created_at timestamp

4) Caja (turnos) y movimientos de dinero
4.1 terminals

CU: CU30 Abrir Caja, multi-caja

id uuid PK

name varchar(50) UNIQUE (CAJA-1, CAJA-2)

location varchar(80) NULL

is_active boolean default true

created_at, updated_at

4.2 cash_sessions

CU: CU30 Abrir Caja, CU32 Cerrar Caja, CU33 Historial

id uuid PK

terminal_id uuid FK → terminals.id

user_id uuid FK → users.id (cajero responsable)

status varchar(15) CHECK IN ('OPEN','CLOSED')

opened_at timestamp

opening_amount numeric(12,2)

opening_note varchar(200) NULL

closed_at timestamp NULL

closing_note varchar(200) NULL

expected_cash numeric(12,2) NULL (calculado al cerrar)

counted_cash numeric(12,2) NULL (ingresado por cajero)

cash_difference numeric(12,2) NULL (counted - expected)

created_at, updated_at

4.3 cash_movements

CU: CU31 Movimientos de Caja

id uuid PK

cash_session_id uuid FK → cash_sessions.id

type varchar(15) CHECK IN ('IN','OUT')

amount numeric(12,2)

reason varchar(200) (obligatorio)

created_by uuid FK → users.id

created_at timestamp

5) Ventas (POS) + pagos + tickets
5.1 sales

CU: CU40 Registrar Venta, CU41 Cobrar, CU42 Anular/Devolver, CU60 Reportes

id uuid PK

cash_session_id uuid FK → cash_sessions.id

terminal_id uuid FK → terminals.id

user_id uuid FK → users.id (cajero)

status varchar(15) CHECK IN ('DRAFT','COMPLETED','CANCELLED','REFUNDED')

sale_number bigint UNIQUE (correlativo; opcional por terminal)

subtotal numeric(12,2)

discount_total numeric(12,2) default 0

tax_total numeric(12,2) default 0

total numeric(12,2)

notes varchar(200) NULL

created_at, updated_at

completed_at timestamp NULL

DRAFT sirve para “pendiente/comanda” o venta en espera.

5.2 sale_items

CU: CU40 Registrar Venta

id uuid PK

sale_id uuid FK → sales.id

product_id uuid FK → products.id

name_snapshot varchar(150) (nombre al momento de vender)

sale_type_snapshot varchar(20) CHECK IN ('WEIGHT','UNIT')

qty numeric(12,3)

unit_price numeric(12,2)

discount numeric(12,2) default 0

total numeric(12,2)

barcode_scanned varchar(80) NULL (si se agregó por escaneo)

created_at

“snapshot” evita que cambios futuros del producto alteren ventas pasadas.

5.3 payments

CU: CU41 Cobrar (efectivo/QR/mixto)

id uuid PK

sale_id uuid FK → sales.id

method varchar(15) CHECK IN ('CASH','QR','CARD','MIXED')

amount numeric(12,2)

cash_paid numeric(12,2) NULL (si efectivo)

cash_change numeric(12,2) NULL (si efectivo)

provider varchar(40) NULL (si QR: proveedor)

provider_ref varchar(80) NULL (id transacción, si existe)

status varchar(15) CHECK IN ('PENDING','CONFIRMED','REJECTED') default 'CONFIRMED'

created_at

Para pago mixto, puedes crear 2 filas: una CASH y una QR (recomendado), en vez de MIXED.

5.4 print_jobs

CU: CU51 Imprimir Documentos, reintentos, auditoría

id uuid PK

terminal_id uuid FK → terminals.id

user_id uuid FK → users.id

doc_type varchar(20) CHECK IN ('SALE_TICKET','CASH_CLOSE','REPORT')

reference_id uuid NULL (sale_id o cash_session_id)

payload jsonb (lo que se manda al agente)

status varchar(15) CHECK IN ('PENDING','SENT','PRINTED','FAILED')

error_message varchar(200) NULL

attempts int default 0

created_at, updated_at

Esto te permite: “venta OK pero impresión falló → reintentar”.

6) Configuración de periféricos y balanza
6.1 terminal_configs

CU: CU50 Configurar Impresora, CU51

id uuid PK

terminal_id uuid FK → terminals.id

agent_base_url varchar(120) default 'http://localhost:5270
'

default_printer_name varchar(120) NULL

receipt_paper_width varchar(10) default '80mm'

created_at, updated_at

6.2 scale_configs (config para interpretar códigos de balanza)

CU: CU52 / CU53 (escaneo etiquetas balanza)

id uuid PK

name varchar(80) (“Balanza Marca X Modelo Y”)

barcode_format varchar(30) (ej: “PREFIX+PLU+WEIGHT+CHECKSUM”)

prefix varchar(10) NULL

plu_digits int NULL

weight_digits int NULL

weight_decimals int NULL

price_digits int NULL

price_decimals int NULL

created_at, updated_at

Mapeo de Casos de Uso (CU) → Tablas
CU01 Gestionar Usuarios

Tablas: roles, users

CRUD sobre roles y users, validación de PIN/password

CU02 Autenticar Usuario

Tablas: users

Login con PIN/password, actualizar last_login_at

CU03 Consultar Auditoría

Tablas: audit_logs

Buscar eventos por usuario, tabla, acción, rango de fecha

CU10 Gestionar Productos

Tablas: products, product_categories, product_prices

CRUD de productos, vincular categoría, actualizar precio

CU11 Consultar Productos

Tablas: products, product_barcodes

Búsqueda por nombre, SKU, código de barras

CU20 Gestionar Inventario

Tablas: stock_movements, inventory

Registrar entradas/salidas, actualizar stock en inventories

CU30–CU33 Gestión de Caja

Tablas: terminals, cash_sessions, cash_session_movements

Abrir/cerrar sesión de caja, registrar movimientos de efectivo

CU40–CU42 Registrar Ventas

Tablas: sales, sale_items, sale_payments, inventory (ajustes), cash_sessions

Generar venta, aplicar formas de pago, descontar stock

CU43 Consultar Reportes

Tablas: sales, sale_items

Sumar ventas por período, producto, categoría, etc.

CU50 Configurar Impresora

Tablas: terminal_configs

Setear nombre de impresora, ancho de papel

CU51 Configurar Agente de Impresión

Tablas: terminal_configs

URL del agente local

CU52 Configurar Balanza

Tablas: scale_configs

Formato de códigos de balanza (PREFIX, PLU, WEIGHT, etc.)

CU53 Escanear Códigos de Barras

Tablas: product_barcodes, products

Lookup en product_barcodes, obtener product_id

CU60 Gestionar Pedidos (NUEVO)

Tablas: customers, orders, order_items

CRUD de pedidos y clientes, control de estados, alertas de pedidos atrasados

Subcasos:

CU60.1: Crear nuevo pedido (registrar cliente, productos, fecha/hora de entrega)

CU60.2: Actualizar estado del pedido (PENDING→READY→DELIVERED)

CU60.3: Cancelar pedido (registrar motivo de cancelación)

CU60.4: Consultar pedidos atrasados (delivery_date + delivery_time < NOW())

CU60.5: Buscar pedidos por cliente (nombre o teléfono)

CU60.6: Ver pedidos del día (delivery_date = CURDATE())

6.3 scale_product_map

CU: CU52 Asociar PLU con producto

id uuid PK

scale_config_id uuid FK → scale_configs.id

plu_code varchar(20)

product_id uuid FK → products.id

UNIQUE(scale_config_id, plu_code)

created_at, updated_at

Con esto, cuando escaneas un código de balanza, el sistema:

reconoce el prefix

extrae plu_code

busca el producto en scale_product_map

extrae peso/precio y agrega ítem en POS

7) Mapeo rápido: tablas ↔ casos de uso
CU01 Gestionar Usuarios

users, roles, audit_logs

CU02 Autenticación

users (credenciales), audit_logs (login/logout)

CU03 Auditoría

audit_logs

CU10 Gestionar Producto

products, product_categories, product_prices, product_barcodes, audit_logs

CU20 Registrar Movimiento de Inventario

inventory_movements, inventory_balances, warehouses, audit_logs

CU21 Consultar Stock

inventory_balances, inventory_movements, warehouses

CU30 Abrir Caja

cash_sessions, terminals, audit_logs

CU31 Movimientos de Caja

cash_movements, cash_sessions, audit_logs

CU32 Cerrar Caja

cash_sessions, cash_movements, sales, payments, print_jobs, audit_logs

CU40 Registrar Venta

sales, sale_items, (impacta inventario: inventory_movements + inventory_balances)

CU41 Cobrar Venta

payments, sales, print_jobs, audit_logs

CU42 Anular/Devolver Venta

sales (status), payments (reverso o registro), inventory_movements (RETURN_IN), audit_logs

CU50/CU51 Periféricos e impresión

terminal_configs, print_jobs, terminals

CU52/CU53 Balanza / Escaneo

scale_configs, scale_product_map, product_barcodes (fijos), sale_items.barcode_scanned

8) Observaciones clave (para que no te falle caja/stock)

Venta confirmada debe ser transaccional:

insertar sale + items + payments

insertar inventory_movements (SALE_OUT)

actualizar inventory_balances

todo en una sola transacción

No borrar ventas/productos: usar status o is_active.

Historial: snapshots en sale_items para que el ticket quede igual siempre.

Impresión: registra print_jobs para reintentos/soporte.