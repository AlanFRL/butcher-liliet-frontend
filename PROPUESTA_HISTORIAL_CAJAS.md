# Propuesta: Historial de Cajas

## Resumen
El "Historial de Cajas" es una nueva funcionalidad que permitirá consultar, visualizar e imprimir todos los cierres de caja históricos del sistema.

---

## Ubicación en el Navbar

### Opción Recomendada 🎯
**Sección**: Directamente en el navbar principal  
**Nombre**: "Historial"  
**Icono**: `History` o `ClipboardList`  
**Posición**: Entre "Caja" y "Reportes"

```
Dashboard | POS | Pedidos | Productos | Inventario | Caja | **Historial** | Reportes | Configuración
```

**Justificación**:
- Es una sección independiente con entidad propia
- Los administradores la usarán con frecuencia para auditorías
- Se relaciona con "Caja" pero es una consulta histórica, no operativa
- Diferente de "Reportes" (que muestra estadísticas de ventas, no de cierres)

---

### Opción Alternativa 1
**Como subsección de "Caja"**  
Agregar un tab o link dentro de `/cash` que lleve a `/cash/history`

**Pros**:
- Más compacto en el navbar
- Lógicamente relacionado con operaciones de caja

**Contras**:
- Oculta una funcionalidad importante para administradores
- Los cajeros ven la sección "Caja" pero no deberían ver todo el historial de otras cajas

---

### Opción Alternativa 2
**Como subsección de "Reportes"**  
Agregar dentro de `/reports` con un tab "Historial de Cajas"

**Pros**:
- Los reportes ya tienen permisos de ADMIN/MANAGER
- Es una consulta de datos históricos

**Contras**:
- Reportes se enfoca en ventas y estadísticas
- El historial de cajas es más operativo/administrativo que analítico

---

## Estructura Propuesta

### Ruta
```
/cash/history
```

### Página
```
CashHistoryPage.tsx
```

### Permisos
- ✅ **ADMIN**: Ver todas las cajas de todas las terminales
- ✅ **MANAGER**: Ver todas las cajas de todas las terminales  
- ❌ **CASHIER**: No tiene acceso al historial completo (solo ve su cierre actual)

---

## Funcionalidades

### 1. Filtros
- **Rango de fechas**: Desde - Hasta
- **Terminal/Caja**: Dropdown con todas las terminales
- **Usuario**: Dropdown con todos los cajeros
- **Estado**: Todas / Con diferencia / Sin diferencia

### 2. Tabla de Resultados
Columnas:
- Fecha de cierre
- Hora de cierre
- Usuario (quien cerró)
- Terminal
- Monto inicial
- Total ventas
- Efectivo esperado
- Efectivo contado
- Diferencia (con color: verde=0, rojo=faltante, azul=sobrante)
- Acciones: [Ver detalle] [Imprimir]

### 3. Detalle de Cierre
Modal que muestra:
- Toda la información del cierre
- Lista de ventas del turno
- Movimientos de caja (ingresos/retiros)
- Notas/observaciones
- Botón "Imprimir" (usando el mismo componente `ThermalReceipt` con `printable={true}`)

### 4. Impresión
- Usar el mismo componente `ThermalReceipt.tsx`
- Usar el patrón de `data-printable="true"` con CSS externo
- `window.print()` directo
- El recibo ya está listo para imprimirse correctamente

---

## Navegación Recomendada

```typescript
// En Navbar.tsx
const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'POS', path: '/pos', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'Pedidos', path: '/orders', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'Productos', path: '/products', icon: Package, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'Inventario', path: '/inventory', icon: Boxes, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Caja', path: '/cash', icon: DollarSign, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'Historial', path: '/cash/history', icon: History, roles: ['ADMIN', 'MANAGER'] }, // ← NUEVO
  { name: 'Reportes', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Configuración', path: '/settings', icon: Settings, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
];
```

---

## API Necesaria (Backend)

### GET `/cash-sessions/history`
Query params:
- `startDate`: string (ISO format)
- `endDate`: string (ISO format)
- `terminalId?`: string (opcional)
- `userId?`: string (opcional)
- `status?`: 'all' | 'with-difference' | 'without-difference'

Response:
```typescript
{
  sessions: Array<{
    id: string;
    terminalId: string;
    terminal: { name: string };
    userId: string;
    user: { fullName: string };
    openedAt: string;
    closedAt: string;
    openingAmount: number;
    closingAmount: number;
    expectedAmount: number;
    differenceAmount: number;
    openingNotes: string | null;
    closingNotes: string | null;
    // Relaciones populadas
    sales: Sale[];
    movements: CashMovement[];
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}
```

### GET `/cash-sessions/:id`
Devuelve el detalle completo de una sesión específica con todas sus relaciones.

---

## Implementación Sugerida

### Fase 1 (Inmediata)
1. ✅ Crear componente `CashHistoryPage.tsx`
2. ✅ Agregar ruta en `App.tsx`
3. ✅ Agregar item en navbar
4. ✅ Implementar tabla básica con filtros
5. ✅ Modal de detalle reutilizando `ThermalReceipt`

### Fase 2 (Mejoras futuras)
- Exportar a Excel/PDF
- Gráficos de diferencias por periodo
- Alertas de diferencias recurrentes
- Comparativa entre terminales
- Estadísticas de cajeros (precisión)

---

## Beneficios

### Para Administradores
- Auditoría completa de operaciones de caja
- Detección rápida de patrones de diferencias
- Histórico completo para contabilidad
- Impresión de cualquier cierre pasado

### Para Managers
- Supervisión de cajeros
- Verificación de cierres sin acceso a la caja física
- Respaldo ante consultas de clientes

### Para el Sistema
- Trazabilidad completa
- Datos para análisis de riesgos
- Respaldo ante auditorías

---

## Conclusión

La ubicación recomendada es **como item independiente en el navbar** entre "Caja" e "Historial", con permisos solo para ADMIN y MANAGER. Esto le da la visibilidad que merece una funcionalidad de auditoría tan importante, sin sobrecargar otras secciones.
