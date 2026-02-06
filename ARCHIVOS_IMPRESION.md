# 📄 Archivos de Impresión - Sistema Butcher Lilieth

## Resumen de Componentes de Impresión

El sistema utiliza tres componentes principales para impresión térmica, cada uno con un propósito específico y CSS dedicado.

---

## 1. ThermalReceiptSale

**Archivos:**
- `src/components/ThermalReceiptSale.tsx`
- `src/components/ThermalReceiptSale.css`

**Uso:**
- **Dónde:** Modal de éxito después de completar una venta en el POS
- **Archivo que lo usa:** `src/pages/POSPage.tsx`
- **Cuándo se imprime:** Inmediatamente después de finalizar una venta exitosa

**Contenido del ticket:**
```
=============================
       BUTCHER LILIETH
=============================
Venta #123
Fecha: 22/01/2025
Hora: 14:30:25
Cajero(a): María González
-----------------------------
PRODUCTOS
1.250 kg × Bs 71.20/kg
    Costilla de res          Bs 89.00

2 und × Bs 25.00
    Chorizo parrillero       Bs 50.00
-----------------------------
TOTAL                    Bs 139.00
=============================
```

**Características CSS:**
- Ancho: 72mm (XPrinter XP-80T)
- Fuente base: 10pt, font-weight 600
- Títulos: 12pt, font-weight 700
- Bordes: 0.6mm
- Padding: 2mm

---

## 2. ThermalReceipt

**Archivos:**
- `src/components/ThermalReceipt.tsx`
- `src/components/ThermalReceiptCashClose.css`

**Uso:**
- **Dónde:** 
  1. Vista previa y cierre final de caja (CashClosePage)
  2. Detalle de caja en historial de reportes (CashSessionDetail)
- **Archivos que lo usan:** 
  - `src/pages/CashClosePage.tsx` (líneas 462-486: vista previa, 590-614: cierre final)
  - `src/components/reports/CashSessionDetail.tsx` (líneas 387-412)
- **Cuándo se imprime:** 
  - Al cerrar una sesión de caja
  - Al consultar historial de cajas en reportes

**Contenido del ticket:**
```
=============================
   BUTCHER LILIETH
   REPORTE DE CAJA
=============================
Sesión: CAJA-001-20250122
Terminal: CAJA-001
Aperturado por: Admin González
Cerrado por: Admin González
Fecha apertura: 22/01/2025 08:00
Fecha cierre: 22/01/2025 18:30
-----------------------------
RESUMEN
Efectivo inicial          Bs 200.00
Total ventas (15)         Bs 1,250.00
Total egresos (2)         Bs 100.00
Efectivo esperado         Bs 1,350.00
Efectivo contado          Bs 1,350.00
Diferencia                Bs 0.00
-----------------------------
DETALLE DE VENTAS

Venta #001 - 08:15
1.250 kg × Bs 71.20/kg
Costilla de res           Bs 89.00
Total                     Bs 89.00

Venta #002 - 09:30
2 und × Bs 25.00
Chorizo parrillero        Bs 50.00
Total                     Bs 50.00

[... más ventas ...]
-----------------------------
EGRESOS

1. Compra de insumos
   Bs 50.00

2. Pago a proveedor
   Bs 50.00
-----------------------------
TOTAL EFECTIVO        Bs 1,350.00
=============================
```

**Características CSS:**
- Ancho: 72mm (XPrinter XP-80T)
- Fuente base: 10pt, font-weight 600
- Títulos: 12pt, font-weight 700
- Bordes: 0.6mm
- Padding: 2mm
- Misma configuración que ThermalReceiptSale.css

---

## 3. PrintableSaleReceipt

**Archivos:**
- `src/components/PrintableSaleReceipt.tsx`
- No tiene CSS dedicado (usa estilos en línea)

**Uso:**
- **Dónde:** Modal de detalle de venta individual en reportes
- **Archivo que lo usa:** `src/components/reports/SalesHistoryTab.tsx`
- **Cuándo se imprime:** Al hacer clic en "Ver detalles" de una venta en el historial de ventas

**Contenido del ticket:**
```
================================
        BUTCHER LILIETH
================================
DETALLE DE VENTA #123
Fecha: 22/01/2025
Hora: 14:30:25
Cajero(a): María González
--------------------------------
PRODUCTOS

Costilla de res
1.250 kg × Bs 71.20/kg
                         Bs 89.00

Chorizo parrillero
2 und × Bs 25.00
                         Bs 50.00
--------------------------------
SUBTOTAL                Bs 139.00
TOTAL                   Bs 139.00
================================
```

**Características:**
- Usa estilos en línea
- Formato similar a ThermalReceiptSale
- Enfocado en el detalle de una venta específica

---

## Flujo de Uso

### En el POS
1. Usuario completa una venta
2. Sistema muestra modal de éxito
3. Automáticamente muestra **ThermalReceiptSale** para imprimir
4. Usuario hace clic en "Imprimir" (abre diálogo del navegador)

### En Cierre de Caja
1. Usuario abre caja (CashOpenPage)
2. Durante el día, realiza ventas y movimientos
3. Al final del día, va a "Cerrar Caja" (CashClosePage)
4. Sistema muestra vista previa con **ThermalReceipt** (modal de confirmación)
5. Usuario confirma y se muestra el ticket final con **ThermalReceipt**
6. Usuario imprime el reporte completo

### En Reportes - Historial de Cajas
1. Usuario va a Reportes > Historial de Cajas
2. Selecciona una sesión de caja cerrada
3. Hace clic en "Ver detalles"
4. Sistema carga datos y muestra **ThermalReceipt** con todos los detalles
5. Usuario puede imprimir el reporte histórico

### En Reportes - Historial de Ventas
1. Usuario va a Reportes > Historial de Ventas
2. Hace clic en "Ver detalles" de una venta específica
3. Sistema muestra **PrintableSaleReceipt** con el detalle
4. Usuario puede imprimir el ticket individual

---

## Configuración de Impresora

**Impresora actual:** XPrinter XP-80T

**Especificaciones:**
- Ancho de papel: 72mm
- Caracteres por línea: 48 chars
- Velocidad: 200mm/s
- Protocolo: ESC/POS compatible

**Configuración CSS:**
- @page size: 72mm (ajustado desde 62mm de Brother QL-800)
- Fuente: 10pt con font-weight 600 para máxima legibilidad
- Color: #000 (negro puro) para contraste óptimo
- Bordes: 0.6mm de grosor para separadores visibles

---

## Notas Importantes

### Formatos de Productos
- **Productos por peso (kg):** `1.250 kg × Bs 71.20/kg`
- **Productos por unidad:** `2 und × Bs 25.00`
- Se calcula `pricePerKg` cuando hay `actualWeight` (productos al vacío)

### Impresión Automática
- ⚠️ No es posible imprimir directamente sin diálogo del navegador
- **Restricción:** Seguridad del navegador (no permite window.print() automático)
- **Solución futura:** Implementar LocalAgent con ESC/POS para imprimir vía USB
- **Documentación:** Ver `IMPRESION_AUTOMATICA.md` para más detalles

### Datos de Usuario
- Los tickets ahora muestran el nombre completo del usuario (`fullName`)
- Campos: `Aperturado por`, `Cerrado por`, `Cajero(a)`
- Se obtienen desde `CashSession.user` y `CashSession.closedBy`

---

## Archivos Relacionados

### Componentes
- `src/components/ThermalReceiptSale.tsx` - Ticket de venta POS
- `src/components/ThermalReceipt.tsx` - Reporte de cierre de caja
- `src/components/PrintableSaleReceipt.tsx` - Detalle de venta individual

### CSS
- `src/components/ThermalReceiptSale.css` - Estilos para ticket de venta
- `src/components/ThermalReceiptCashClose.css` - Estilos para cierre de caja

### Páginas que usan impresión
- `src/pages/POSPage.tsx` - Usa ThermalReceiptSale
- `src/pages/CashClosePage.tsx` - Usa ThermalReceipt (2 veces)
- `src/components/reports/CashSessionDetail.tsx` - Usa ThermalReceipt
- `src/components/reports/SalesHistoryTab.tsx` - Usa PrintableSaleReceipt

### Store y API
- `src/store/index.ts` - loadCurrentSession() mapea user y closedBy
- `src/services/api.ts` - Define CashSessionResponse con campos user/closedBy
