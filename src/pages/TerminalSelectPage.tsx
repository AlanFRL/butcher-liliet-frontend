import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui';
import { useAppStore, useAuthStore } from '../store';

export const TerminalSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { terminals, currentTerminal, setCurrentTerminal, loadTerminals } = useAppStore();
  const { currentUser } = useAuthStore();
  const [selectedTerminal, setSelectedTerminal] = useState<string | null>(
    currentTerminal?.id || null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadTerminals();
      setIsLoading(false);
    };
    init();
  }, []);

  const handleContinue = () => {
    if (!selectedTerminal) return;
    
    const terminal = terminals.find(t => t.id === selectedTerminal);
    if (terminal) {
      setCurrentTerminal(terminal);
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando terminales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selecciona tu Terminal
          </h1>
          <p className="text-gray-600">
            Hola, <span className="font-semibold">{currentUser?.fullName}</span>
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Elige la caja o terminal donde trabajarás hoy
          </p>
        </div>

        {/* Lista de Terminales */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {terminals.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No hay terminales disponibles</p>
              <p className="text-gray-500 text-sm mt-1">
                Contacta al administrador para configurar terminales
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {terminals.map((terminal) => (
                <button
                  key={terminal.id}
                  onClick={() => setSelectedTerminal(terminal.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between group ${
                    selectedTerminal === terminal.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                        selectedTerminal === terminal.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600'
                      }`}
                    >
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {terminal.name}
                      </h3>
                      {terminal.location && (
                        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>{terminal.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 transition-colors ${
                      selectedTerminal === terminal.id
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botón Continuar */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleContinue}
          disabled={!selectedTerminal}
        >
          Continuar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>

        {/* Botón Cerrar Sesión */}
        <button
          onClick={() => {
            useAuthStore.getState().logout();
            navigate('/login');
          }}
          className="w-full mt-4 text-gray-600 hover:text-gray-900 text-sm py-2"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};
