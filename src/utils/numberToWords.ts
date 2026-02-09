/**
 * Convierte un número a texto en español (Bolivia)
 * Ejemplo: 1435 → "Mil Cuatrocientos Treinta y Cinco"
 */

const unidades = ['', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve'];
const decenas = ['', 'Diez', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa'];
const especiales = ['Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve'];
const centenas = ['', 'Ciento', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos'];

function convertirGrupo(numero: number): string {
  if (numero === 0) return '';
  if (numero === 100) return 'Cien';
  
  const centena = Math.floor(numero / 100);
  const decena = Math.floor((numero % 100) / 10);
  const unidad = numero % 10;
  
  let resultado = '';
  
  // Centenas
  if (centena > 0) {
    resultado += centenas[centena];
  }
  
  // Decenas y unidades
  const resto = numero % 100;
  if (resto >= 10 && resto < 20) {
    // Casos especiales (10-19)
    resultado += (resultado ? ' ' : '') + especiales[resto - 10];
  } else {
    if (decena > 0) {
      resultado += (resultado ? ' ' : '') + decenas[decena];
    }
    if (unidad > 0) {
      if (decena > 0) {
        resultado += ' y ';
      } else if (centena > 0) {
        resultado += ' ';
      }
      resultado += unidades[unidad];
    }
  }
  
  return resultado;
}

export function numberToWords(numero: number): string {
  if (numero === 0) return 'Cero';
  if (numero < 0) return 'Menos ' + numberToWords(-numero);
  
  // Redondear a entero
  numero = Math.round(numero);
  
  const millones = Math.floor(numero / 1000000);
  const miles = Math.floor((numero % 1000000) / 1000);
  const unidades = numero % 1000;
  
  let resultado = '';
  
  // Millones
  if (millones > 0) {
    if (millones === 1) {
      resultado += 'Un Millón';
    } else {
      resultado += convertirGrupo(millones) + ' Millones';
    }
  }
  
  // Miles
  if (miles > 0) {
    if (resultado) resultado += ' ';
    if (miles === 1) {
      resultado += 'Mil';
    } else {
      resultado += convertirGrupo(miles) + ' Mil';
    }
  }
  
  // Unidades
  if (unidades > 0) {
    if (resultado) resultado += ' ';
    resultado += convertirGrupo(unidades);
  }
  
  return resultado;
}

/**
 * Formatea un monto en bolivianos con texto
 * Ejemplo: 1435 → "Mil Cuatrocientos Treinta y Cinco 00/100 Bolivianos"
 */
export function amountToWords(amount: number): string {
  const enteros = Math.floor(amount);
  const decimales = Math.round((amount - enteros) * 100);
  
  let texto = numberToWords(enteros);
  texto += ` ${decimales.toString().padStart(2, '0')}/100 Bolivianos`;
  
  return texto;
}
