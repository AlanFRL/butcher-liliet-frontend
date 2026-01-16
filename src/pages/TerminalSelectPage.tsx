import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, MapPin, ChevronRight, Lock, User } from 'lucide-react';
import { Button } from '../components/ui';
import { useAppStore, useAuthStore } from '../store';
import { cashSessionsApi } from '../services/api';

interface TerminalWithSession {
  id: string;
  name: string;
  location: string | null;
  isActive: boolean;
  hasOpenSession: boolean;
  sessionUser?: string;
  sessionOpenedAt?: string;
}

export const TerminalSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { terminals, currentTerminal, setCurrentTerminal, loadTerminals } = useAppStore();
  const { currentUser } = useAuthStore();
  const [selectedTerminal, setSelectedTerminal] = useState<string | null>(
    currentTerminal?.id || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [terminalsWithSessions, setTerminalsWithSessions] = useState<TerminalWithSession[]>([]);

  useEffect(() => {
    const init = async () => {
      await loadTerminals();
      await checkTerminalSessions();
      setIsLoading(false);
    };
    init();
  }, []);

  const checkTerminalSessions = async () => {
    try {
      const terminalsData: TerminalWithSession[] = await Promise.all(
        terminals.map(async (terminal) => {
          try {
            const session = await cashSessionsApi.getOpenByTerminal(terminal.id);
            return {
              ...terminal,
              hasOpenSession: !!session,
              sessionUser: session?.user?.fullName,
              sessionOpenedAt: session?.openedAt,
            };
          } catch (error) {
            return {
              ...terminal,
              hasOpenSession: false,
            };
          }
        })
      );
      setTerminalsWithSessions(terminalsData);
    } catch (error) {
      console.error('Error checking terminal sessions:', error);
      setTerminalsWithSessions(terminals.map(t => ({ ...t, hasOpenSession: false })));
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

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
          {terminalsWithSessions.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No hay terminales disponibles</p>
              <p className="text-gray-500 text-sm mt-1">
                Contacta al administrador para configurar terminales
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {terminalsWithSessions.map((terminal) => (
                <button
                  key={terminal.id}
                  onClick={() => setSelectedTerminal(terminal.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between group ${
                    selectedTerminal === terminal.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                        selectedTerminal === terminal.id
                          ? 'bg-primary-600 text-white'
                          : terminal.hasOpenSession
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600'
                      }`}
                    >
                      {terminal.hasOpenSession ? (
                        <Lock className="w-6 h-6" />
                      ) : (
                        <Monitor className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {terminal.name}
                        </h3>
                        {terminal.hasOpenSession && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            En uso
                          </span>
                        )}
                      </div>
                      {terminal.location && (
                        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>{terminal.location}</span>
                        </div>
                      )}
                      {terminal.hasOpenSession && terminal.sessionUser && (
                        <div className="flex items-center gap-1 text-orange-600 text-sm mt-1">
                          <User className="w-4 h-4" />
                          <span>Abierta por {terminal.sessionUser}</span>
                          {terminal.sessionOpenedAt && (
                            <span className="text-gray-500 ml-1">
                              · desde {formatTime(terminal.sessionOpenedAt)}
                            </span>
                          )}
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
