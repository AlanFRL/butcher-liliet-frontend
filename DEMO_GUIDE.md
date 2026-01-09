# 🥩 Carnicería Premium - Sistema POS (Prototipo)

## ✨ Características Implementadas

Este prototipo funcional incluye:

### 🔐 Autenticación
- Sistema de login con 3 usuarios demo (Admin, Cajero, Encargado)
- Control de permisos por rol
- Interfaz adaptada según el rol del usuario

### 📊 Dashboard Principal
- Estado actual de caja (Abierta/Cerrada)
- Estadísticas del día (ventas, tickets, promedio)
- Últimas ventas realizadas
- Acciones rápidas según el contexto

### 💰 Gestión de Caja
- **Abrir Caja**: Registrar monto inicial y comenzar turno
- **Cerrar Caja**: Arqueo automático con detección de diferencias
- Resumen completo del turno (ventas, movimientos, totales)

### 🛒 POS (Punto de Venta)
- Búsqueda rápida de productos
- Filtrado por categorías
- Productos favoritos destacados
- Gestión de carrito (agregar, modificar cantidades, eliminar)
- Múltiples métodos de pago (Efectivo, QR, Tarjeta)
- Cálculo automático de cambio
- Interfaz táctil optimizada

### 📦 Gestión de Productos
- CRUD completo de productos
- Organización por categorías
- Productos por peso o por unidad
- Sistema de favoritos para acceso rápido
- Activar/desactivar productos
- Búsqueda y filtros

### 📈 Reportes
- Resumen de ventas por período
- Top 10 productos más vendidos
- Ventas diarias con gráficos
- Métricas clave (total, promedio, tickets)

## 🚀 Cómo Probar el Prototipo

### 1. El servidor ya está corriendo en:
```
http://localhost:5173/
```

### 2. Usuarios de Demostración

| Rol | Usuario | PIN | Permisos |
|-----|---------|-----|----------|
| **Administrador** | `admin` | `1234` | Acceso completo |
| **Cajero** | `cajero1` | `1111` | POS, Caja |
| **Encargado** | `encargado1` | `2222` | Todo excepto config |

### 3. Flujo Recomendado para Demo

#### Opción 1: Demo Rápido (5 minutos)
1. Login como **Cajero** (`cajero1` / `1111`)
2. Dashboard → Ver estado
3. **Abrir Caja** → Ingresar $500 de apertura
4. Ir al **POS**
5. Agregar productos al carrito (usa los favoritos)
6. Cobrar → Seleccionar efectivo → Confirmar
7. Ver ticket completado
8. Volver al Dashboard → Ver estadísticas actualizadas
9. **Cerrar Caja** → Contar efectivo y cerrar turno

#### Opción 2: Demo Completo (10-15 minutos)
1. Login como **Admin** (`admin` / `1234`)
2. **Productos** → Explorar catálogo
3. Crear un producto nuevo
4. Marcar productos como favoritos
5. Logout → Login como **Cajero**
6. Abrir Caja
7. Realizar 3-4 ventas variadas en el POS
8. Ir a **Reportes** → Ver análisis
9. Cerrar Caja con arqueo
10. Ver resumen de diferencias

## 🎨 Características de UI/UX

- ✅ **Diseño Premium**: Paleta de colores rojo oscuro + dorado
- ✅ **Responsivo**: Funciona en desktop (optimizado para PC)
- ✅ **Rápido**: Navegación fluida sin recargas
- ✅ **Intuitivo**: Iconos claros y acciones destacadas
- ✅ **Feedback Visual**: Estados, confirmaciones y alertas
- ✅ **Optimizado para Velocidad**: Búsqueda instantánea, favoritos, atajos

## 📦 Productos Pre-cargados

El sistema incluye 18 productos de carnicería:

**Res** (5 productos)
- Lomo Fino, Costilla, Carne Molida Premium, Churrasco, Asado de Tira

**Cerdo** (3 productos)
- Chuleta, Costilla, Lomo

**Pollo** (3 productos)
- Pechuga sin Hueso, Muslo, Pollo Entero

**Cordero** (2 productos)
- Pierna, Costilla

**Embutidos** (3 productos)
- Chorizo Artesanal, Salchicha Parrillera, Morcilla

**Vísceras** (2 productos)
- Hígado, Riñón

## 🔧 Tecnologías Utilizadas

- **React 19** + **TypeScript** - Framework y tipado
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Estilos utilitarios
- **Zustand** - Gestión de estado global
- **React Router** - Navegación SPA
- **Lucide React** - Iconos modernos

## ⚠️ Notas Importantes del Prototipo

- ✅ **Datos en Memoria**: Todo se almacena en el navegador (se pierde al recargar)
- ✅ **Sin Backend**: Lógica de negocio simulada en el frontend
- ✅ **Sin Impresión Real**: Muestra mensaje de "impresión simulada"
- ✅ **Sin Periféricos**: No conecta con impresoras, balanzas o lectores
- ✅ **Ideal para Demo**: Perfecto para mostrar el flujo y la UX

## 🎯 Próximos Pasos (Producción)

1. **Backend API** (NestJS + PostgreSQL)
2. **Agente Local** para impresoras y periféricos
3. **Persistencia** de datos
4. **Lector de códigos** de barras
5. **Integración con balanza** etiquetadora
6. **PWA completo** con offline support
7. **Multi-sucursal**
8. **Pantalla cliente** con QR de pago

## 📞 Soporte

Este es un prototipo de demostración. Para cualquier ajuste o pregunta, consulta con el desarrollador.

---

**© 2025 Carnicería Premium - Sistema POS Prototipo**
