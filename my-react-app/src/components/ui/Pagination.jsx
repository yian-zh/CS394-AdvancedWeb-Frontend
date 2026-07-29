import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function getPageRange(current, last) {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < last - 2) {
    pages.push('...');
  }

  pages.push(last);

  return pages;
}

export default function Pagination({ currentPage, lastPage, total, perPage, onChange, label = 'entries' }) {
  const pages = useMemo(() => getPageRange(currentPage, lastPage), [currentPage, lastPage]);

  if (lastPage <= 0) return null;

  const from = total ? ((currentPage - 1) * perPage) + 1 : 0;
  const to = total ? Math.min(currentPage * perPage, total) : 0;

  return (
    <div className="pagination-footer">
      <span className="pagination-info">
        {total
          ? `Showing ${from.toLocaleString()} to ${to.toLocaleString()} of ${total.toLocaleString()} ${label}`
          : `Page ${currentPage}`}
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => onChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="pagination-btn" style={{ cursor: 'default', border: 'none', opacity: 0.5 }}>
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={`pagination-btn ${currentPage === page ? 'is-active' : ''}`}
              onClick={() => onChange(page)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage === lastPage}
          onClick={() => onChange(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
