import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign } from 'lucide-react';
import { Button } from '../components/ui';
import { useCashStore, useAuthStore, useAppStore } from '../store';

export const CashOpenPage: React.FC = () => {
  const [openingAmount, setOpeningAmount] = useState('');
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState('');
  
  const navigate = useNavigate();
  const { currentSession, openCashSession, isLoading, error } = useCashStore();
  const { currentUser } = useAuthStore();
  const { currentTerminal } = useAppStore();
  
  // Si ya hay caja abierta, redirigir
  if (currentSession?.status === 'OPEN') {
    navigate('/dashboard');
    return null;
  }
  
  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    if (!currentTerminal) {
      setLocalError('No hay terminal seleccionada');
      return;
    }
    
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      setLocalError('El monto inicial debe ser un número válido');
      return;
    }
    
    // Llamar al backend (ya no necesitamos userId, el backend lo toma del token)
    const success = await openCashSession(currentTerminal.id, amount, note);
    
    if (success) {
      navigate('/dashboard');
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">
          Abrir Caja
        </h1>
        <p className="text-gray-600 text-center mb-5">
          Registra el monto inicial para comenzar tu turno
        </p>
        
        {/* Información del Turno */}
        <div className="bg-gray-50 rounded-lg p-3 mb-5 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Terminal:</span>
            <span className="font-semibold text-gray-900">
              {currentTerminal?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Usuario:</span>
            <span className="font-semibold text-gray-900">
              {currentUser?.fullName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fecha:</span>
            <span className="font-semibold text-gray-900">
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        {/* Formulario */}
        <form onSubmit={handleOpenCash} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Inicial <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-bold">
                Bs
              </span>
              <input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
                required
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Ingresa el efectivo con el que inicias tu turno
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nota (Opcional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Observaciones o comentarios sobre la apertura..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          
          {/* Mensaje de Error */}
          {(localError || error) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {localError || error}
            </div>
          )}
          
          {/* Botones */}
          <div className="flex space-x-3 pt-2">
            <Button
              type="button"
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              size="lg"
              className="flex-1"
              isLoading={isLoading}
            >
              Abrir Caja
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
