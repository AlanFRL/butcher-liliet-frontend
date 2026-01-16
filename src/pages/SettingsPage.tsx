import React, { useState } from 'react';
import { Palette, Users, Monitor, Tag } from 'lucide-react';
import { useAuthStore } from '../store';
import { AppearanceTab } from '../components/settings/AppearanceTab';
import { UsersTab } from '../components/settings/UsersTab';
import { TerminalsTab } from '../components/settings/TerminalsTab';
import { CategoriesTab } from '../components/settings/CategoriesTab';

type SettingsTab = 'appearance' | 'users' | 'terminals' | 'categories';

export const SettingsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  const tabs = [
    { id: 'appearance' as SettingsTab, name: 'Apariencia', icon: Palette, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'users' as SettingsTab, name: 'Usuarios', icon: Users, roles: ['ADMIN'] },
    { id: 'terminals' as SettingsTab, name: 'Terminales', icon: Monitor, roles: ['ADMIN'] },
    { id: 'categories' as SettingsTab, name: 'Categorías', icon: Tag, roles: ['ADMIN'] },
  ];

  const visibleTabs = tabs.filter(tab => tab.roles.includes(currentUser?.role || ''));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-600 mt-1">Personaliza la apariencia y administra los recursos del sistema</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'users' && currentUser?.role === 'ADMIN' && <UsersTab />}
        {activeTab === 'terminals' && currentUser?.role === 'ADMIN' && <TerminalsTab />}
        {activeTab === 'categories' && currentUser?.role === 'ADMIN' && <CategoriesTab />}
      </div>
    </div>
  );
};
