import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const { t } = useTranslation('common');

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show (fewer on mobile via CSS)
  const getPageNumbers = (max) => {
    const pages = [];

    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = Math.min(totalPages, start + max - 1);

    if (end - start + 1 < max) {
      start = Math.max(1, end - max + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers(5);
  const mobilePageNumbers = getPageNumbers(3);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      {/* Item count */}
      <p className="text-sm text-gray-600 order-2 sm:order-1">
        {t('pagination.showing')} <span className="font-medium">{startItem}</span> {t('pagination.to')}{' '}
        <span className="font-medium">{endItem}</span> {t('pagination.of')}{' '}
        <span className="font-medium">{totalItems}</span> {t('pagination.results')}
      </p>

      {/* Pagination controls */}
      <nav className="flex items-center gap-1 sm:gap-1 order-1 sm:order-2">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2.5 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
          aria-label={t('pagination.previous')}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Mobile page numbers (3 pages) */}
        <div className="flex items-center gap-1 sm:hidden">
          {mobilePageNumbers[0] > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="min-w-10 min-h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-sm font-medium touch-manipulation"
              >
                1
              </button>
              {mobilePageNumbers[0] > 2 && (
                <span className="px-1 text-gray-400">...</span>
              )}
            </>
          )}
          {mobilePageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-10 min-h-10 flex items-center justify-center rounded-lg transition-colors text-sm font-medium touch-manipulation ${
                page === currentPage
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
          {mobilePageNumbers[mobilePageNumbers.length - 1] < totalPages && (
            <>
              {mobilePageNumbers[mobilePageNumbers.length - 1] < totalPages - 1 && (
                <span className="px-1 text-gray-400">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="min-w-10 min-h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-sm font-medium touch-manipulation"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Desktop page numbers (5 pages) */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers[0] > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium touch-manipulation"
              >
                1
              </button>
              {pageNumbers[0] > 2 && (
                <span className="px-2 text-gray-400">...</span>
              )}
            </>
          )}
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 rounded-lg transition-colors text-sm font-medium touch-manipulation ${
                page === currentPage
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="px-2 text-gray-400">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium touch-manipulation"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2.5 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
          aria-label={t('pagination.next')}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
