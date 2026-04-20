// Formato de moneda boliviana
export const formatCurrency = (amount: number): string => {
  return `Bs ${Math.round(amount)}`;
};

// Para input fields
export const CURRENCY_SYMBOL = 'Bs';

