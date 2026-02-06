/**
 * Utilidades para manejo de fechas con zona horaria de Bolivia (UTC-4 / America/La_Paz)
 */

/**
 * Obtiene la fecha actual en hora de Bolivia
 */
export const getNowBolivia = (): Date => {
  return new Date();
};

/**
 * Formatea una fecha en formato ISO pero ajustada a Bolivia
 * Ejemplo: "2024-01-15" para usar en input type="date"
 */
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convierte un string de input date a Date de Bolivia al inicio del día
 * Ejemplo: "2024-01-15" → Date para 2024-01-15 00:00:00 en Bolivia
 */
export const parseInputDate = (dateString: string): Date => {
  // Crear fecha en hora local del navegador
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Convierte un string de input date a Date de Bolivia al final del día
 * Ejemplo: "2024-01-15" → Date para 2024-01-15 23:59:59 en Bolivia
 */
export const parseInputDateEndOfDay = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
};

/**
 * Convierte un string de fecha del input a ISO string para enviar al backend
 * Ajusta para inicio del día en Bolivia
 * Ejemplo: "2024-01-15" → "2024-01-15T00:00:00-04:00"
 */
export const formatDateForBackend = (dateString: string, endOfDay: boolean = false): string => {
  const date = endOfDay ? parseInputDateEndOfDay(dateString) : parseInputDate(dateString);
  
  // Crear string ISO manualmente con offset de Bolivia (-04:00)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-04:00`;
};

/**
 * Formatea una fecha para mostrar en formato legible boliviano
 * NOTA: NO usa timeZone porque las fechas del backend ya vienen en UTC
 * y el navegador las convierte automáticamente a la hora local
 * Ejemplo: "15 de enero de 2024"
 */
export const formatDateBolivia = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return date.toLocaleDateString('es-BO', { ...defaultOptions, ...options });
};

/**
 * Formatea hora para mostrar en formato boliviano
 * NOTA: NO usa timeZone porque las fechas del backend ya vienen en UTC
 * y el navegador las convierte automáticamente a la hora local
 * Ejemplo: "14:30"
 */
export const formatTimeBolivia = (date: Date): string => {
  return date.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formatea fecha y hora completa
 * Ejemplo: "15 de enero de 2024, 14:30"
 */
export const formatDateTimeBolivia = (date: Date): string => {
  return date.toLocaleString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Valida que dateFrom sea menor o igual a dateTo
 */
export const validateDateRange = (dateFrom: string, dateTo: string): boolean => {
  if (!dateFrom || !dateTo) return true; // No validar si falta alguna fecha
  
  const from = parseInputDate(dateFrom);
  const to = parseInputDate(dateTo);
  
  return from <= to;
};

/**
 * Obtiene el inicio del día actual en Bolivia
 */
export const getStartOfTodayBolivia = (): Date => {
  const now = getNowBolivia();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

/**
 * Obtiene el final del día actual en Bolivia
 */
export const getEndOfTodayBolivia = (): Date => {
  const now = getNowBolivia();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
};

/**
 * Verifica si una fecha es hoy en Bolivia
 */
export const isTodayBolivia = (date: Date): boolean => {
  const now = getNowBolivia();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};
