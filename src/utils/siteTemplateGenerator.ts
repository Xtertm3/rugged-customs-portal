import { TeamMember, Vendor } from '../App';

/**
 * Generates a CSV template for bulk site creation with clean column structure
 * Row 1: Headers
 * Rows 2-6: Empty data entry rows
 * Reference section: Valid dropdown values for each field
 */
export const generateSiteTemplate = (teamMembers: TeamMember[], vendors: Vendor[]): string => {
  // Define the CSV headers
  const headers = [
    'siteName',
    'siteId',
    'rlId',
    'location',
    'latitude',
    'longitude',
    'projectType',
    'workType',
    'allocationDate',
    'vendorName',
    'siteManagerId',
    'technicianName',
    'technicianPhone',
    'fscName',
    'fscPhone',
    'planningRecommendation'
  ];

  // Create header row
  const headerRow = headers.join(',');

  // Create 5 empty data rows for users to fill in
  const emptyRows = Array(5).fill(null).map(() => 
    Array(headers.length).fill('').join(',')
  );

  // Prepare dropdown reference data
  const projectTypeOptions = ['Solar', 'Wind', 'Hydro', 'Thermal', 'Battery', 'Biogas', 'Transmission', 'Distribution'].join('|');
  const workTypeOptions = ['Civil', 'Electrical'].join('|');
  const vendorOptions = vendors.map(v => v.name).join('|');
  const managerOptions = teamMembers
    .filter(m => ['Admin', 'Manager', 'Supervisor', 'Electrical + Civil', 'Civil', 'Electricals'].includes(m.role))
    .map(m => `${m.id}:${m.name}`)
    .join('|');

  // Create data validation reference section
  const dataValidationSection = [
    '',
    '=== DATA VALIDATION REFERENCE ===',
    '',
    '[DROPDOWN:projectType]',
    projectTypeOptions,
    '',
    '[DROPDOWN:workType]',
    workTypeOptions,
    '',
    '[DROPDOWN:vendorName]',
    vendorOptions,
    '',
    '[DROPDOWN:siteManagerId]',
    managerOptions,
  ];

  // Combine all parts
  const csvContent = [
    headerRow,
    ...emptyRows,
    ...dataValidationSection,
  ].join('\n');

  return csvContent;
};

/**
 * Alternative: For true Excel dropdowns, use this data in an XLSX generator
 * This provides the reference data needed for data validation
 */
export const getDropdownData = (teamMembers: TeamMember[], vendors: Vendor[]) => {
  return {
    projectTypes: ['Solar', 'Wind', 'Hydro', 'Thermal', 'Battery', 'Biogas', 'Transmission', 'Distribution'],
    workTypes: ['Civil', 'Electrical'],
    vendors: vendors.map(v => ({ id: v.id, name: v.name })),
    managers: teamMembers
      .filter(m => ['Admin', 'Manager', 'Supervisor', 'Electrical + Civil', 'Civil', 'Electricals'].includes(m.role))
      .map(m => ({ id: m.id, name: m.name, role: m.role }))
  };
};

/**
 * Generates an Excel file with data validation using SheetJS library
 * For now, we'll use CSV format but can be enhanced to use Excel format with actual dropdowns
 */
export const downloadSiteTemplate = (teamMembers: TeamMember[], vendors: Vendor[]): void => {
  const csvContent = generateSiteTemplate(teamMembers, vendors);
  
  // Create a Blob from the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `site-template-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Parse CSV content and return array of site data
 */
export const parseCSVContent = (content: string): Array<Record<string, string>> => {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain headers and at least one data row');
  }

  // Parse headers (first line)
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows (remaining lines)
  const data: Array<Record<string, string>> = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length === 0) continue; // Skip empty rows
    
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
};

/**
 * Parse a single CSV line handling quoted values
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
};
