/**
 * Utilidad para parsear códigos de barras de balanza TM-F
 * 
 * Formato: F WWWWWW NNNNN EEEEE C (18 dígitos)
 * - F: Flag digit (0 para balanza)
 * - W: Código de producto (6 dígitos)
 * - N: Peso en gramos (5 dígitos)
 * - E: Precio total en centavos (5 dígitos)
 * - C: Checksum (1 dígito)
 */

export interface ScaleBarcodeData {
  isScaleBarcode: boolean;
  productCode: string;      // 6 dígitos del segmento W
  weightKg: number;          // Peso en kilogramos
  totalPrice: number;        // Precio total en Bs
  rawBarcode: string;        // Código completo de 18 dígitos
}

/**
 * Detecta si un código de barras es de balanza TM-F
 */
export function isScaleBarcode(barcode: string): boolean {
  return (
    barcode.length === 18 &&
    barcode[0] === '0' &&
    /^\d{18}$/.test(barcode)
  );
}

/**
 * Parsea un código de barras de balanza TM-F
 * @param barcode Código completo de 18 dígitos
 * @returns Datos parseados o null si no es válido
 */
export function parseScaleBarcode(barcode: string): ScaleBarcodeData | null {
  if (!isScaleBarcode(barcode)) {
    return null;
  }

  // Extraer segmentos
  // F (posición 0): Flag digit
  const productCode = barcode.slice(1, 7);   // WWWWWW (posiciones 1-6)
  const weightGrams = barcode.slice(7, 12);  // NNNNN (posiciones 7-11)
  const priceTotal = barcode.slice(12, 17);  // EEEEE (posiciones 12-16)
  // C (posición 17): Checksum (ignorado)

  // Convertir a valores numéricos
  const weightKg = parseInt(weightGrams, 10) / 1000; // Gramos a kilogramos
  const totalPrice = parseInt(priceTotal, 10); // Ya viene en Bolivianos (no centavos)

  return {
    isScaleBarcode: true,
    productCode,
    weightKg,
    totalPrice,
    rawBarcode: barcode,
  };
}

/**
 * Formatea el peso para mostrar (máximo 3 decimales, sin ceros innecesarios)
 */
export function formatWeight(kg: number): string {
  return kg.toFixed(3).replace(/\.?0+$/, '');
}

/**
 * Calcula el precio por kilo desde el total y el peso
 */
export function calculatePricePerKg(totalPrice: number, weightKg: number): number {
  if (weightKg === 0) return 0;
  return totalPrice / weightKg;
}
