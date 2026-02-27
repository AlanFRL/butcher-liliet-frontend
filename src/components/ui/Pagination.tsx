/**
 * Componente de paginación reutilizable
 * 
 * Features:
 * - Navegación entre páginas (primera, anterior, siguiente, última)
 * - Selector de tamaño de página (items por página)
 * - Indicador de rango de items visibles
 * - Números de página con truncamiento inteligente
 * - Diseño responsive y accesible
 */

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Button from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  // Calcular rango de items visibles
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generar array de números de página con truncamiento
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      // Mostrar todas las páginas si son 7 o menos
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    
    // Siempre mostrar primera página
    pages.push(1);

    if (currentPage <= 3) {
      // Cerca del inicio
      pages.push(2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Cerca del final
      pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      // En el medio
      pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Información de items y selector de tamaño */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          Mostrando <span className="font-semibold text-gray-900">{startItem}</span> a{' '}
          <span className="font-semibold text-gray-900">{endItem}</span> de{' '}
          <span className="font-semibold text-gray-900">{totalItems}</span> registros
        </span>

        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-600">
            Mostrar:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center gap-2">
        {/* Primera página */}
        <Button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          title="Primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Página anterior */}
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 text-gray-400">...</span>
              ) : (
                <Button
                  onClick={() => typeof page === 'number' && onPageChange(page)}
                  variant={page === currentPage ? 'primary' : 'outline'}
                  size="sm"
                  className="min-w-[2.5rem]"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Página siguiente */}
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          title="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Última página */}
        <Button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
