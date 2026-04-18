import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file.
 * @param {Array} data - Array of objects to export.
 * @param {String} fileName - The name of the file (without extension).
 * @param {String} sheetName - The name of the sheet in the workbook.
 */
export const exportToExcel = (data, fileName = 'Report', sheetName = 'Data') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  // Create worksheet from JSON
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate file and trigger download
  // Filename includes today's date
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileName}_${dateStr}.xlsx`;
  
  XLSX.writeFile(workbook, fullFileName);
};
