# Debug: Problema de Triplicación de Impresión

## Síntomas
- ReportsPage: Recibo se imprime 3 veces
- POSPage: Funciona correctamente sin duplicación

## Confirmado por logs
- Solo hay 1 componente PrintableSaleReceipt en el DOM
- El componente se renderiza solo 1 vez
- Conclusión: **El navegador está creando 3 páginas automáticamente**

## Intentos fallidos

### 1. Ocultar modal con CSS
- ❌ Usó `display: none` en elementos `.fixed`
- Resultado: Ocultaba también el recibo

### 2. Mover recibo fuera del Modal
- ❌ Usó Fragment `<>` para poner recibo fuera del Modal
- Resultado: Aún triplicado

### 3. CSS page-break-inside: avoid
- ❌ Agregó `page-break-inside: avoid`, `page-break-after: avoid`
- Resultado: No funciona con `position: fixed`

### 4. overflow: visible vs hidden
- ❌ Cambió `overflow: hidden` a `visible`
- Resultado: Página en blanco

### 5. Altura explícita
- ❌ Agregó `height: auto` y `max-height: none`
- Resultado: Aún triplicado

## Diferencias POSPage vs ReportsPage

### POSPage (FUNCIONA)
- Usa ThermalReceiptSale
- Tiene atributo `data-printable="true"`
- Modal de éxito de venta (simple)

### ReportsPage (FALLA)
- Usa PrintableSaleReceipt
- Sin atributo `data-printable`
- Modal de detalle de venta (complejo)

## Hipótesis actual
El problema NO es React ni el DOM. Es el **motor de impresión del navegador** que:
1. Detecta contenido que "no cabe" en una página estándar
2. Crea automáticamente múltiples páginas
3. Ignora `@page { size: 62mm auto }`

## Solución propuesta
Usar **nueva ventana** con HTML aislado para impresión, igual que muchas aplicaciones web hacen para tickets.
