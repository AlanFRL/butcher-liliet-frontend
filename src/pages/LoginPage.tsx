import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock } from 'lucide-react';
import { Button } from '../components/ui';
import { useAuthStore } from '../store';
import logo from '../assets/logo.png';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(username, pin);
      
      if (success) {
        // Redirigir a selección de terminal en lugar de dashboard
        navigate('/select-terminal');
      } else {
        setError('Usuario o PIN incorrecto');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Usuarios de demo para mostrar
  const demoUsers = [
    { username: 'admin', pin: '1234', role: 'Administrador' },
    { username: 'cajero1', pin: '1111', role: 'Cajero' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Imagen de fondo - Opcional */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ 
          backgroundImage: 'url(/login-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-primary-800/80 to-primary-700/80" />
      
      <div className="max-w-md w-full relative z-10">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          {/* Logo principal - Reemplaza con tu logo */}
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src={logo} 
              alt="Butcher Lilieth" 
              className="w-24 h-24 rounded-2xl shadow-2xl object-cover"
              onError={(e) => {
                // Fallback si no hay imagen
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-24 h-24 bg-accent-500 rounded-2xl hidden items-center justify-center shadow-2xl">
              <span className="text-5xl font-bold text-primary-900">BL</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Butcher Lilieth</h1>
          <p className="text-xl text-white font-medium drop-shadow-md">Carnes Premium</p>
          <p className="text-primary-200 text-lg drop-shadow-md">Sistema Punto de Venta</p>
        </div>
        
        {/* Formulario de Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Iniciar Sesión
          </h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuario"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                maxLength={4}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Ingresar
            </Button>
          </form>
        </div>
        
        {/* Usuarios Demo */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-white font-semibold mb-3 text-center">
            Usuarios de Demostración
          </h3>
          <div className="space-y-2">
            {demoUsers.map((user) => (
              <button
                key={user.username}
                onClick={() => {
                  setUsername(user.username);
                  setPin(user.pin);
                }}
                className="w-full bg-white/20 hover:bg-white/30 text-white rounded-lg px-4 py-2 text-sm transition-all text-left"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{user.role}</span>
                  <span className="text-xs opacity-75">
                    {user.username} / {user.pin}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <p className="text-center text-primary-200 text-sm mt-6">
          © 2026 Butcher Lilieth - Sistema POS
        </p>
      </div>
    </div>
  );
};
