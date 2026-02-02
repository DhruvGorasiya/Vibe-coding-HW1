/**
 * React Sortable/Filterable Data Table v3 (Final)
 *
 * A production-ready, fully typed React data table component with:
 * - Sortable columns (click to toggle asc/desc/none)
 * - Text filter (case-insensitive, searches all fields)
 * - Pagination (configurable page sizes)
 * - Full TypeScript support with generics
 * - Accessibility attributes (ARIA labels, keyboard navigation)
 * - Custom cell renderers
 *
 * Changes from v2:
 * - Added loading state support
 * - Added onRowClick callback
 * - Improved keyboard accessibility
 * - Added column width configuration
 * - Better empty state handling
 */

import React, { useState, useMemo, useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

type SortDirection = "asc" | "desc" | null;

interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

interface DataTableColumn<T> {
  /** The key of the data field to display */
  key: keyof T;
  /** The header text to display */
  header: string;
  /** Whether this column is sortable (default: true) */
  sortable?: boolean;
  /** Custom render function for cell content */
  render?: (value: T[keyof T], row: T, index: number) => React.ReactNode;
  /** Column width (e.g., "150px", "20%") */
  width?: string;
  /** Text alignment */
  align?: "left" | "center" | "right";
}

interface DataTableProps<T extends object> {
  /** Array of data objects to display */
  data: T[];
  /** Column configuration */
  columns: DataTableColumn<T>[];
  /** Key field to use for React keys (must be unique per row) */
  rowKey: keyof T;
  /** Default number of rows per page */
  defaultPageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Class name for the container */
  className?: string;
  /** Loading state */
  loading?: boolean;
  /** Callback when a row is clicked */
  onRowClick?: (row: T, index: number) => void;
  /** Empty state message */
  emptyMessage?: string;
  /** No results message (when filtering) */
  noResultsMessage?: string;
}

// =============================================================================
// DATA TABLE COMPONENT
// =============================================================================

function DataTable<T extends object>({
  data,
  columns,
  rowKey,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  className = "",
  loading = false,
  onRowClick,
  emptyMessage = "No data available",
  noResultsMessage = "No matching results",
}: DataTableProps<T>): React.ReactElement {
  // State
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: null,
    direction: null,
  });
  const [filterText, setFilterText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Filter data
  const filteredData = useMemo(() => {
    if (!filterText.trim()) return data;

    const searchTerm = filterText.toLowerCase().trim();
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm);
      })
    );
  }, [data, columns, filterText]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData;

    const key = sortConfig.key;
    return [...filteredData].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortConfig.direction === "desc" ? -comparison : comparison;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedData.length);

  const paginatedData = useMemo(() => {
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, startIndex, endIndex]);

  // Handlers
  const handleSort = useCallback((key: keyof T) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setFilterText(value);
    setCurrentPage(1);
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  // Sort indicators and aria
  const getSortIndicator = (key: keyof T): string => {
    if (sortConfig.key !== key) return "⇅";
    if (sortConfig.direction === "asc") return "↑";
    return "↓";
  };

  const getAriaSort = (
    key: keyof T
  ): "ascending" | "descending" | "none" | undefined => {
    if (sortConfig.key !== key) return "none";
    return sortConfig.direction === "asc" ? "ascending" : "descending";
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className={`w-full font-sans ${className}`}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search all columns..."
            value={filterText}
            onChange={(e) => handleFilterChange(e.target.value)}
            aria-label="Filter table data"
            className="w-full px-4 py-2.5 pl-10 text-sm border border-slate-300 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       bg-white shadow-sm transition-shadow hover:shadow"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {filterText && (
            <button
              onClick={() => handleFilterChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear filter"
            >
              ✕
            </button>
          )}
        </div>

        {/* Page Size */}
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-slate-600">
            Show
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-600">entries</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
        <table className="w-full border-collapse" role="grid">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  onKeyDown={(e) => {
                    if (
                      col.sortable !== false &&
                      (e.key === "Enter" || e.key === " ")
                    ) {
                      e.preventDefault();
                      handleSort(col.key);
                    }
                  }}
                  tabIndex={col.sortable !== false ? 0 : undefined}
                  role={
                    col.sortable !== false
                      ? "columnheader button"
                      : "columnheader"
                  }
                  aria-sort={
                    col.sortable !== false ? getAriaSort(col.key) : undefined
                  }
                  className={`px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider
                             border-b border-slate-200 ${
                               col.sortable !== false
                                 ? "cursor-pointer hover:bg-slate-100 select-none transition-colors"
                                 : ""
                             } ${col.align === "center" ? "text-center" : ""} 
                             ${col.align === "right" ? "text-right" : ""}`}
                >
                  <div
                    className={`flex items-center gap-2 ${
                      col.align === "right" ? "justify-end" : ""
                    } ${col.align === "center" ? "justify-center" : ""}`}
                  >
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span
                        className={`transition-colors ${
                          sortConfig.key === col.key
                            ? "text-indigo-600"
                            : "text-slate-300"
                        }`}
                      >
                        {getSortIndicator(col.key)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-sm text-slate-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-medium text-slate-700">
                        {filterText ? noResultsMessage : emptyMessage}
                      </p>
                      {filterText && (
                        <button
                          onClick={() => handleFilterChange("")}
                          className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const actualIndex = startIndex + rowIndex;
                return (
                  <tr
                    key={String(row[rowKey])}
                    onClick={() => onRowClick?.(row, actualIndex)}
                    className={`transition-colors ${
                      onRowClick
                        ? "cursor-pointer hover:bg-indigo-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={`px-5 py-4 text-sm text-slate-700 ${
                          col.align === "center" ? "text-center" : ""
                        } ${col.align === "right" ? "text-right" : ""}`}
                      >
                        {col.render
                          ? col.render(row[col.key], row, actualIndex)
                          : String(row[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
        <p className="text-sm text-slate-600">
          {sortedData.length === 0 ? (
            "0 entries"
          ) : (
            <>
              Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
              <span className="font-medium">{endIndex}</span> of{" "}
              <span className="font-medium">{sortedData.length}</span> entries
              {filterText && data.length !== sortedData.length && (
                <span className="text-slate-400">
                  {" "}
                  (filtered from {data.length})
                </span>
              )}
            </>
          )}
        </p>

        <nav className="flex items-center gap-1" aria-label="Table pagination">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            aria-label="First page"
            className="p-2 text-sm text-slate-600 border border-slate-300 rounded-lg 
                       hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed 
                       transition-colors"
          >
            ⟪
          </button>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="p-2 text-sm text-slate-600 border border-slate-300 rounded-lg 
                       hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed 
                       transition-colors"
          >
            ⟨
          </button>

          {/* Page numbers */}
          {(() => {
            const pages: (number | string)[] = [];
            const showPages = 5;
            let start = Math.max(1, currentPage - Math.floor(showPages / 2));
            let end = Math.min(totalPages, start + showPages - 1);

            if (end - start + 1 < showPages) {
              start = Math.max(1, end - showPages + 1);
            }

            if (start > 1) {
              pages.push(1);
              if (start > 2) pages.push("...");
            }

            for (let i = start; i <= end; i++) {
              pages.push(i);
            }

            if (end < totalPages) {
              if (end < totalPages - 1) pages.push("...");
              pages.push(totalPages);
            }

            return pages.map((page, idx) =>
              typeof page === "string" ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                  {page}
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                  className={`min-w-[40px] p-2 text-sm border rounded-lg transition-colors ${
                    currentPage === page
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "text-slate-600 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {page}
                </button>
              )
            );
          })()}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || sortedData.length === 0}
            aria-label="Next page"
            className="p-2 text-sm text-slate-600 border border-slate-300 rounded-lg 
                       hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed 
                       transition-colors"
          >
            ⟩
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages || sortedData.length === 0}
            aria-label="Last page"
            className="p-2 text-sm text-slate-600 border border-slate-300 rounded-lg 
                       hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed 
                       transition-colors"
          >
            ⟫
          </button>
        </nav>
      </div>
    </div>
  );
}

// =============================================================================
// DEMO APPLICATION
// =============================================================================

interface Employee {
  id: number;
  name: string;
  email: string;
  age: number;
  department: string;
  salary: number;
  status: "active" | "inactive" | "pending";
  joinDate: string;
}

const generateSampleData = (): Employee[] => {
  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "Design",
    "HR",
    "Finance",
  ];
  const statuses: Employee["status"][] = ["active", "inactive", "pending"];
  const firstNames = [
    "Alice",
    "Bob",
    "Carol",
    "David",
    "Eva",
    "Frank",
    "Grace",
    "Henry",
    "Ivy",
    "Jack",
    "Karen",
    "Leo",
    "Mia",
    "Nathan",
    "Olivia",
    "Peter",
    "Quinn",
    "Rachel",
    "Sam",
    "Tina",
    "Uma",
    "Victor",
    "Wendy",
    "Xavier",
    "Yuki",
    "Zara",
  ];
  const lastNames = [
    "Johnson",
    "Smith",
    "Williams",
    "Brown",
    "Martinez",
    "Lee",
    "Kim",
    "Chen",
    "Wilson",
    "Taylor",
    "Davis",
    "Garcia",
    "Anderson",
    "Moore",
    "White",
    "Harris",
    "Roberts",
    "Clark",
    "Turner",
    "Baker",
  ];

  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `${firstNames[i % firstNames.length]} ${
      lastNames[i % lastNames.length]
    }`,
    email: `${firstNames[i % firstNames.length].toLowerCase()}${i}@company.com`,
    age: 22 + (i % 30),
    department: departments[i % departments.length],
    salary: 50000 + Math.floor(Math.random() * 80000),
    status: statuses[i % statuses.length],
    joinDate: `202${i % 5}-${String((i % 12) + 1).padStart(2, "0")}-${String(
      (i % 28) + 1
    ).padStart(2, "0")}`,
  }));
};

const sampleData = generateSampleData();

const columns: DataTableColumn<Employee>[] = [
  { key: "id", header: "ID", width: "70px", align: "center" },
  { key: "name", header: "Name", width: "180px" },
  { key: "email", header: "Email" },
  { key: "age", header: "Age", width: "80px", align: "center" },
  { key: "department", header: "Department", width: "130px" },
  {
    key: "salary",
    header: "Salary",
    width: "120px",
    align: "right",
    render: (value) => (
      <span className="font-mono">${(value as number).toLocaleString()}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "100px",
    align: "center",
    render: (value) => {
      const colors = {
        active: "bg-emerald-100 text-emerald-700",
        inactive: "bg-slate-100 text-slate-600",
        pending: "bg-amber-100 text-amber-700",
      };
      return (
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            colors[value as keyof typeof colors]
          }`}
        >
          {(value as string).charAt(0).toUpperCase() +
            (value as string).slice(1)}
        </span>
      );
    },
  },
  {
    key: "joinDate",
    header: "Join Date",
    width: "120px",
    render: (value) => new Date(value as string).toLocaleDateString(),
  },
];

export default function App(): React.ReactElement {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Employee Directory
          </h1>
          <p className="mt-2 text-slate-600">
            Click column headers to sort • Use search to filter • Click rows to
            select
          </p>
        </div>

        {/* Selected Employee Card */}
        {selectedEmployee && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-sm text-indigo-600 font-medium">
                Selected:
              </span>
              <span className="ml-2 text-slate-800 font-semibold">
                {selectedEmployee.name}
              </span>
              <span className="ml-2 text-slate-500">
                ({selectedEmployee.email})
              </span>
            </div>
            <button
              onClick={() => setSelectedEmployee(null)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <DataTable
            data={sampleData}
            columns={columns}
            rowKey="id"
            defaultPageSize={10}
            pageSizeOptions={[5, 10, 25, 50]}
            onRowClick={(row) => setSelectedEmployee(row)}
          />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-400">
          DataTable v3 • {sampleData.length} total employees
        </p>
      </div>
    </div>
  );
}

export { DataTable };
export type { DataTableColumn, DataTableProps };
