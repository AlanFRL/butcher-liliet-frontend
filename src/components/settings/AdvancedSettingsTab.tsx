import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Info } from 'lucide-react';
import { ToggleSwitch } from '../ui/ToggleSwitch';

export const AdvancedSettingsTab: React.FC = () => {
  const [allowDeleteOrders, setAllowDeleteOrders] = useState(false);
  const [allowDeleteSales, setAllowDeleteSales] = useState(false);

  // Cargar configuración desde localStorage al montar
  useEffect(() => {
    const storedDeleteOrders = localStorage.getItem('butcher_allow_delete_orders') === 'true';
    const storedDeleteSales = localStorage.getItem('butcher_allow_delete_sales') === 'true';
    
    setAllowDeleteOrders(storedDeleteOrders);
    setAllowDeleteSales(storedDeleteSales);
  }, []);

  const handleToggleDeleteOrders = (value: boolean) => {
    localStorage.setItem('butcher_allow_delete_orders', value.toString());
    setAllowDeleteOrders(value);
  };

  const handleToggleDeleteSales = (value: boolean) => {
    localStorage.setItem('butcher_allow_delete_sales', value.toString());
    setAllowDeleteSales(value);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Encabezado con advertencia */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-red-900 mb-1">Funcionalidades Avanzadas - Uso Restringido</h3>
          <p className="text-sm text-red-700">
            Estas opciones permiten operaciones críticas que pueden afectar datos históricos, inventario y arqueos de caja. 
            <span className="font-semibold"> Solo deben habilitarse bajo supervisión de administrador</span> y con pleno conocimiento de las implicaciones.
          </p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6 text-gray-700" />
        Configuración de Permisos
      </h2>

      <div className="space-y-6">
        {/* Toggle: Eliminar Pedidos con Ventas */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <ToggleSwitch
            id="allow-delete-orders"
            label="Permitir eliminar pedidos con ventas asociadas"
            description="Permite eliminar pedidos que tienen ventas registradas en el POS."
            checked={allowDeleteOrders}
            onChange={handleToggleDeleteOrders}
          />
          
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
            <h4 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Efectos al eliminar pedido con venta:
            </h4>
            <ul className="text-sm text-orange-800 space-y-1.5 ml-6 list-disc">
              <li>Se elimina el pedido y la venta completa del sistema</li>
              <li>Se restaura el inventario de productos UNIT</li>
              <li>Se ajusta el monto esperado de la sesión de caja actual</li>
              <li>Se requiere confirmación doble con advertencia explícita</li>
            </ul>
          </div>

          {/* Restricción sesión cerrada */}
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs font-semibold text-red-900 mb-1">⚠️ RESTRICCIÓN IMPORTANTE:</p>
            <p className="text-xs text-red-800">
              <span className="font-semibold">Sesiones cerradas:</span> Eliminar pedidos con ventas de sesiones cerradas 
              <span className="font-bold"> modificará arqueos históricos</span> y puede causar inconsistencias en reportes contables. 
              Esta operación requiere auditoría estricta y se registrará en los logs del sistema.
            </p>
          </div>
        </div>

        {/* Toggle: Eliminar Ventas */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <ToggleSwitch
            id="allow-delete-sales"
            label="Permitir eliminar ventas desde Reportes"
            description="Permite eliminar ventas directamente desde la sección de Reportes."
            checked={allowDeleteSales}
            onChange={handleToggleDeleteSales}
          />
          
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
            <h4 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Efectos al eliminar venta:
            </h4>
            <ul className="text-sm text-orange-800 space-y-1.5 ml-6 list-disc">
              <li>Se elimina la venta y todos sus items registrados</li>
              <li>Se restaura el inventario de productos UNIT</li>
              <li>Si existía pedido asociado, vuelve al estado "READY"</li>
              <li>Se recalcula el monto esperado de la sesión afectada</li>
            </ul>
          </div>

          {/* Restricción sesión cerrada MÁS PELIGROSA */}
          <div className="mt-3 p-3 bg-red-100 border-2 border-red-300 rounded-md">
            <p className="text-xs font-bold text-red-950 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              ⛔ RIESGO MUY ALTO
            </p>
            <p className="text-xs text-red-900">
              Eliminar ventas de sesiones cerradas <span className="font-bold">modifica arqueos finales y reportes históricos</span>. 
              Esta operación puede generar discrepancias contables serias y afectar la integridad de auditorías pasadas. 
              <span className="font-bold"> Solo usar en casos excepcionales</span> y documentar la razón de eliminación.
            </p>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Notas de Seguridad
          </h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              <span className="font-semibold">Permisos de rol:</span> Solo usuarios con rol ADMIN pueden eliminar pedidos y ventas, independientemente de estas configuraciones.
            </li>
            <li>
              <span className="font-semibold">Auditoría:</span> Todas las eliminaciones quedan registradas en logs del sistema con fecha, hora, usuario y entidad afectada.
            </li>
            <li>
              <span className="font-semibold">Sesión actual vs. cerrada:</span> Se mostrará confirmación diferente según si la sesión está abierta o cerrada, con advertencias específicas.
            </li>
            <li>
              <span className="font-semibold">Recomendación:</span> Mantener estas opciones deshabilitadas en operación normal. Habilitar solo cuando sea necesario corregir errores específicos.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
