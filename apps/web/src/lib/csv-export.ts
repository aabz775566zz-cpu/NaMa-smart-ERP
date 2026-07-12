export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

function escapeCsvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Generates a CSV client-side from data the page already has loaded and
 * triggers a browser download — no dedicated export endpoint on the API.
 * Fine for the list sizes this product deals with (a single company's
 * products/customers/sales), and lets the EXPORT permission actually do
 * something instead of being granted with no UI behind it.
 */
export function exportToCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(',');
  const lines = rows.map((row) => columns.map((column) => escapeCsvCell(String(column.value(row)))).join(','));
  const csv = [header, ...lines].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
