# 📘 Sistema POS Carnicería Premium - Documentación Central

**Versión:** 1.0.0 (Prototipo)  
**Fecha:** Diciembre 2025  
**Estado:** Prototipo Frontend - Fase de Validación

---

## 1️⃣ Descripción General del Proyecto

### ¿Qué es este sistema?

Sistema de Punto de Venta (POS) diseñado específicamente para una carnicería premium. Permite gestionar ventas, caja, productos, inventario y generar reportes de manera ágil e intuitiva.

### Problema que resuelve

- **Ventas lentas:** Agiliza el cobro con interfaz optimizada para táctil/mouse
- **Control de caja:** Gestiona apertura, cierre y arqueo de efectivo con trazabilidad
- **Gestión de productos:** Maneja productos por peso (kg) y por unidad con favoritos
- **Reportes básicos:** Ventas del día, tickets promedio, productos más vendidos
- **Gestión de pedidos/reservas:** Registro y seguimiento de pedidos de clientes con fechas de entrega programadas

### Estado Actual: **PROTOTIPO FRONTEND**

Este proyecto está en **fase de prototipo** para validar:

✅ **Flujo de pantallas** (Login → Caja → POS → Reportes)  
✅ **Experiencia de usuario** (rapidez, claridad, usabilidad)  
✅ **Organización del frontend** (componentes, rutas, estado)  
✅ **Flujo lógico de operaciones** (abrir caja → vender → cobrar → cerrar)

### ⚠️ Lo que NO hace todavía (fase prototipo)

❌ **Backend real:** Los datos se guardan en memoria (se pierden al recargar)  
❌ **Base de datos:** No hay persistencia real, solo mocks en código  
❌ **Impresión de tickets:** No imprime (se simula)  
❌ **Integración con balanza:** No conecta con hardware externo  
❌ **Autenticación real:** Login simulado con usuarios hardcodeados  
❌ **Multi-terminal real:** Simula terminales pero no coordina entre PCs

### Tecnologías Utilizadas (Prototipo)

- **React 19** + TypeScript
- **Vite 5.4.2** (build tool)
- **React Router DOM 7** (navegación)
- **Zustand 5** (state management)
- **Tailwind CSS 3** (estilos)
- **Lucide React** (iconos)
- **UUID** (generación de IDs únicos)

---

## 2️⃣ Arquitectura General

### 📐 Arquitectura ACTUAL (Prototipo Frontend)

```
┌─────────────────────────────────────────────────┐
│                  NAVEGADOR                      │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │       REACT APP (SPA)                   │   │
│  │                                         │   │
│  │  ┌──────────┐  ┌──────────┐           │   │
│  │  │  Pages   │  │ Components│           │   │
│  │  └────┬─────┘  └─────┬────┘           │   │
│  │       │              │                 │   │
│  │       └──────┬───────┘                 │   │
│  │              │                         │   │
│  │       ┌──────▼──────┐                  │   │
│  │       │ Zustand     │                  │   │
│  │       │ Stores      │                  │   │
│  │       └──────┬──────┘                  │   │
│  │              │                         │   │
│  │       ┌──────▼──────┐                  │   │
│  │       │  Mock Data  │                  │   │
│  │       │ (memoria)   │                  │   │
│  │       └─────────────┘                  │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘

Características:
- Estado global en memoria (Zustand)
- Datos mock hardcodeados
- Sin persistencia (reload = pérdida de datos)
- Simulación de lógica de negocio
```

### 🚀 Arquitectura FUTURA (Sistema Completo)

```
┌──────────────────┐         ┌──────────────────┐
│   FRONTEND PWA   │◄───────►│   API BACKEND    │
│   (React)        │  HTTPS  │   (Node.js/NestJS│
│                  │         │    o similar)    │
└──────────────────┘         └────────┬─────────┘
                                      │
                                      │ SQL
                                      ▼
                             ┌────────────────┐
                             │  PostgreSQL    │
                             │  (Base Datos)  │
                             └────────────────┘

                ┌─────────────────────────┐
                │   AGENTE LOCAL (PC)     │
                │  - Impresora térmica    │
                │  - Balanza              │
                │  - Lector de códigos    │
                └─────────────────────────┘
```

**Evolución Planificada:**

1. **Frontend:** Se mantendrá (React PWA) con ajustes mínimos
2. **Backend:** API RESTful que reemplazará los stores de Zustand
3. **Base de datos:** PostgreSQL para persistencia real
4. **Agente local:** Aplicación Electron/Python para hardware (impresora, balanza)

**Datos que se migrarán:**

- Stores de Zustand → API Endpoints
- Mock Data → Migraciones SQL
- Lógica de negocio → Backend Services

---

## 3️⃣ Estructura de Carpetas y Archivos

### Estructura Completa

```
frontend-pwa/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/             # Componentes UI base
│   │   │   ├── Button.tsx  # Botón con variantes (primary, secondary, etc.)
│   │   │   ├── Input.tsx   # Input de texto/número
│   │   │   ├── Modal.tsx   # Modal/Dialog reutilizable
│   │   │   └── index.ts    # Barrel export
│   │   └── layout/         # Componentes de estructura
│   │       └── Navbar.tsx  # Barra de navegación superior
│   │
│   ├── pages/              # Pantallas principales
│   │   ├── LoginPage.tsx          # Login con PIN
│   │   ├── DashboardPage.tsx      # Dashboard con estadísticas
│   │   ├── POSPage.tsx            # Punto de Venta
│   │   ├── OrdersPage.tsx         # Gestión de Pedidos/Reservas
│   │   ├── CashPage.tsx           # Estado de caja
│   │   ├── CashOpenPage.tsx       # Abrir turno de caja
│   │   ├── CashClosePage.tsx      # Cerrar turno con arqueo
│   │   ├── ProductsPage.tsx       # CRUD de productos
│   │   ├── ReportsPage.tsx        # Reportes de ventas
│   │   └── SettingsPage.tsx       # Configuración del sistema
│   │
│   ├── store/              # Estado global (Zustand)
│   │   └── index.ts        # Stores: auth, cash, products, cart, sales, orders
│   │
│   ├── data/               # Datos mock/simulados
│   │   └── mockData.ts     # Usuarios, productos, categorías, terminales
│   │
│   ├── types/              # TypeScript types/interfaces
│   │   └── index.ts        # Todas las entidades del sistema
│   │
│   ├── utils/              # Utilidades
│   │   └── currency.ts     # Formateo de moneda (Bs)
│   │
│   ├── App.tsx             # Configuración de rutas
│   ├── main.tsx            # Entry point de React
│   └── index.css           # Estilos globales + Tailwind
│
├── public/                 # Archivos estáticos
├── package.json            # Dependencias
├── vite.config.ts          # Configuración de Vite
├── tailwind.config.js      # Configuración de Tailwind
├── tsconfig.json           # Configuración de TypeScript
└── arquitectura.md         # Documento de arquitectura original
```

### Responsabilidades por Carpeta

#### 📂 `src/components/`
**Propósito:** Componentes reutilizables que se usan en múltiples pantallas

**ui/** - Componentes UI básicos (Button, Input, Modal)  
**layout/** - Componentes estructurales (Navbar)

**Ejemplo:**
- `Button.tsx` se usa en todas las páginas para acciones
- `Modal.tsx` se usa para formularios de productos, pagos, confirmaciones

#### 📂 `src/pages/`
**Propósito:** Componentes que representan pantallas completas del sistema

Cada página es una "ruta" independiente:
- `LoginPage.tsx` → `/login`
- `DashboardPage.tsx` → `/dashboard`
- `POSPage.tsx` → `/pos`
- etc.

#### 📂 `src/store/`
**Propósito:** Estado global de la aplicación usando Zustand

**Stores actuales:**
1. **authStore** - Usuario actual, autenticación
2. **cashStore** - Sesión de caja, movimientos
3. **productStore** - Productos, categorías, favoritos
4. **cartStore** - Carrito de compras (items temporales)
5. **salesStore** - Ventas completadas

**⚠️ IMPORTANTE:** En producción, estos stores harán fetch a la API en lugar de modificar estado local.

#### 📂 `src/data/`
**Propósito:** Datos simulados para el prototipo

**mockData.ts** contiene:
- 3 usuarios de prueba (admin, cajero, encargado)
- 2 terminales simulados
- 9 categorías de productos
- 30 productos (carnes, abarrotes, carbón, salsas)

**⚠️ TEMPORAL:** Estos datos serán reemplazados por la base de datos real.

#### 📂 `src/types/`
**Propósito:** Definiciones de TypeScript para todas las entidades

Define interfaces para:
- User, Product, Sale, CashSession, etc.
- Enums: UserRole, SaleType, PaymentMethod, etc.

**📌 IMPORTANTE:** Estas interfaces serán la base para los modelos de la base de datos.

#### 📂 `src/utils/`
**Propósito:** Funciones auxiliares reutilizables

Actualmente:
- `currency.ts` - Formateo de moneda boliviana (Bs)

---

## 4️⃣ Flujo de Ejecución de la Aplicación

### Entry Point (Inicio)

1. **index.html** carga el script de Vite
2. **main.tsx** se ejecuta:
   ```tsx
   import App from './App.tsx'
   createRoot(document.getElementById('root')!).render(
     <StrictMode>
       <App />
     </StrictMode>
   )
   ```
3. **App.tsx** configura el router y rutas protegidas

### Flujo de Renderizado

```
main.tsx
   └─> App.tsx (BrowserRouter)
         ├─> Route "/login" → LoginPage
         └─> Route "/*" → ProtectedRoute
                    └─> MainLayout (Navbar + Page)
                          ├─> /dashboard → DashboardPage
                          ├─> /pos → POSPage
                          ├─> /orders → OrdersPage
                          ├─> /products → ProductsPage
                          ├─> /cash → CashPage
                          ├─> /cash/open → CashOpenPage
                          ├─> /cash/close → CashClosePage
                          └─> /reports → ReportsPage
```

### Protección de Rutas

Todas las rutas (excepto `/login`) están protegidas por **ProtectedRoute**:

```tsx
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};
```

Si el usuario no está autenticado → Redirige a `/login`

### Navegación entre Pantallas

**Desde código:**
```tsx
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/pos'); // Navega programáticamente
```

**Desde UI:**
```tsx
import { Link } from 'react-router-dom';
<Link to="/products">Productos</Link>
```

### Flujo Típico del Usuario

```
1. Login (/login)
   ↓ (PIN correcto)
2. Dashboard (/dashboard)
   ↓ (clic en "Abrir Caja")
3. Abrir Caja (/cash/open)
   ↓ (ingresa monto inicial)
4. POS (/pos)
   ↓ (agrega productos, cobra)
5. Dashboard (/dashboard)
   ↓ (clic en "Cerrar Caja")
6. Cerrar Caja (/cash/close)
   ↓ (arqueo de efectivo)
7. Dashboard → Logout
```

---

## 5️⃣ Pantallas (Views / Pages)

### 🔐 LoginPage (`/login`)

**Descripción:** Pantalla de autenticación con PIN

**Acciones:**
- Ingresar usuario y PIN
- Ver lista de usuarios de prueba
- Autenticarse y redirigir a Dashboard

**Estado que maneja:**
- Formulario local (usuario, pin)
- Llama a `authStore.login()`

**Usuarios de prueba:**
- `admin` / `1234` (Administrador)
- `cajero1` / `1111` (Cajero)
- `encargado1` / `2222` (Encargado)

---

### 📊 DashboardPage (`/dashboard`)

**Descripción:** Pantalla principal con resumen del día

**Información mostrada:**
- **Estadísticas del día:**
  - Ventas totales (Bs)
  - Número de tickets
  - Ticket promedio
- **Estado de caja:**
  - Si está abierta: muestra monto inicial
  - Botón "Abrir Caja" o "Cerrar Caja"
- **Acciones rápidas:** Enlaces a POS, Productos, Reportes
- **Últimas ventas:** Tabla con las 5 ventas más recientes

**Estado que maneja:**
- `useCashStore()` - Estado de caja
- `useSalesStore()` - Ventas del día
- `useAuthStore()` - Usuario actual

---

### 🛒 POSPage (`/pos`)

**Descripción:** Punto de Venta - Pantalla principal para registrar ventas

**Funcionalidades:**

1. **Grid de productos:**
   - Búsqueda por nombre/SKU
   - Filtro por categoría
   - Productos favoritos destacados
   - Toggle de favoritos (estrella)

2. **Carrito de compras:**
   - Agregar productos
   - Ajustar cantidades:
     - Productos por **PESO**: decimales (0.5, 1.5 kg)
     - Productos por **UNIDAD**: enteros (1, 2, 3)
   - Eliminar items
   - Ver subtotal

3. **Checkout:**
   - Método de pago: Efectivo, QR, Tarjeta
   - Cálculo de cambio (si es efectivo)
   - Confirmación de venta
   - Modal de éxito

**Validaciones:**
- Requiere caja abierta (si no → redirige)
- Cantidad mínima: 0.5 (peso) o 1 (unidad)
- No permite cantidad 0
- Valida efectivo suficiente

**Estado que maneja:**
- `useProductStore()` - Productos, categorías, favoritos
- `useCartStore()` - Items del carrito
- `useCashStore()` - Sesión actual
- `useSalesStore()` - Completa la venta

---

### � OrdersPage (`/orders`)

**Descripción:** Gestión de pedidos y reservas de clientes

**Problema que resuelve:**
- Registra digitalmente todos los pedidos de clientes
- Evita que se olviden anotaciones en papel
- Alerta sobre pedidos atrasados
- Facilita búsqueda por cliente, teléfono o fecha
- Mantiene historial completo de pedidos

**Dashboard superior:**
- **Entregas de Hoy:** Cantidad de pedidos programados para hoy
- **Pendientes:** Pedidos nuevos sin iniciar
- **Listos:** Pedidos terminados esperando entrega

**Alertas:**
- Muestra tarjetas rojas para pedidos **atrasados** (fecha/hora de entrega pasada)
- Incluye tiempo de retraso y botón para marcar como entregado

**Lista de Pedidos:**
- Muestra tarjetas con información resumida:
  - Número de pedido (#001, #002...)
  - Cliente (nombre y teléfono)
  - Fecha y hora de entrega programada
  - Estado (badge de color según estado)
  - Prioridad (badge si es ALTA o URGENTE)
  - Total del pedido
  - Cantidad de productos
  - Creado por (usuario) y fecha de creación
- Barra de búsqueda por nombre o teléfono de cliente
- Filtros por estado: Todos, Pendientes, Listos, Entregados, Cancelados

**Modal: Nuevo Pedido (3 pasos):**

1. **Paso 1 - Información del Cliente:**
   - Nombre del cliente (requerido)
   - Teléfono (requerido)
   - Email (opcional)
   - Dirección (opcional)
   - Notas adicionales (opcional)
   - Guardado de información de cliente para reutilización

2. **Paso 2 - Selección de Productos:**
   - Búsqueda de productos por nombre o SKU
   - Lista de productos con foto, precio y stock
   - Botón de agregar (+) para cada producto
   - Selección de tipo de venta (peso/unidad)
   - Ajuste de cantidad
   - Notas específicas por producto
   - Resumen del pedido con subtotal actualizado en tiempo real

3. **Paso 3 - Detalles de Entrega:**
   - Fecha de entrega (campo de fecha)
   - Hora de entrega (campo de hora)
   - Prioridad: BAJA, NORMAL, ALTA, URGENTE (con códigos de color)
   - Notas generales del pedido
   - Resumen completo del pedido antes de confirmar:
     - Lista de productos con cantidades y precios
     - Cliente y contacto
     - Fecha/hora de entrega
     - Total a pagar

**Modal: Detalle del Pedido:**
- Información completa del pedido y cliente
- Badge de estado actual (colores diferenciados)
- Badge de prioridad (si aplica)
- Tabla de productos con:
  - Nombre y SKU
  - Cantidad y unidad
  - Precio unitario y total
  - Notas específicas
- Total del pedido
- Botones de acción contextuales según estado:
  - **PENDIENTE:** "Marcar como Listo" (pasa a READY)
  - **LISTO:** "Marcar como Entregado" (pasa a DELIVERED)
  - Botón "Cancelar Pedido" (disponible hasta estado LISTO)
- Historial de cambios:
  - Fecha y hora de creación
  - Última actualización
  - Fecha de entrega (si está completado)
  - Fecha de cancelación y motivo (si fue cancelado)

**Estados del Pedido:**
- **PENDIENTE:** Pedido recibido, aún no iniciado
- **LISTO:** Pedido terminado, esperando que el cliente lo recoja
- **ENTREGADO:** Pedido entregado al cliente (estado final)
- **CANCELADO:** Pedido cancelado con motivo registrado

**Prioridades:**
- **BAJA:** Pedidos no urgentes (gris)
- **NORMAL:** Prioridad estándar (azul)
- **ALTA:** Requiere atención pronto (amarillo)
- **URGENTE:** Máxima prioridad (rojo)

**Validaciones:**
- Nombre y teléfono de cliente son obligatorios
- Debe tener al menos 1 producto
- Fecha de entrega no puede ser anterior a hoy
- Hora de entrega requerida
- Al cancelar, debe indicar motivo

**Estado que maneja:**
- `useOrderStore()` - Pedidos, clientes, contador de números de pedido
- `useProductStore()` - Productos para selección
- `useAuthStore()` - Usuario que crea/modifica el pedido

**Funcionalidades adicionales:**
- Detecta automáticamente pedidos atrasados comparando fecha/hora de entrega con hora actual
- Numera pedidos automáticamente (#001, #002...)
- Mantiene snapshots de información del producto al momento del pedido
- Registra quién creó el pedido y timestamps de todos los cambios
- Búsqueda inteligente de clientes por nombre o teléfono
- Reutilización de datos de clientes frecuentes

---

### �💵 CashPage (`/cash`)

**Descripción:** Estado actual de la caja

**Información:**
- Estado: Abierta/Cerrada
- Si está abierta:
  - Monto de apertura
  - Ventas acumuladas
  - Movimientos de efectivo (entradas/salidas)
  - Efectivo esperado
- Tabla de movimientos de caja

**Acciones:**
- Ir a "Abrir Caja"
- Ir a "Cerrar Caja"

---

### 🔓 CashOpenPage (`/cash/open`)

**Descripción:** Abrir turno de caja

**Formulario:**
- Seleccionar terminal (CAJA-1, CAJA-2)
- Monto inicial en efectivo (Bs)
- Nota opcional

**Acción:**
- Crea una `CashSession` con estado `OPEN`
- Almacena en `cashStore.currentSession`
- Redirige a Dashboard

**Validaciones:**
- No permite abrir si ya hay una sesión abierta
- Monto inicial debe ser > 0

---

### 🔒 CashClosePage (`/cash/close`)

**Descripción:** Cerrar turno de caja con arqueo

**Información mostrada:**
- Monto de apertura
- Ventas en efectivo del turno
- Movimientos adicionales (entradas/salidas)
- **Efectivo esperado** (calculado)

**Formulario:**
- Conteo físico de efectivo (Bs)
- Nota opcional

**Resultado:**
- **Diferencia de caja:**
  - Verde = Sobra efectivo
  - Rojo = Falta efectivo
  - Gris = Cuadra exacto

**Acción:**
- Actualiza `CashSession` a estado `CLOSED`
- Guarda conteo y diferencia
- Redirige a Dashboard

---

### 📦 ProductsPage (`/products`)

**Descripción:** CRUD de productos

**Funcionalidades:**
- **Listar productos:**
  - Búsqueda por nombre/SKU
  - Filtro por categoría
  - Ver activos/inactivos
- **Crear producto:**
  - Nombre, SKU, categoría
  - Tipo de venta (Peso/Unidad)
  - Unidad (kg/unidad)
  - Precio
- **Editar producto:**
  - Modal con formulario pre-llenado
- **Activar/Desactivar:**
  - Toggle de estado activo
- **Marcar favorito:**
  - Estrella para favoritos (aparecen destacados en POS)

**Acceso:** Solo ADMIN y MANAGER

**Estado que maneja:**
- `useProductStore()` - CRUD de productos

---

### 📈 ReportsPage (`/reports`)

**Descripción:** Reportes y análisis de ventas

**Reportes incluidos:**

1. **Resumen del día:**
   - Ventas totales (Bs)
   - Número de tickets
   - Ticket promedio

2. **Productos más vendidos:**
   - Top 10 productos por cantidad
   - Total vendido de cada uno

3. **Ventas por día (últimos 7 días):**
   - Gráfico de barras visual
   - Total por día

**Acceso:** Solo ADMIN y MANAGER

**Estado que maneja:**
- `useSalesStore()` - Historial de ventas

---

## 6️⃣ Stores (Estado Global con Zustand)

### Descripción General

Los **stores** son el corazón del estado de la aplicación. Usan **Zustand**, una librería ligera de state management similar a Redux pero más simple.

**⚠️ IMPORTANTE EN PRODUCCIÓN:**
Estos stores serán reemplazados por llamadas a API:
- `products` → `fetch('/api/products')`
- `addProduct()` → `POST /api/products`
- etc.

---

### 📍 authStore - Autenticación

**Ubicación:** `src/store/index.ts`

**Estado:**
```typescript
{
  currentUser: User | null,
  isAuthenticated: boolean
}
```

**Métodos:**

#### `login(username: string, pin: string): boolean`
- Busca usuario en `mockUsers`
- Valida PIN
- Si es correcto: guarda usuario y marca como autenticado
- Retorna `true` si éxito, `false` si falla

#### `logout(): void`
- Limpia usuario actual
- Marca como no autenticado
- No redirige (eso lo hace el componente)

**Uso:**
```typescript
const { currentUser, isAuthenticated, login, logout } = useAuthStore();
const success = login('admin', '1234');
```

---

### 💰 cashStore - Gestión de Caja

**Estado:**
```typescript
{
  currentSession: CashSession | null,
  cashMovements: CashMovement[]
}
```

**Métodos:**

#### `openCashSession(userId, terminalId, openingAmount, note?)`
- Crea nueva sesión con estado `OPEN`
- Genera ID único
- Guarda fecha/hora de apertura
- Almacena en `currentSession`

#### `closeCashSession(countedCash, note?)`
- Calcula ventas en efectivo del turno
- Suma movimientos (entradas/salidas)
- Calcula efectivo esperado
- Calcula diferencia: `countedCash - expectedCash`
- Actualiza sesión a `CLOSED`

#### `addCashMovement(type: 'IN' | 'OUT', amount, reason)`
- Registra entrada/salida de efectivo
- Ej: "Pago a proveedor", "Cambio de billetes"
- Se asocia a la sesión actual

**Datos calculados:**
```typescript
const expectedCash = openingAmount + cashSales + cashIn - cashOut;
const difference = countedCash - expectedCash;
```

---

### � orderStore - Gestión de Pedidos y Reservas

**Estado:**
```typescript
{
  orders: Order[],           // Todos los pedidos
  customers: Customer[],     // Clientes registrados
  orderCounter: number       // Contador para #001, #002...
}
```

**Interfaces:**

```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: number;        // #001, #002...
  customerId: string;
  customerName: string;       // Snapshot
  customerPhone: string;      // Snapshot
  status: OrderStatus;
  priority: OrderPriority;
  deliveryDate: string;       // Fecha de entrega (YYYY-MM-DD)
  deliveryTime: string;       // Hora de entrega (HH:mm)
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  createdBy: string;          // Usuario que creó
  createdAt: string;
  updatedAt: string;
  completedAt?: string;       // Cuando se entregó
  cancelledAt?: string;       // Cuando se canceló
  cancellationReason?: string;
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;        // Snapshot
  productSku: string;         // Snapshot
  saleType: 'PESO' | 'UNIDAD';
  qty: number;
  unit: string;               // 'kg' o 'und'
  unitPrice: number;
  total: number;
  notes?: string;
}

type OrderStatus = 
  | 'PENDING'       // Pendiente
  | 'IN_PROGRESS'   // En preparación
  | 'READY'         // Listo para entregar
  | 'DELIVERED'     // Entregado
  | 'CANCELLED';    // Cancelado

type OrderPriority = 
  | 'LOW'       // Baja
  | 'NORMAL'    // Normal
  | 'HIGH'      // Alta
  | 'URGENT';   // Urgente
```

**Métodos de Pedidos:**

#### `createOrder(customerId, customerName, customerPhone, deliveryDate, deliveryTime, items, priority?, notes?): Order`
- Crea nuevo pedido con número automático (#001, #002...)
- Genera ID único para el pedido
- Asigna el `orderId` a cada item
- Calcula subtotal y total
- Guarda snapshot de información del cliente
- Registra usuario que creó (`createdBy`)
- Estado inicial: `PENDING`
- Retorna el pedido creado

#### `updateOrderStatus(orderId, status, cancellationReason?)`
- Cambia estado del pedido
- Si es `DELIVERED`: guarda `completedAt`
- Si es `CANCELLED`: guarda `cancelledAt` y `cancellationReason`
- Actualiza `updatedAt`

#### `updateOrder(orderId, updates: Partial<Order>)`
- Actualiza campos del pedido
- Útil para cambiar fecha/hora de entrega, prioridad, notas
- Actualiza `updatedAt`

#### `cancelOrder(orderId, reason: string)`
- Atajo para cancelar pedido
- Cambia estado a `CANCELLED`
- Guarda `cancelledAt` y `cancellationReason`

#### `getOrderById(id): Order | undefined`
- Busca pedido por ID

#### `getOrdersByStatus(status: OrderStatus): Order[]`
- Filtra pedidos por estado
- Retorna lista ordenada por fecha de entrega (más próximos primero)

#### `getPendingOrders(): Order[]`
- Atajo para obtener pedidos pendientes
- Retorna solo pedidos con estado `PENDING`

#### `getOverdueOrders(): Order[]`
- Retorna pedidos atrasados
- Criterio: Fecha/hora de entrega < fecha/hora actual
- Excluye pedidos ya entregados o cancelados
- Ordenados por fecha de entrega (más atrasados primero)

#### `getTodaysDeliveries(): Order[]`
- Retorna pedidos programados para entrega hoy
- Todos los estados excepto `DELIVERED` y `CANCELLED`
- Ordenados por hora de entrega

**Métodos de Clientes:**

#### `addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Customer`
- Crea nuevo cliente
- Genera ID único
- Guarda timestamp de creación
- Retorna el cliente creado

#### `updateCustomer(customerId, updates: Partial<Customer>)`
- Actualiza información del cliente

#### `getCustomerById(id): Customer | undefined`
- Busca cliente por ID

#### `searchCustomers(query: string): Customer[]`
- Busca clientes por nombre o teléfono
- Búsqueda case-insensitive
- Útil para el autocompletado en el formulario de pedidos

**Flujo de Estados del Pedido:**
```
PENDING → IN_PROGRESS → READY → DELIVERED
   ↓           ↓          ↓
        CANCELLED ←─────────
```

**Lógica de Negocio:**
- Los pedidos se numeran automáticamente (#001, #002...) con `orderCounter++`
- Los items guardan snapshots del producto (nombre, SKU, precio) para preservar información aunque el producto cambie
- La detección de pedidos atrasados compara `deliveryDate + deliveryTime` con la fecha/hora actual
- Los pedidos `DELIVERED` o `CANCELLED` no aparecen en alertas de atrasados
- La búsqueda de clientes ayuda a reutilizar información de clientes frecuentes

---

### �📦 productStore - Gestión de Productos

**Estado:**
```typescript
{
  products: Product[],
  categories: ProductCategory[]
}
```

**Métodos:**

#### `addProduct(product: Omit<Product, 'id'>)`
- Genera ID único
- Agrega a lista de productos
- En producción: `POST /api/products`

#### `updateProduct(id, updates: Partial<Product>)`
- Actualiza producto por ID
- Merge de datos existentes con updates
- En producción: `PUT /api/products/:id`

#### `toggleProductActive(id)`
- Activa/desactiva producto
- Los inactivos no aparecen en POS

#### `toggleProductFavorite(id)`
- Marca/desmarca como favorito
- Los favoritos aparecen destacados en POS

#### `getProductById(id): Product | undefined`
- Busca producto por ID

#### `getProductsByCategory(categoryId): Product[]`
- Filtra productos por categoría
- Solo retorna activos

#### `getFavoriteProducts(): Product[]`
- Retorna productos marcados como favoritos
- Solo activos

---

### 🛒 cartStore - Carrito de Compras

**Estado:**
```typescript
{
  cartItems: CartItem[]
}
```

**CartItem:**
```typescript
{
  id: string,
  product: Product,
  productId: string,
  productName: string,
  qty: number,
  unitPrice: number,
  total: number
}
```

**Métodos:**

#### `addToCart(product, qty)`
- Si el producto ya está → incrementa cantidad
- Si no → crea nuevo item
- Calcula total: `qty * price`

#### `updateCartItem(itemId, qty)`
- Actualiza cantidad de un item
- **Validación:** qty debe ser > 0
- Si es producto UNIT → redondea a entero
- Recalcula total

#### `removeFromCart(itemId)`
- Elimina item del carrito

#### `clearCart()`
- Vacía todo el carrito
- Se llama después de completar venta

#### `getCartTotal(): number`
- Suma el total de todos los items

#### `getCartSubtotal(): number`
- Igual que total (para futuras expansiones con descuentos)

---

### 🧾 salesStore - Gestión de Ventas

**Estado:**
```typescript
{
  sales: Sale[],
  saleCounter: number
}
```

**Métodos:**

#### `completeSale(paymentMethod: 'CASH' | 'QR' | 'CARD', cashPaid?): Sale | null`

**Flujo:**
1. Valida que haya items en carrito
2. Valida que haya sesión de caja abierta
3. Crea objeto `Sale` con:
   - ID único
   - Número de venta secuencial
   - Items del carrito
   - Método de pago
   - Totales calculados
   - Fecha/hora
4. Crea `Payment` asociado
5. Agrega venta a lista
6. Limpia el carrito
7. Incrementa contador de ventas
8. Retorna la venta creada

**Validaciones:**
- Si pago en efectivo: valida que `cashPaid >= total`
- Si no hay caja abierta: retorna `null`

#### `getSalesByDateRange(from, to): Sale[]`
- Filtra ventas por rango de fechas
- Útil para reportes

#### `getTodaysSales(): Sale[]`
- Filtra ventas del día actual
- Usado en Dashboard y Reportes

---

### 🖥️ appStore - Estado General

**Estado:**
```typescript
{
  terminals: Terminal[],
  currentTerminal: Terminal | null
}
```

**Métodos:**

#### `setCurrentTerminal(terminal)`
- Guarda terminal seleccionado
- Usado al abrir caja

---

## 7️⃣ Entidades de Datos del Prototipo

### ⚠️ IMPORTANTE
Estas son las entidades **SIMULADAS** del prototipo. En producción serán tablas de PostgreSQL con relaciones, constraints y triggers.

---

### 👤 User (Usuario)

```typescript
interface User {
  id: string;              // UUID
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  username: string;        // Para login
  fullName: string;        // Nombre completo
  pin: string;             // PIN de 4 dígitos
  isActive: boolean;       // Activo/Inactivo
}
```

**Usuarios simulados:**
- `admin` / `1234` → Acceso total
- `cajero1` / `1111` → Solo POS y Caja
- `encargado1` / `2222` → POS, Caja, Productos, Reportes

**En producción:**
- PIN hasheado (bcrypt)
- Tabla `users` con relaciones
- Permisos granulares

---

### 📦 Product (Producto)

```typescript
interface Product {
  id: string;              // UUID
  categoryId: string | null;
  sku: string;             // Código único
  name: string;            // Nombre del producto
  saleType: 'WEIGHT' | 'UNIT';  // Tipo de venta
  unit: string;            // 'kg' o 'unidad'
  price: number;           // Precio por unidad/kg
  taxRate: number;         // Tasa de impuesto (0 = sin IVA)
  isActive: boolean;       // Activo/Inactivo
  isFavorite: boolean;     // Marcado como favorito
}
```

**Tipos de venta:**
- `WEIGHT`: Se vende por peso (kg) - permite decimales (0.5, 1.5)
- `UNIT`: Se vende por unidad - solo enteros (1, 2, 3)

**Productos simulados:** 30 productos en 9 categorías
- Carnes (res, cerdo, pollo, cordero)
- Embutidos
- Vísceras
- Carbón y parrilla
- Condimentos y salsas
- Abarrotes

**En producción:**
- Tabla `products` con FK a `categories`
- Campo `stock` para inventario
- Auditoría de cambios de precio

---

### 🗂️ ProductCategory (Categoría)

```typescript
interface ProductCategory {
  id: string;              // UUID
  name: string;            // Nombre de categoría
}
```

**Categorías simuladas:**
- Res, Cerdo, Pollo, Cordero
- Embutidos, Vísceras
- Carbón y Parrilla
- Condimentos y Salsas
- Abarrotes

---

### 💵 CashSession (Sesión de Caja)

```typescript
interface CashSession {
  id: string;
  terminalId: string;         // Qué terminal
  userId: string;             // Quién abrió
  status: 'OPEN' | 'CLOSED';
  openedAt: string;           // ISO timestamp
  openingAmount: number;      // Monto inicial
  openingNote: string | null;
  closedAt: string | null;    // Cuándo cerró
  closingNote: string | null;
  expectedCash: number | null;  // Calculado
  countedCash: number | null;   // Contado físicamente
  cashDifference: number | null;// Diferencia
}
```

**Flujo:**
1. Se abre: `status = 'OPEN'`
2. Se registran ventas asociadas
3. Se cierra: `status = 'CLOSED'`, se calcula diferencia

**En producción:**
- Tabla `cash_sessions` con FK a `terminals` y `users`
- Trigger para calcular `expectedCash`

---

### 💸 CashMovement (Movimiento de Efectivo)

```typescript
interface CashMovement {
  id: string;
  cashSessionId: string;      // Sesión asociada
  type: 'IN' | 'OUT';         // Entrada o salida
  amount: number;
  reason: string;             // Motivo
  createdBy: string;          // Quién lo registró
  createdAt: string;
}
```

**Ejemplos:**
- `type: 'IN'` → "Cambio de billetes grandes"
- `type: 'OUT'` → "Pago a proveedor de urgencia"

---

### 🧾 Sale (Venta)

```typescript
interface Sale {
  id: string;
  cashSessionId: string;      // Sesión de caja
  terminalId: string;
  userId: string;             // Quién vendió
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  saleNumber: number;         // Número secuencial
  items: SaleItem[];          // Items vendidos
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  payments: Payment[];        // Pagos asociados
}
```

**Estado:**
- `DRAFT`: En progreso (no usado en prototipo)
- `COMPLETED`: Finalizada
- `CANCELLED`: Anulada (no implementado)

---

### 📝 SaleItem (Item de Venta)

```typescript
interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  saleType: 'WEIGHT' | 'UNIT';
  qty: number;                // Cantidad
  unitPrice: number;          // Precio unitario
  discount: number;           // Descuento (no usado)
  total: number;              // qty * unitPrice - discount
}
```

---

### 💳 Payment (Pago)

```typescript
interface Payment {
  id: string;
  saleId: string;
  method: 'CASH' | 'QR' | 'CARD' | 'MIXED';
  amount: number;
  cashPaid: number | null;    // Si fue efectivo
  cashChange: number | null;  // Cambio devuelto
  reference: string | null;   // Referencia externa
  createdAt: string;
}
```

**Métodos de pago:**
- `CASH`: Efectivo (calcula cambio)
- `QR`: Código QR (simulado)
- `CARD`: Tarjeta (simulado)
- `MIXED`: Combinado (no implementado)

---

### 🖥️ Terminal

```typescript
interface Terminal {
  id: string;
  name: string;               // 'CAJA-1', 'CAJA-2'
  location: string;           // 'Principal', 'Secundaria'
  isActive: boolean;
}
```

**Terminales simulados:**
- CAJA-1 (Principal)
- CAJA-2 (Secundaria)

**En producción:**
- Cada PC de caja tiene un terminal asignado
- Coordina sesiones entre terminales

---

## 8️⃣ Flujo de Casos de Uso

### 📖 Caso de Uso 1: Abrir Caja

**Actor:** Cajero, Encargado, Admin

**Precondición:** Usuario autenticado, no hay caja abierta

**Flujo:**
1. Usuario hace clic en "Abrir Caja" desde Dashboard
2. Sistema redirige a `/cash/open`
3. Usuario selecciona terminal (ej: CAJA-1)
4. Usuario ingresa monto inicial (ej: Bs 500.00)
5. Usuario ingresa nota opcional
6. Usuario hace clic en "Abrir Caja"
7. Sistema:
   - Valida monto > 0
   - Crea `CashSession`:
     ```typescript
     {
       id: uuid(),
       terminalId: 'terminal-id',
       userId: currentUser.id,
       status: 'OPEN',
       openedAt: new Date().toISOString(),
       openingAmount: 500.00,
       openingNote: '...',
       closedAt: null,
       expectedCash: null,
       countedCash: null,
       cashDifference: null
     }
     ```
   - Guarda en `cashStore.currentSession`
   - Redirige a `/dashboard`
8. Dashboard muestra "Caja Abierta"

**Postcondición:** Sesión de caja activa, lista para vender

---

### 📖 Caso de Uso 2: Registrar Venta

**Actor:** Cajero, Encargado, Admin

**Precondición:** Caja abierta

**Flujo:**

1. Usuario navega a `/pos` (POS)
2. **Agregar productos al carrito:**
   - 2a. Usuario busca producto por nombre/SKU
   - 2b. Usuario filtra por categoría
   - 2c. Usuario hace clic en producto
   - Sistema agrega al carrito con cantidad por defecto (1 kg o 1 unidad)
3. **Ajustar cantidades:**
   - Usuario modifica cantidad en el carrito:
     - Si es WEIGHT: permite decimales (0.5, 1.5, 2.75)
     - Si es UNIT: solo enteros (1, 2, 3)
   - Sistema recalcula subtotal automáticamente
4. Usuario hace clic en "Cobrar"
5. Sistema muestra modal de pago con total
6. Usuario selecciona método de pago:
   - **6a. Efectivo:**
     - Usuario ingresa monto recibido (ej: Bs 100.00)
     - Sistema calcula cambio: `cambio = recibido - total`
     - Si `recibido < total` → muestra error
   - **6b. QR/Tarjeta:**
     - Usuario confirma (simulado)
7. Usuario confirma pago
8. Sistema:
   - Crea objeto `Sale` con número secuencial
   - Copia items del carrito a `sale.items`
   - Calcula totales
   - Crea `Payment` asociado
   - Agrega a `salesStore.sales`
   - Limpia carrito
9. Sistema muestra modal de éxito con:
   - Total vendido
   - Cambio (si aplica)
   - Botón "Nueva Venta"
10. Usuario hace clic en "Nueva Venta"
11. Sistema cierra modal, carrito vacío listo

**Postcondición:** Venta registrada, carrito vacío

---

### 📖 Caso de Uso 3: Cerrar Caja (Arqueo)

**Actor:** Cajero, Encargado, Admin

**Precondición:** Caja abierta, puede haber ventas

**Flujo:**

1. Usuario hace clic en "Cerrar Caja" desde Dashboard
2. Sistema redirige a `/cash/close`
3. Sistema muestra resumen:
   - Monto de apertura: Bs 500.00
   - Ventas en efectivo: Bs 1,250.00
   - Movimientos:
     - Entrada: +Bs 100.00 (cambio)
     - Salida: -Bs 50.00 (proveedor)
   - **Efectivo esperado:** `500 + 1250 + 100 - 50 = Bs 1,800.00`
4. Usuario cuenta físicamente el efectivo
5. Usuario ingresa conteo físico: Bs 1,795.00
6. Sistema calcula diferencia:
   - `diferencia = 1795 - 1800 = -5.00`
   - Muestra en rojo: "Falta Bs 5.00"
7. Usuario ingresa nota opcional: "Posible error en vuelto"
8. Usuario hace clic en "Cerrar Caja"
9. Sistema:
   - Actualiza `currentSession`:
     ```typescript
     {
       ...existingSession,
       status: 'CLOSED',
       closedAt: new Date().toISOString(),
       closingNote: 'Posible error en vuelto',
       expectedCash: 1800.00,
       countedCash: 1795.00,
       cashDifference: -5.00
     }
     ```
   - Guarda en store
   - Limpia `currentSession`
10. Sistema redirige a `/dashboard`
11. Dashboard muestra "Caja Cerrada"

**Postcondición:** Sesión cerrada con arqueo documentado

---

### 📖 Caso de Uso 4: Gestionar Productos

**Actor:** Admin, Encargado

**Precondición:** Usuario con permisos

**Flujo - Crear Producto:**

1. Usuario navega a `/products`
2. Usuario hace clic en "Nuevo Producto"
3. Sistema abre modal con formulario
4. Usuario completa datos:
   - Nombre: "Chorizo Parrillero"
   - SKU: "EMB-010"
   - Categoría: Embutidos
   - Tipo de venta: Por Unidad
   - Unidad: unidad (se ajusta automático)
   - Precio: Bs 8.50
5. Usuario hace clic en "Guardar"
6. Sistema:
   - Valida campos requeridos
   - Crea producto con ID único
   - Agrega a `productStore.products`
   - Cierra modal
7. Sistema actualiza tabla de productos

**Flujo - Marcar Favorito:**

1. Usuario hace clic en estrella del producto
2. Sistema:
   - Alterna `product.isFavorite`
   - Actualiza UI (estrella cambia de color)
3. Producto aparece en sección "Favoritos" del POS

**Postcondición:** Producto creado/actualizado disponible en POS

---

## 9️⃣ Guía de Evolución Futura

### 🎯 Objetivo de la Migración

Transformar el prototipo frontend en un sistema completo con:
- Backend API
- Base de datos PostgreSQL
- Autenticación real
- Persistencia de datos
- Agente local para hardware

---

### 🔄 Partes que se MANTENDRÁN

✅ **Frontend React completo:**
- Componentes UI (`Button`, `Input`, `Modal`)
- Layout (`Navbar`)
- Páginas (`POSPage`, `DashboardPage`, etc.)
- Estructura de carpetas
- Estilos Tailwind

✅ **Interfaces TypeScript:**
- `User`, `Product`, `Sale`, `CashSession`, etc.
- Servirán de base para modelos del backend

✅ **Lógica de UI:**
- Validaciones de formularios
- Flujo de navegación
- Experiencia de usuario

---

### 🔁 Partes que se REEMPLAZARÁN

❌ **Stores de Zustand** → **API Calls**

**Antes (Prototipo):**
```typescript
const { products, addProduct } = useProductStore();
addProduct({ name: 'Nuevo', ... });
```

**Después (Producción):**
```typescript
const { data: products } = useQuery('/api/products');
const mutation = useMutation('/api/products', 'POST');
mutation.mutate({ name: 'Nuevo', ... });
```

❌ **Mock Data** → **Base de Datos PostgreSQL**

**Migración:**
1. Crear migraciones SQL basadas en `types/index.ts`
2. Poblar con datos reales
3. Configurar relaciones FK

❌ **Autenticación simulada** → **JWT + Refresh Tokens**

**Cambios:**
- PIN hasheado con bcrypt
- Tokens en httpOnly cookies
- Refresh automático

❌ **Estado en memoria** → **Backend stateless + DB**

**Antes:**
```typescript
// Estado se pierde al recargar
const [sales, setSales] = useState([]);
```

**Después:**
```typescript
// Estado persiste en DB
const sales = await db.sales.findMany();
```

---

### 🏗️ Arquitectura de Producción

```
┌──────────────────────────────────────────┐
│          FRONTEND (React PWA)            │
│  - Páginas existentes                    │
│  - Componentes reutilizados              │
│  - TanStack Query para API               │
└────────────┬─────────────────────────────┘
             │ HTTPS
             │ (JWT Auth)
             ▼
┌──────────────────────────────────────────┐
│       API BACKEND (NestJS/Node)          │
│  ┌────────────────────────────────────┐  │
│  │  Controllers (REST endpoints)      │  │
│  ├────────────────────────────────────┤  │
│  │  Services (business logic)         │  │
│  ├────────────────────────────────────┤  │
│  │  Repositories (DB access)          │  │
│  └────────────────────────────────────┘  │
└────────────┬─────────────────────────────┘
             │ TypeORM/Prisma
             ▼
┌──────────────────────────────────────────┐
│        PostgreSQL Database               │
│  - users                                 │
│  - products, categories                  │
│  - cash_sessions, cash_movements         │
│  - sales, sale_items, payments           │
│  - terminals                             │
└──────────────────────────────────────────┘

         ┌────────────────────────┐
         │  AGENTE LOCAL (PC)     │
         │  - Electron/Python     │
         │  - Impresora térmica   │
         │  - Balanza             │
         │  - WebSocket al backend│
         └────────────────────────┘
```

---

### 📋 Plan de Migración (Fases)

#### **Fase 1: Setup Backend**
- [ ] Crear proyecto NestJS/Express
- [ ] Configurar PostgreSQL
- [ ] Crear migraciones iniciales
- [ ] Setup JWT auth

#### **Fase 2: API de Usuarios**
- [ ] Endpoint: `POST /auth/login`
- [ ] Endpoint: `POST /auth/logout`
- [ ] Endpoint: `GET /users/me`
- [ ] Middleware de autenticación

#### **Fase 3: API de Productos**
- [ ] CRUD productos: `/api/products`
- [ ] CRUD categorías: `/api/categories`
- [ ] Actualizar frontend para usar API

#### **Fase 4: API de Caja**
- [ ] Endpoint: `POST /cash-sessions/open`
- [ ] Endpoint: `PUT /cash-sessions/:id/close`
- [ ] Endpoint: `POST /cash-movements`
- [ ] Actualizar frontend

#### **Fase 5: API de Ventas**
- [ ] Endpoint: `POST /sales`
- [ ] Endpoint: `GET /sales?date=...`
- [ ] Endpoint: `GET /reports/daily`
- [ ] Actualizar POS y reportes

#### **Fase 6: Agente Local**
- [ ] Crear app Electron
- [ ] Integrar impresora térmica (ESCPOS)
- [ ] WebSocket para recibir tickets
- [ ] Imprimir desde backend

#### **Fase 7: Hardware Adicional**
- [ ] Integrar balanza (serial/USB)
- [ ] Lector de códigos (HID)
- [ ] Pruebas de hardware

---

### 🔧 Ejemplo de Migración: Productos

**Prototipo (Actual):**
```typescript
// src/store/index.ts
export const useProductStore = create<ProductState>((set) => ({
  products: mockProducts, // Array en memoria
  addProduct: (product) => {
    const newProduct = { ...product, id: uuidv4() };
    set((state) => ({
      products: [...state.products, newProduct]
    }));
  }
}));
```

**Producción (Futuro):**

**Backend:**
```typescript
// src/products/products.controller.ts
@Controller('products')
export class ProductsController {
  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
  
  @Get()
  async findAll() {
    return this.productsService.findAll();
  }
}
```

**Frontend:**
```typescript
// src/hooks/useProducts.ts
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json())
  });
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product) => 
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
    }
  });
}
```

---

### 📊 Base de Datos - Schema Resumido

```sql
-- Tablas principales (simplificado)

CREATE TABLE users (
  id UUID PRIMARY KEY,
  role VARCHAR(20) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  sale_type VARCHAR(10) NOT NULL, -- WEIGHT/UNIT
  unit VARCHAR(20) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cash_sessions (
  id UUID PRIMARY KEY,
  terminal_id UUID REFERENCES terminals(id),
  user_id UUID REFERENCES users(id),
  status VARCHAR(10) NOT NULL, -- OPEN/CLOSED
  opened_at TIMESTAMP NOT NULL,
  opening_amount DECIMAL(10,2) NOT NULL,
  closed_at TIMESTAMP,
  expected_cash DECIMAL(10,2),
  counted_cash DECIMAL(10,2),
  cash_difference DECIMAL(10,2)
);

CREATE TABLE sales (
  id UUID PRIMARY KEY,
  cash_session_id UUID REFERENCES cash_sessions(id),
  user_id UUID REFERENCES users(id),
  sale_number INTEGER NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sale_items (
  id UUID PRIMARY KEY,
  sale_id UUID REFERENCES sales(id),
  product_id UUID REFERENCES products(id),
  qty DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);
```

---

### 🎯 Recomendaciones Finales

1. **No borrar el prototipo:** Mantenerlo como referencia
2. **Migrar por fases:** Backend primero, luego frontend gradual
3. **Reutilizar tipos:** Las interfaces TypeScript son la base del schema DB
4. **Testing:** Agregar tests unitarios en backend
5. **Documentar API:** Usar Swagger/OpenAPI
6. **Websockets:** Para notificaciones en tiempo real (nueva venta, caja cerrada)

---

## 🔗 Referencias

- **Documentos originales:**
  - `arquitectura.md` - Arquitectura detallada del sistema completo
  - `base_de_datos_inicial.md` - Diseño de base de datos
  - `DEMO_GUIDE.md` - Guía de prueba del prototipo

- **Código fuente:**
  - `src/` - Código del frontend React
  - `src/store/index.ts` - Lógica de estado (a migrar)
  - `src/data/mockData.ts` - Datos simulados (a migrar)

---

## 📝 Notas Finales

Este documento refleja el estado **actual** del prototipo frontend (diciembre 2025).

**¿Qué funciona hoy?**
- ✅ Flujo completo de ventas (frontend)
- ✅ Gestión de caja con arqueo
- ✅ CRUD de productos
- ✅ Reportes básicos
- ✅ Autenticación simulada

**¿Qué falta para producción?**
- ❌ Backend real con API
- ❌ Base de datos PostgreSQL
- ❌ Persistencia de datos
- ❌ Impresión de tickets
- ❌ Hardware (balanza, lector)
- ❌ Multi-terminal real
- ❌ Backup y recuperación

**Objetivo del prototipo cumplido:**  
Validar UX, flujo de pantallas y organización del frontend antes de invertir en backend.

---

**Última actualización:** Diciembre 30, 2025  
**Autor:** Sistema POS Carnicería Premium  
**Versión del prototipo:** 1.0.0
