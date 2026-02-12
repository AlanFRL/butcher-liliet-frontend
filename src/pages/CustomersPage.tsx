import { useState, useEffect } from 'react';
import { Plus, Search, Building2, User, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import { customersApi, type CustomerResponse } from '../services/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (search?: string) => {
    try {
      setIsLoading(true);
      const data = await customersApi.getAll(search);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadCustomers(query);
  };

  const handleOpenModal = (customer?: CustomerResponse) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        company: customer.company || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        company: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validate: at least name or company must be provided
    if (!formData.name.trim() && !formData.company.trim()) {
      alert('Debe proporcionar al menos un nombre o empresa');
      return;
    }

    // Validate email format only if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('El formato del email no es válido');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Prepare data: remove empty email to avoid backend validation error
      const dataToSend = { ...formData };
      if (!dataToSend.email.trim()) {
        delete (dataToSend as any).email;
      }

      if (editingCustomer) {
        // Update
        await customersApi.update(editingCustomer.id, dataToSend);
      } else {
        // Create
        await customersApi.create(dataToSend);
      }
      
      handleCloseModal();
      loadCustomers(searchQuery);
    } catch (error: any) {
      console.error('Error saving customer:', error);
      alert(error.message || 'Error al guardar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (customer: CustomerResponse) => {
    if (deletingCustomerId) return;
    
    const displayName = customer.company || customer.name || 'este cliente';
    if (!confirm(`¿Está seguro que desea eliminar a ${displayName}?`)) {
      return;
    }

    setDeletingCustomerId(customer.id);
    try {
      await customersApi.delete(customer.id);
      loadCustomers(searchQuery);
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      alert(error.message || 'Error al eliminar cliente. Puede que tenga pedidos o ventas asociadas.');
    } finally {
      setDeletingCustomerId(null);
    }
  };

  const getDisplayName = (customer: CustomerResponse) => {
    if (customer.company && customer.name) {
      return `${customer.company} (${customer.name})`;
    }
    return customer.company || customer.name || 'Sin nombre';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por nombre, empresa, teléfono o email..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Customers List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando clientes...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <User size={48} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">
            {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <div 
              key={customer.id} 
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Header with actions */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  {customer.company ? (
                    <Building2 size={20} className="text-blue-600" />
                  ) : (
                    <User size={20} className="text-green-600" />
                  )}
                  <span className="line-clamp-1">{getDisplayName(customer)}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(customer)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(customer)}
                    disabled={deletingCustomerId === customer.id}
                    className={`p-1 text-red-600 hover:bg-red-50 rounded ${deletingCustomerId === customer.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-2 text-sm">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} />
                    <span className="line-clamp-2">{customer.address}</span>
                  </div>
                )}
                {customer.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-gray-500 text-xs line-clamp-2">
                    {customer.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Persona
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Juan Pérez"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Restaurante El Buen Sabor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    * Debe completar al menos Nombre o Empresa
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+591 77123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Av. Principal #123, Zona Sur"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas adicionales sobre el cliente..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (editingCustomer ? 'Guardando...' : 'Creando...') : (editingCustomer ? 'Guardar Cambios' : 'Crear Cliente')}
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
