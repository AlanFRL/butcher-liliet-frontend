# 🚨 PROBLEMA EN BACKEND: Auto-entrega al Pagar

## Descripción del Problema

Cuando se completa el pago de un pedido desde el POS, el **backend marca automáticamente el pedido como DELIVERED** (entregado). Esto es incorrecto porque el pago y la entrega son dos procesos separados.

## Flujo Actual (Incorrecto) ❌

```
1. Pedido en estado READY
2. Usuario hace clic en "Cobrar en POS"
3. Se navega al POS y se completa el pago
4. Backend crea la venta (Sale) ✓
5. Backend marca el order como DELIVERED automáticamente ✗
```

## Flujo Esperado (Correcto) ✅

```
1. Pedido en estado READY
2. Usuario hace clic en "Cobrar en POS"
3. Se navega al POS y se completa el pago
4. Backend crea la venta (Sale) ✓
5. Backend actualiza order.saleId (ID de la venta) ✓
6. Order permanece en READY hasta que se marque manualmente como DELIVERED ✓
7. Usuario hace clic en "Marcar como Entregado" cuando realmente entrega
```

## Ubicación del Problema

### Frontend (Documentación)

**Archivo:** `src/store/index.ts`  
**Línea:** 1069  
**Comentario existente:**
```typescript
// (el backend ya marcó el order como DELIVERED al crear la venta)
if (orderId) {
  const orderState = useOrderStore.getState();
  orderState.loadOrders();
}
```

Este comentario confirma que el backend está marcando el pedido como DELIVERED.

### Backend (Requiere Corrección)

El problema está en el endpoint que crea las ventas (Sales). Cuando se crea una venta con un `orderId` asociado:

**Comportamiento actual:**
```csharp
// Pseudo-código del problema
CreateSale(SaleData data) {
    var sale = CreateSaleRecord(data);
    
    if (data.OrderId != null) {
        var order = GetOrder(data.OrderId);
        order.SaleId = sale.Id;
        order.Status = OrderStatus.DELIVERED; // ❌ PROBLEMA AQUÍ
        UpdateOrder(order);
    }
    
    return sale;
}
```

**Comportamiento esperado:**
```csharp
// Corrección necesaria
CreateSale(SaleData data) {
    var sale = CreateSaleRecord(data);
    
    if (data.OrderId != null) {
        var order = GetOrder(data.OrderId);
        order.SaleId = sale.Id; // ✓ Solo actualizar el saleId
        // ❌ NO cambiar el status aquí
        UpdateOrder(order);
    }
    
    return sale;
}
```

## Impacto del Problema

### Para el Usuario:
- ❌ No puede controlar cuándo marca un pedido como entregado
- ❌ Los pedidos pagados aparecen como "entregados" aunque aún no se hayan entregado físicamente
- ❌ Pierde visibilidad de qué pedidos están pagados pero pendientes de entrega

### Para el Negocio:
- ❌ No hay diferenciación entre "pagado" y "entregado"
- ❌ No se puede rastrear cuándo se entregó realmente el pedido
- ❌ Métricas inexactas de tiempo de entrega

## Solución Aplicada en Frontend (Temporal)

Para mitigar el problema mientras se corrige el backend, se aplicaron estos cambios:

1. **Botón "Cobrar en POS" visible incluso para pedidos DELIVERED sin pago**
   ```tsx
   {(currentOrder.status === 'READY' || 
     (currentOrder.status === 'DELIVERED' && !currentOrder.saleId)) && (
     <Button onClick={handleChargeOrder}>Cobrar en POS</Button>
   )}
   ```

2. **Badge de advertencia para pedidos entregados sin pago**
   ```tsx
   {currentOrder.status === 'DELIVERED' && !currentOrder.saleId && (
     <span>⚠️ Sin cobro</span>
   )}
   ```

Estos cambios permiten:
- ✅ Hacer el pago incluso si se marcó como entregado primero
- ✅ Identificar visualmente pedidos entregados sin cobro

## Acción Requerida

**Debe modificarse el backend** para que:
1. Al crear una venta con `orderId`, solo actualice `order.saleId`
2. NO modifique el `order.status`
3. Permita que el frontend controle cuándo marcar como DELIVERED

## Verificación

Una vez corregido el backend, verificar que:
- [ ] Al pagar un pedido READY, permanece en READY
- [ ] El `order.saleId` se actualiza correctamente
- [ ] Solo cambia a DELIVERED cuando se hace clic en "Marcar como Entregado"
- [ ] Un pedido puede estar en estado READY con `saleId` (pagado pero no entregado)

## Contacto

Si tienes dudas sobre esta corrección, revisa:
- Frontend: `OrderDetailModal.tsx` (lógica de botones)
- Store: `src/store/index.ts` línea 1069 (comentario sobre el comportamiento)
- Backend: Endpoint de creación de ventas (Sales controller)
