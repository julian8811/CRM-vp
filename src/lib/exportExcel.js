import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Filename without extension
 * @param {Array} columns - Column definitions { key, header }
 */
export function exportToExcel(data, filename, columns) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Transform data to match column headers
  const exportData = data.map(row => {
    const transformed = {};
    columns.forEach(col => {
      let value = row[col.key];
      
      // Handle render functions
      if (col.render && typeof col.render === 'function') {
        // For render, we try to get a simple value or use the key value
        value = row[col.key];
      }
      
      transformed[col.header || col.key] = value;
    });
    return transformed;
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Auto-size columns
  const colWidths = columns.map(col => ({
    wch: Math.max(col.header?.length || 10, 15)
  }));
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, filename);

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(wb, fullFilename);
}

/**
 * Export current table data to Excel with page name
 */
export function exportCurrentPage(pageName, data, columns) {
  const pageNames = {
    customers: 'Clientes',
    leads: 'Leads',
    products: 'Productos',
    quotations: 'Cotizaciones',
    orders: 'Pedidos',
    users: 'Usuarios',
  };
  
  const filename = pageNames[pageName] || pageName;
  exportToExcel(data, filename, columns);
}
