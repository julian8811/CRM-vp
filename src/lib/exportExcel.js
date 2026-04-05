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
 * Un solo archivo .xlsx con varias hojas (evita que el navegador bloquee la 2.ª descarga).
 * @param {string} filePrefix - Nombre base del archivo
 * @param {{ sheetName: string, data: object[], columns: { key: string, header?: string }[] }[]} sheets
 */
export function exportWorkbook(filePrefix, sheets) {
  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toISOString().split('T')[0];
  let added = 0;

  for (const { sheetName, data, columns } of sheets) {
    if (!data?.length || !columns?.length) continue;

    const exportData = data.map((row) => {
      const transformed = {};
      columns.forEach((col) => {
        transformed[col.header || col.key] = row[col.key];
      });
      return transformed;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = columns.map((col) => ({
      wch: Math.max(col.header?.length || 10, 15),
    }));

    const safeName = String(sheetName || 'Hoja')
      .slice(0, 31)
      .replace(/[:\\/?*[\]]/g, '');
    const uniqueName = added > 0 && wb.SheetNames.includes(safeName) ? `${safeName.slice(0, 28)}_${added}` : safeName;
    XLSX.utils.book_append_sheet(wb, ws, uniqueName || 'Datos');
    added += 1;
  }

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.json_to_sheet([{ Mensaje: 'Sin datos para exportar en este periodo' }]);
    XLSX.utils.book_append_sheet(wb, ws, 'Info');
  }

  XLSX.writeFile(wb, `${filePrefix}_${timestamp}.xlsx`);
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
