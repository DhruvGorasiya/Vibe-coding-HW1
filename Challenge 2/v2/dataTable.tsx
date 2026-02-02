/**
 * React Sortable/Filterable Data Table v2
 * Generated from prompt v2
 *
 * Changes from v1:
 * - Fixed generic type constraint (extends object instead of Record)
 * - Added rowKey prop for proper React keys
 * - Added accessibility attributes
 * - Fixed pagination info for empty data
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
  render?: (value: T[keyof T], row: T) => React.ReactNode;
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
}: DataTableProps<T>): React.ReactElement {
  // State
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: null,
    direction: null,
  });
  const [filterText, setFilterText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Filter data - case insensitive search across all columns
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

      // Handle null/undefined
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

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedData.length);

  const paginatedData = useMemo(() => {
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, startIndex, endIndex]);

  // Handlers
  const handleSort = useCallback((key: keyof T) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      // Reset sort
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

  // Sort indicator
  const getSortIndicator = (key: keyof T): string => {
    if (sortConfig.key !== key) return "↕";
    if (sortConfig.direction === "asc") return "↑";
    if (sortConfig.direction === "desc") return "↓";
    return "↕";
  };

  const getSortAriaLabel = (col: DataTableColumn<T>): string => {
    if (col.sortable === false) return "";
    if (sortConfig.key !== col.key) return `Sort by ${col.header}`;
    if (sortConfig.direction === "asc")
      return `Sorted by ${col.header} ascending, click to sort descending`;
    if (sortConfig.direction === "desc")
      return `Sorted by ${col.header} descending, click to remove sort`;
    return `Sort by ${col.header}`;
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className={`w-full ${className}`}>
      {/* Filter and Page Size Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search..."
            value={filterText}
            onChange={(e) => handleFilterChange(e.target.value)}
            aria-label="Filter table data"
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-gray-600">
            Rows per page:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full border-collapse" role="grid">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
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
                  aria-label={getSortAriaLabel(col)}
                  aria-sort={
                    sortConfig.key === col.key
                      ? sortConfig.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={`px-6 py-3 text-left text-sm font-semibold text-gray-700 ${
                    col.sortable !== false
                      ? "cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span
                        className={`text-gray-400 ${
                          sortConfig.key === col.key ? "text-blue-500" : ""
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
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-12 h-12 text-gray-300"
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
                    <span className="text-lg font-medium">
                      {filterText ? "No matching results" : "No data available"}
                    </span>
                    {filterText && (
                      <button
                        onClick={() => handleFilterChange("")}
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={String(row[rowKey])}
                  className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-6 py-4 text-sm text-gray-700"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
        <div className="text-sm text-gray-600">
          {sortedData.length === 0 ? (
            "0 entries"
          ) : (
            <>
              Showing {startIndex + 1} to {endIndex} of {sortedData.length}{" "}
              entries
              {filterText && data.length !== sortedData.length && (
                <span className="text-gray-400">
                  {" "}
                  (filtered from {data.length} total)
                </span>
              )}
            </>
          )}
        </div>
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            aria-label="Go to first page"
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-l-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ««
          </button>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
            className="px-3 py-1.5 text-sm border-t border-b border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>
          <span className="px-4 py-1.5 text-sm border-t border-b border-gray-300 bg-white">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || sortedData.length === 0}
            aria-label="Go to next page"
            className="px-3 py-1.5 text-sm border-t border-b border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages || sortedData.length === 0}
            aria-label="Go to last page"
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-r-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            »»
          </button>
        </nav>
      </div>
    </div>
  );
}

// =============================================================================
// DEMO / EXAMPLE USAGE
// =============================================================================

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  department: string;
  salary: number;
  status: "active" | "inactive";
}

const sampleData: User[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    age: 28,
    department: "Engineering",
    salary: 95000,
    status: "active",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    age: 34,
    department: "Marketing",
    salary: 75000,
    status: "active",
  },
  {
    id: 3,
    name: "Carol Williams",
    email: "carol@example.com",
    age: 29,
    department: "Engineering",
    salary: 92000,
    status: "inactive",
  },
  {
    id: 4,
    name: "David Brown",
    email: "david@example.com",
    age: 41,
    department: "Sales",
    salary: 85000,
    status: "active",
  },
  {
    id: 5,
    name: "Eva Martinez",
    email: "eva@example.com",
    age: 26,
    department: "Design",
    salary: 78000,
    status: "active",
  },
  {
    id: 6,
    name: "Frank Lee",
    email: "frank@example.com",
    age: 38,
    department: "Engineering",
    salary: 105000,
    status: "active",
  },
  {
    id: 7,
    name: "Grace Kim",
    email: "grace@example.com",
    age: 31,
    department: "Marketing",
    salary: 72000,
    status: "inactive",
  },
  {
    id: 8,
    name: "Henry Chen",
    email: "henry@example.com",
    age: 45,
    department: "Sales",
    salary: 98000,
    status: "active",
  },
  {
    id: 9,
    name: "Ivy Wilson",
    email: "ivy@example.com",
    age: 27,
    department: "Design",
    salary: 76000,
    status: "active",
  },
  {
    id: 10,
    name: "Jack Taylor",
    email: "jack@example.com",
    age: 33,
    department: "Engineering",
    salary: 88000,
    status: "active",
  },
  {
    id: 11,
    name: "Karen Davis",
    email: "karen@example.com",
    age: 36,
    department: "HR",
    salary: 70000,
    status: "active",
  },
  {
    id: 12,
    name: "Leo Garcia",
    email: "leo@example.com",
    age: 29,
    department: "Engineering",
    salary: 91000,
    status: "inactive",
  },
  {
    id: 13,
    name: "Mia Anderson",
    email: "mia@example.com",
    age: 32,
    department: "Marketing",
    salary: 79000,
    status: "active",
  },
  {
    id: 14,
    name: "Nathan Moore",
    email: "nathan@example.com",
    age: 40,
    department: "Sales",
    salary: 95000,
    status: "active",
  },
  {
    id: 15,
    name: "Olivia White",
    email: "olivia@example.com",
    age: 25,
    department: "Design",
    salary: 68000,
    status: "active",
  },
  {
    id: 16,
    name: "Peter Harris",
    email: "peter@example.com",
    age: 37,
    department: "Engineering",
    salary: 102000,
    status: "active",
  },
  {
    id: 17,
    name: "Quinn Roberts",
    email: "quinn@example.com",
    age: 28,
    department: "HR",
    salary: 65000,
    status: "inactive",
  },
  {
    id: 18,
    name: "Rachel Clark",
    email: "rachel@example.com",
    age: 44,
    department: "Sales",
    salary: 110000,
    status: "active",
  },
  {
    id: 19,
    name: "Sam Turner",
    email: "sam@example.com",
    age: 30,
    department: "Design",
    salary: 82000,
    status: "active",
  },
  {
    id: 20,
    name: "Tina Baker",
    email: "tina@example.com",
    age: 35,
    department: "Marketing",
    salary: 77000,
    status: "active",
  },
];

const columns: DataTableColumn<User>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "age", header: "Age" },
  { key: "department", header: "Department" },
  {
    key: "salary",
    header: "Salary",
    render: (value) => `$${(value as number).toLocaleString()}`,
  },
  {
    key: "status",
    header: "Status",
    render: (value) => (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === "active"
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {value as string}
      </span>
    ),
  },
];

function App(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Employee Directory
        </h1>
        <p className="text-gray-600 mb-6">
          Click column headers to sort. Use the search box to filter.
        </p>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <DataTable
            data={sampleData}
            columns={columns}
            rowKey="id"
            defaultPageSize={5}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
export { DataTable };
export type { DataTableColumn, DataTableProps };
