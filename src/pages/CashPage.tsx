import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Plus, Minus, Receipt, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui';
import { useCashStore, useSalesStore, useAuthStore } from '../store';

export const CashPage: React.FC = () => {
  const { currentSession, cashMovements, addCashMovement } = useCashStore();
  const { sales } = useSalesStore();
  const { currentUser } = useAuthStore();
  const [showDepositModal, setShowDepositModal] = React.useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState('');
  
  // Calcular totales de la sesión actual
  const sessionSales = currentSession
    ? sales.filter(
        (s) => s.cashSessionId === currentSession.id && s.status === 'COMPLETED'
      )
    : [];
  
  const totalSales = sessionSales.reduce((sum, sale) => sum + sale.total, 0);
  const salesCount = sessionSales.length;
  
  const cashIn = cashMovements
    .filter((m) => m.type === 'DEPOSIT')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const cashOut = cashMovements
    .filter((m) => m.type === 'WITHDRAWAL')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const expectedCash = currentSession
    ? currentSession.openingAmount + totalSales + cashIn - cashOut
    : 0;
  
  const handleDeposit = async () => {
    setError('');
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    
    if (!reason.trim()) {
      setError('Debe ingresar un motivo');
      return;
    }
    
    setIsProcessing(true);
    const success = await addCashMovement('DEPOSIT', amountNum, reason);
    setIsProcessing(false);
    
    if (success) {
      setShowDepositModal(false);
      setAmount('');
      setReason('');
    } else {
      setError('Error al registrar el ingreso');
    }
  };
  
  const handleWithdrawal = async () => {
    setError('');
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    
    if (!reason.trim()) {
      setError('Debe ingresar un motivo');
      return;
    }
    
    setIsProcessing(true);
    const success = await addCashMovement('WITHDRAWAL', amountNum, reason);
    setIsProcessing(false);
    
    if (success) {
      setShowWithdrawalModal(false);
      setAmount('');
      setReason('');
    } else {
      setError('Error al registrar el retiro');
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Caja
        </h1>
        <p className="text-gray-600">
          Administra tu turno, movimientos y arqueo
        </p>
      </div>
      
      {/* Estado de Caja */}
      <div className="mb-8">
        {currentSession?.status === 'OPEN' ? (
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-green-900">
                    Caja Abierta
                  </h2>
                  <p className="text-green-700">
                    Sesión iniciada a las {new Date(currentSession.openedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Link to="/cash/close">
                <Button variant="danger" size="lg">
                  <Receipt className="w-5 h-5 mr-2" />
                  Cerrar Caja
                </Button>
              </Link>
            </div>
            
            {/* Resumen Actual */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Monto Inicial</p>
                <p className="text-2xl font-bold text-gray-900">
                  Bs {currentSession.openingAmount.toFixed(2)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Ventas</p>
                <p className="text-2xl font-bold text-green-600">
                  Bs {totalSales.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{salesCount} tickets</p>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Movimientos</p>
                <p className="text-lg font-bold text-gray-900">
                  <span className="text-green-600">+Bs {cashIn.toFixed(2)}</span>
                  {' / '}
                  <span className="text-red-600">-Bs {cashOut.toFixed(2)}</span>
                </p>
              </div>
              
              <div className="bg-primary-50 border-2 border-primary-300 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Efectivo Esperado</p>
                <p className="text-2xl font-bold text-primary-700">
                  Bs {expectedCash.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 border-2 border-orange-500 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-orange-900">
                    Caja Cerrada
                  </h2>
                  <p className="text-orange-700">
                    No hay una sesión activa. Abre caja para comenzar a operar.
                  </p>
                </div>
              </div>
              {['ADMIN', 'CASHIER', 'MANAGER'].includes(currentUser?.role || '') && (
                <Link to="/cash/open">
                  <Button variant="success" size="lg">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Abrir Caja
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Acciones Rápidas */}
      {currentSession?.status === 'OPEN' && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Movimientos de Efectivo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Ingreso de Efectivo</h3>
                  <p className="text-sm text-gray-600">
                    Registrar entrada de dinero (depósito, corrección, etc.)
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Registra ingresos adicionales de efectivo
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowDepositModal(true)}
              >
                Registrar Ingreso
              </Button>
            </div>
            
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Minus className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Retiro de Efectivo</h3>
                  <p className="text-sm text-gray-600">
                    Registrar salida de dinero (banco, gastos, etc.)
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Registra salidas de efectivo de la caja
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowWithdrawalModal(true)}
              >
                Registrar Retiro
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Movimientos Recientes */}
      {currentSession && cashMovements.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Movimientos de Esta Sesión
          </h2>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cashMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(movement.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          movement.type === 'DEPOSIT'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {movement.type === 'DEPOSIT' ? 'Ingreso' : 'Retiro'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {movement.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">
                      <span
                        className={
                          movement.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {movement.type === 'DEPOSIT' ? '+' : '-'}Bs {movement.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Información */}
      {!currentSession && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Consejo:</strong> La gestión de caja te permite controlar el efectivo de tu turno.
            Abre caja al iniciar tu jornada, registra movimientos si es necesario, y cierra al finalizar
            para realizar el arqueo.
          </p>
        </div>
      )}
      
      {/* Modal de Ingreso */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Registrar Ingreso de Efectivo</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Bs</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-2 text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Describe el motivo del ingreso..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex space-x-3 pt-2">
                <Button
                  onClick={() => {
                    setShowDepositModal(false);
                    setAmount('');
                    setReason('');
                    setError('');
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDeposit}
                  variant="success"
                  className="flex-1"
                  isLoading={isProcessing}
                >
                  Registrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Retiro */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Registrar Retiro de Efectivo</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Bs</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-2 text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Describe el motivo del retiro..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex space-x-3 pt-2">
                <Button
                  onClick={() => {
                    setShowWithdrawalModal(false);
                    setAmount('');
                    setReason('');
                    setError('');
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleWithdrawal}
                  variant="danger"
                  className="flex-1"
                  isLoading={isProcessing}
                >
                  Registrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
