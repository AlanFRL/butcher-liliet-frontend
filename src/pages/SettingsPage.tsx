import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { applyColorScheme } from '../hooks/useColorScheme';

type ColorScheme = 'default' | 'blue' | 'green' | 'purple' | 'orange';

const colorSchemes = {
  default: {
    name: 'Rojo Tradicional',
    description: 'Colores clásicos de carnicería',
    primary: {
      50: '254 242 242',
      100: '254 226 226',
      200: '254 202 202',
      300: '252 165 165',
      400: '248 113 113',
      500: '239 68 68',
      600: '220 38 38',
      700: '185 28 28',
      800: '153 27 27',
      900: '127 29 29',
      950: '69 10 10',
    },
    accent: {
      50: '254 252 232',
      100: '254 249 195',
      200: '254 240 138',
      300: '253 224 71',
      400: '250 204 21',
      500: '234 179 8',
      600: '202 138 4',
      700: '161 98 7',
      800: '133 77 14',
      900: '113 63 18',
    },
  },
  blue: {
    name: 'Azul Profesional',
    description: 'Moderno y corporativo',
    primary: {
      50: '239 246 255',
      100: '219 234 254',
      200: '191 219 254',
      300: '147 197 253',
      400: '96 165 250',
      500: '59 130 246',
      600: '37 99 235',
      700: '30 64 175',
      800: '30 58 138',
      900: '23 37 84',
      950: '15 23 42',
    },
    accent: {
      50: '240 249 255',
      100: '224 242 254',
      200: '186 230 253',
      300: '125 211 252',
      400: '56 189 248',
      500: '14 165 233',
      600: '2 132 199',
      700: '3 105 161',
      800: '7 89 133',
      900: '12 74 110',
    },
  },
  green: {
    name: 'Verde Fresco',
    description: 'Natural y orgánico',
    primary: {
      50: '240 253 244',
      100: '220 252 231',
      200: '187 247 208',
      300: '134 239 172',
      400: '74 222 128',
      500: '34 197 94',
      600: '22 163 74',
      700: '21 128 61',
      800: '22 101 52',
      900: '20 83 45',
      950: '5 46 22',
    },
    accent: {
      50: '236 253 245',
      100: '209 250 229',
      200: '167 243 208',
      300: '110 231 183',
      400: '52 211 153',
      500: '16 185 129',
      600: '5 150 105',
      700: '4 120 87',
      800: '6 95 70',
      900: '4 78 56',
    },
  },
  purple: {
    name: 'Púrpura Elegante',
    description: 'Sofisticado y premium',
    primary: {
      50: '250 245 255',
      100: '243 232 255',
      200: '233 213 255',
      300: '216 180 254',
      400: '192 132 252',
      500: '168 85 247',
      600: '147 51 234',
      700: '126 34 206',
      800: '107 33 168',
      900: '88 28 135',
      950: '59 7 100',
    },
    accent: {
      50: '253 244 255',
      100: '250 232 255',
      200: '245 208 254',
      300: '240 171 252',
      400: '232 121 249',
      500: '217 70 239',
      600: '192 38 211',
      700: '162 28 175',
      800: '134 25 143',
      900: '112 26 117',
    },
  },
  orange: {
    name: 'Naranja Energético',
    description: 'Vibrante y cálido',
    primary: {
      50: '255 247 237',
      100: '255 237 213',
      200: '254 215 170',
      300: '253 186 116',
      400: '251 146 60',
      500: '249 115 22',
      600: '234 88 12',
      700: '194 65 12',
      800: '154 52 18',
      900: '124 45 18',
      950: '67 20 7',
    },
    accent: {
      50: '254 252 232',
      100: '254 249 195',
      200: '254 240 138',
      300: '253 224 71',
      400: '250 204 21',
      500: '234 179 8',
      600: '202 138 4',
      700: '161 98 7',
      800: '133 77 14',
      900: '113 63 18',
    },
  },
};

export const SettingsPage: React.FC = () => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    return (localStorage.getItem('colorScheme') as ColorScheme) || 'default';
  });

  useEffect(() => {
    // Guardar en localStorage y aplicar el esquema de colores
    localStorage.setItem('colorScheme', colorScheme);
    applyColorScheme(colorScheme);
  }, [colorScheme]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
        <p className="text-gray-600">Personaliza tu experiencia en el sistema</p>
      </div>

      <div className="space-y-6">
        {/* Paleta de Colores */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Palette className="w-5 h-5 text-gray-700 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Estilo Visual</h2>
          </div>
          <p className="text-gray-600 mb-6">Elige la combinación de colores de tu preferencia</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(colorSchemes) as ColorScheme[]).map((key) => {
              const scheme = colorSchemes[key];
              return (
                <button
                  key={key}
                  onClick={() => setColorScheme(key)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    colorScheme === key
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-1">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: `rgb(${scheme.primary[700]})` }}
                      />
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: `rgb(${scheme.accent[500]})` }}
                      />
                    </div>
                    <div>
                      <p className={`font-medium ${
                        colorScheme === key ? 'text-primary-900' : 'text-gray-700'
                      }`}>
                        {scheme.name}
                      </p>
                      <p className="text-xs text-gray-500">{scheme.description}</p>
                    </div>
                  </div>
                  {colorScheme === key && (
                    <div className="mt-2 text-xs text-primary-600 font-medium">
                      ✓ Seleccionado
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Esta configuración se guarda en tu navegador y es específica para este dispositivo. 
            Los cambios se aplicarán de inmediato en todo el sistema.
          </p>
        </div>
      </div>
    </div>
  );
};
