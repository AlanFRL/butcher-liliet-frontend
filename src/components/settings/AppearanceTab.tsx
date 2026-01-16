import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { applyColorScheme } from '../../hooks/useColorScheme';

type ColorScheme = 'default' | 'blue' | 'green' | 'purple' | 'orange';

const colorSchemes = {
  default: {
    name: 'Rojo Tradicional',
    description: 'Colores clásicos de carnicería',
    primary: { 50: '254 242 242', 100: '254 226 226', 200: '254 202 202', 300: '252 165 165', 400: '248 113 113', 500: '239 68 68', 600: '220 38 38', 700: '185 28 28', 800: '153 27 27', 900: '127 29 29', 950: '69 10 10' },
    accent: { 50: '254 252 232', 100: '254 249 195', 200: '254 240 138', 300: '253 224 71', 400: '250 204 21', 500: '234 179 8', 600: '202 138 4', 700: '161 98 7', 800: '133 77 14', 900: '113 63 18' }
  },
  blue: {
    name: 'Azul Profesional',
    description: 'Moderno y corporativo',
    primary: { 50: '239 246 255', 100: '219 234 254', 200: '191 219 254', 300: '147 197 253', 400: '96 165 250', 500: '59 130 246', 600: '37 99 235', 700: '30 64 175', 800: '30 58 138', 900: '23 37 84', 950: '15 23 42' },
    accent: { 50: '240 253 250', 100: '204 251 241', 200: '153 246 228', 300: '94 234 212', 400: '45 212 191', 500: '20 184 166', 600: '13 148 136', 700: '15 118 110', 800: '17 94 89', 900: '19 78 74' }
  },
  green: {
    name: 'Verde Natural',
    description: 'Fresco y orgánico',
    primary: { 50: '240 253 244', 100: '220 252 231', 200: '187 247 208', 300: '134 239 172', 400: '74 222 128', 500: '34 197 94', 600: '22 163 74', 700: '21 128 61', 800: '22 101 52', 900: '20 83 45', 950: '5 46 22' },
    accent: { 50: '254 252 232', 100: '254 249 195', 200: '254 240 138', 300: '253 224 71', 400: '250 204 21', 500: '234 179 8', 600: '202 138 4', 700: '161 98 7', 800: '133 77 14', 900: '113 63 18' }
  },
  purple: {
    name: 'Púrpura Premium',
    description: 'Elegante y sofisticado',
    primary: { 50: '250 245 255', 100: '243 232 255', 200: '233 213 255', 300: '216 180 254', 400: '192 132 252', 500: '168 85 247', 600: '147 51 234', 700: '126 34 206', 800: '107 33 168', 900: '88 28 135', 950: '59 7 100' },
    accent: { 50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175', 400: '251 113 133', 500: '244 63 94', 600: '225 29 72', 700: '190 18 60', 800: '159 18 57', 900: '136 19 55' }
  },
  orange: {
    name: 'Naranja Energético',
    description: 'Vibrante y cálido',
    primary: { 50: '255 247 237', 100: '255 237 213', 200: '254 215 170', 300: '253 186 116', 400: '251 146 60', 500: '249 115 22', 600: '234 88 12', 700: '194 65 12', 800: '154 52 18', 900: '124 45 18', 950: '67 20 7' },
    accent: { 50: '254 252 232', 100: '254 249 195', 200: '254 240 138', 300: '253 224 71', 400: '250 204 21', 500: '234 179 8', 600: '202 138 4', 700: '161 98 7', 800: '133 77 14', 900: '113 63 18' }
  }
};

export const AppearanceTab: React.FC = () => {
  const [selectedScheme, setSelectedScheme] = useState<ColorScheme>('default');

  useEffect(() => {
    const savedScheme = (localStorage.getItem('colorScheme') as ColorScheme) || 'default';
    setSelectedScheme(savedScheme);
  }, []);

  const handleSchemeChange = (scheme: ColorScheme) => {
    setSelectedScheme(scheme);
    applyColorScheme(scheme);
    localStorage.setItem('colorScheme', scheme);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Esquema de Colores</h2>
      <p className="text-gray-600 mb-6">Selecciona el esquema de colores que más te guste</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(colorSchemes).map(([key, scheme]) => (
          <button
            key={key}
            onClick={() => handleSchemeChange(key as ColorScheme)}
            className={`relative p-6 rounded-lg border-2 transition-all text-left ${
              selectedScheme === key ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow'
            }`}
          >
            {selectedScheme === key && (
              <div className="absolute top-3 right-3">
                <CheckCircle className="w-6 h-6 text-blue-500" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: `rgb(${scheme.primary[600]})` }} />
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: `rgb(${scheme.accent[500]})` }} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{scheme.name}</h3>
            <p className="text-sm text-gray-600">{scheme.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
