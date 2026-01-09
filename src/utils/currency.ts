// Formato de moneda boliviana
export const formatCurrency = (amount: number): string => {
  return `Bs ${amount.toFixed(2)}`;
};

// Para input fields
export const CURRENCY_SYMBOL = 'Bs';
