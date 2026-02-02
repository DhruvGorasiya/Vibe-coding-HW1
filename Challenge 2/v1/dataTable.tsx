/**
 * React Sortable/Filterable Data Table v1
 * Generated from prompt v1
 */

import React, { useState, useMemo } from "react";

// =============================================================================
// TYPES
// =============================================================================

type SortDirection = "asc" | "desc" | null;

interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface DataTableColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: DataTableColumn<T>[];
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

// =============================================================================
// DATA TABLE COMPONENT
// =============================================================================

function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
}: DataTableProps<T>) {
  // State
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: null,
  });
  const [filterText, setFilterText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Filter data
  const filteredData = useMemo(() => {
    if (!filterText.trim()) return data;

    const searchTerm = filterText.toLowerCase();
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

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof T];
      const bVal = b[sortConfig.key as keyof T];

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
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handlers
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      if (prev.direction === "desc") {
        return { key: "", direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterText(value);
    setCurrentPage(1);
  };

  // Sort indicator
  const getSortIndicator = (key: string) => {
    if (sortConfig.key !== key) return "↕";
    if (sortConfig.direction === "asc") return "↑";
    if (sortConfig.direction === "desc") return "↓";
    return "↕";
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="w-full">
      {/* Filter and Page Size Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Filter..."
          value={filterText}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Rows per page:</label>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() =>
                    col.sortable !== false && handleSort(String(col.key))
                  }
                  className={`px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 ${
                    col.sortable !== false
                      ? "cursor-pointer hover:bg-gray-100 select-none"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable !== false && (
                      <span className="text-gray-400">
                        {getSortIndicator(String(col.key))}
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
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {filterText
                    ? "No results match your filter"
                    : "No data available"}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100"
                    >
                      {String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
            {sortedData.length} entries
            {filterText && ` (filtered from ${data.length} total)`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}
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
}

const sampleData: User[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    age: 28,
    department: "Engineering",
    salary: 95000,
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    age: 34,
    department: "Marketing",
    salary: 75000,
  },
  {
    id: 3,
    name: "Carol Williams",
    email: "carol@example.com",
    age: 29,
    department: "Engineering",
    salary: 92000,
  },
  {
    id: 4,
    name: "David Brown",
    email: "david@example.com",
    age: 41,
    department: "Sales",
    salary: 85000,
  },
  {
    id: 5,
    name: "Eva Martinez",
    email: "eva@example.com",
    age: 26,
    department: "Design",
    salary: 78000,
  },
  {
    id: 6,
    name: "Frank Lee",
    email: "frank@example.com",
    age: 38,
    department: "Engineering",
    salary: 105000,
  },
  {
    id: 7,
    name: "Grace Kim",
    email: "grace@example.com",
    age: 31,
    department: "Marketing",
    salary: 72000,
  },
  {
    id: 8,
    name: "Henry Chen",
    email: "henry@example.com",
    age: 45,
    department: "Sales",
    salary: 98000,
  },
  {
    id: 9,
    name: "Ivy Wilson",
    email: "ivy@example.com",
    age: 27,
    department: "Design",
    salary: 76000,
  },
  {
    id: 10,
    name: "Jack Taylor",
    email: "jack@example.com",
    age: 33,
    department: "Engineering",
    salary: 88000,
  },
  {
    id: 11,
    name: "Karen Davis",
    email: "karen@example.com",
    age: 36,
    department: "HR",
    salary: 70000,
  },
  {
    id: 12,
    name: "Leo Garcia",
    email: "leo@example.com",
    age: 29,
    department: "Engineering",
    salary: 91000,
  },
  {
    id: 13,
    name: "Mia Anderson",
    email: "mia@example.com",
    age: 32,
    department: "Marketing",
    salary: 79000,
  },
  {
    id: 14,
    name: "Nathan Moore",
    email: "nathan@example.com",
    age: 40,
    department: "Sales",
    salary: 95000,
  },
  {
    id: 15,
    name: "Olivia White",
    email: "olivia@example.com",
    age: 25,
    department: "Design",
    salary: 68000,
  },
];

const columns: DataTableColumn<User>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "age", header: "Age" },
  { key: "department", header: "Department" },
  { key: "salary", header: "Salary" },
];

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Employee Directory
        </h1>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <DataTable data={sampleData} columns={columns} defaultPageSize={5} />
        </div>
      </div>
    </div>
  );
}

export default App;
export { DataTable, type DataTableColumn, type DataTableProps };
