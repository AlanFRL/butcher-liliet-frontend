import { useState, useEffect, useRef } from 'react';
import { Search, Building2, User, UserPlus } from 'lucide-react';
import { customersApi, type CustomerResponse } from '../services/api';

interface CustomerSelectorProps {
  value?: CustomerResponse | null;
  onChange: (customer: CustomerResponse | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function CustomerSelector({
  value,
  onChange,
  placeholder = 'Buscar cliente por nombre, empresa o teléfono...',
  className = '',
  required = false,
}: CustomerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [quickFormData, setQuickFormData] = useState({
    name: '',
    company: '',
    phone: '',
  });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      loadCustomers();
    } else if (searchQuery.length === 0 && isOpen) {
      // Si está abierto y no hay búsqueda, mostrar todos
      loadCustomers();
    } else {
      setCustomers([]);
    }
  }, [searchQuery, isOpen]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customersApi.getAll(searchQuery);
      setCustomers(data);
      setIsOpen(true);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCreatingCustomer) return; // Prevenir doble click
    
    if (!quickFormData.name.trim() && !quickFormData.company.trim()) {
      alert('Debe proporcionar al menos un nombre o empresa');
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const newCustomer = await customersApi.create(quickFormData);
      onChange(newCustomer);
      setShowQuickCreateModal(false);
      setQuickFormData({ name: '', company: '', phone: '' });
      setSearchQuery('');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error creating customer:', error);
      alert(error.message || 'Error al crear cliente');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleSelect = (customer: CustomerResponse) => {
    onChange(customer);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
  };

  const getDisplayName = (customer: CustomerResponse) => {
    if (customer.company && customer.name) {
      return `${customer.company} (${customer.name})`;
    }
    return customer.company || customer.name || 'Sin nombre';
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Selected Customer Display */}
      {value ? (
        <div className="flex items-center justify-between p-3 border-2 border-green-500 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {value.company ? (
              <Building2 size={18} className="text-green-600 flex-shrink-0" />
            ) : (
              <User size={18} className="text-green-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{getDisplayName(value)}</p>
              {value.phone && (
                <p className="text-xs text-gray-600">{value.phone}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 text-red-600 hover:text-red-700 text-sm font-medium flex-shrink-0"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              size={18} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setIsOpen(true);
                if (searchQuery.length === 0) {
                  loadCustomers();
                }
              }}
              placeholder={placeholder}
              required={required}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {required && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                *
              </span>
            )}
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-600">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm">Buscando...</p>
                </div>
              ) : (
                <>
                  {/* Quick Create Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickCreateModal(true);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium flex items-center justify-center gap-2 border-b border-gray-200"
                  >
                    <UserPlus size={18} />
                    <span>Crear Nuevo Cliente</span>
                  </button>
                  
                  {customers.length === 0 ? (
                    <div className="p-4 text-center text-gray-600">
                      <p className="text-sm">No se encontraron clientes</p>
                      <p className="text-xs mt-1">
                        {searchQuery.length < 2 
                          ? 'Escriba al menos 2 caracteres para buscar'
                          : 'Puede crear uno nuevo usando el botón de arriba'
                        }
                      </p>
                    </div>
                  ) : (
                    <ul className="py-1">
                      {customers.map((customer) => (
                        <li key={customer.id}>
                          <button
                            type="button"
                            onClick={() => handleSelect(customer)}
                            className="w-full px-4 py-2 hover:bg-gray-100 text-left flex items-center gap-2"
                          >
                            {customer.company ? (
                              <Building2 size={16} className="text-blue-600 flex-shrink-0" />
                            ) : (
                              <User size={16} className="text-green-600 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {getDisplayName(customer)}
                              </p>
                              {customer.phone && (
                                <p className="text-xs text-gray-600">{customer.phone}</p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Validation message */}
      {required && !value && (
        <p className="text-xs text-gray-500 mt-1">
          * Campo requerido - busque y seleccione un cliente
        </p>
      )}

      {/* Quick Create Modal */}
      {showQuickCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Crear Cliente Rápido</h3>
              
              <form onSubmit={handleQuickCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Persona
                  </label>
                  <input
                    type="text"
                    value={quickFormData.name}
                    onChange={(e) => setQuickFormData({ ...quickFormData, name: e.target.value })}
                    placeholder="Juan Pérez"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={quickFormData.company}
                    onChange={(e) => setQuickFormData({ ...quickFormData, company: e.target.value })}
                    placeholder="Restaurante El Buen Sabor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    * Debe completar al menos Nombre o Empresa
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={quickFormData.phone}
                    onChange={(e) => setQuickFormData({ ...quickFormData, phone: e.target.value })}
                    placeholder="+591 77123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickCreateModal(false);
                      setQuickFormData({ name: '', company: '', phone: '' });
                    }}
                    disabled={isCreatingCustomer}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCustomer}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingCustomer ? 'Creando...' : 'Crear Cliente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
