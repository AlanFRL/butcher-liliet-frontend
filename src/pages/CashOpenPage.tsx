import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useCashStore, useAuthStore, useAppStore } from '../store';

export const CashOpenPage: React.FC = () => {
  const [openingAmount, setOpeningAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { currentSession, openCashSession } = useCashStore();
  const { currentUser } = useAuthStore();
  const { currentTerminal } = useAppStore();
  
  // Si ya hay caja abierta, redirigir
  if (currentSession?.status === 'OPEN') {
    navigate('/dashboard');
    return null;
  }
  
  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !currentTerminal) return;
    
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      alert('El monto inicial debe ser un número válido');
      return;
    }
    
    setIsLoading(true);
    
    // Simular delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    openCashSession(currentUser.id, currentTerminal.id, amount, note);
    
    setIsLoading(false);
    navigate('/dashboard');
  };
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Abrir Caja
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Registra el monto inicial para comenzar tu turno
        </p>
        
        {/* Información del Turno */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
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
        <form onSubmit={handleOpenCash} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Inicial <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-2xl font-bold">
                Bs
              </span>
              <input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-4 text-3xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
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
              rows={3}
              placeholder="Observaciones o comentarios sobre la apertura..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          
          {/* Botones */}
          <div className="flex space-x-3 pt-4">
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
