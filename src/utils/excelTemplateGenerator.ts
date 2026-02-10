/**
 * XLSX Template Generator with Data Validation Dropdowns
 * Creates Excel files with actual dropdown lists for constrained fields
 * Uses ExcelJS library for proper XLSX generation with full data validation support
 */

import ExcelJS from 'exceljs';
import { TeamMember, Vendor } from '../App';

/**
 * Generates an Excel file (.xlsx) with data validation dropdowns
 * Creates a template with 17 columns and 10 empty rows for data entry
 * Includes dropdown lists for: projectType, workType, vendorId, siteManagerId
 */
export const generateExcelWithDropdownsV2 = async (teamMembers: TeamMember[], vendors: Vendor[]): Promise<Blob> => {
  const projectTypes = ['Solar', 'Wind', 'Hydro', 'Thermal', 'Battery', 'Biogas', 'Transmission', 'Distribution'];
  const workTypes = ['Civil', 'Electrical'];
  const vendorIds = vendors.map(v => v.id);
  
  // Get manager names instead of IDs
  const managerNames = teamMembers
    .filter(m => ['Admin', 'Manager', 'Supervisor', 'Electrical + Civil', 'Civil', 'Electricals'].includes(m.role))
    .map(m => m.name);
  
  // Get all team member names for team assignment
  const allTeamMemberNames = teamMembers.map(m => m.name);

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sites');

  // Define columns with headers
  worksheet.columns = [
    { header: 'siteName', key: 'siteName', width: 20 },
    { header: 'siteId', key: 'siteId', width: 15 },
    { header: 'rlId', key: 'rlId', width: 15 },
    { header: 'location', key: 'location', width: 20 },
    { header: 'latitude', key: 'latitude', width: 12 },
    { header: 'longitude', key: 'longitude', width: 12 },
    { header: 'projectType', key: 'projectType', width: 15 },
    { header: 'workType', key: 'workType', width: 12 },
    { header: 'allocationDate', key: 'allocationDate', width: 15 },
    { header: 'vendorId', key: 'vendorId', width: 20 },
    { header: 'vendorName', key: 'vendorName', width: 20 },
    { header: 'siteManagerName', key: 'siteManagerName', width: 20 },
    { header: 'teamAssignment', key: 'teamAssignment', width: 20 },
    { header: 'technicianName', key: 'technicianName', width: 20 },
    { header: 'technicianPhone', key: 'technicianPhone', width: 15 },
    { header: 'fscName', key: 'fscName', width: 20 },
    { header: 'fscPhone', key: 'fscPhone', width: 15 },
    { header: 'planningRecommendation', key: 'planningRecommendation', width: 25 }
  ];

  // Add 10 empty rows for data entry
  for (let i = 0; i < 10; i++) {
    worksheet.addRow({});
  }

  // Add data validation for projectType (Column G, rows 2-11)
  for (let row = 2; row <= 11; row++) {
    worksheet.getCell(`G${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${projectTypes.join(',')}"`],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid Project Type',
      error: 'Please select a project type from the list'
    };
  }

  // Add data validation for workType (Column H, rows 2-11)
  for (let row = 2; row <= 11; row++) {
    worksheet.getCell(`H${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${workTypes.join(',')}"`],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid Work Type',
      error: 'Please select Civil or Electrical'
    };
  }

  // Add data validation for vendorId (Column J, rows 2-11)
  if (vendorIds.length > 0) {
    for (let row = 2; row <= 11; row++) {
      worksheet.getCell(`J${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${vendorIds.join(',')}"`],
        showErrorMessage: true,
        errorStyle: 'error',
        errorTitle: 'Invalid Vendor ID',
        error: 'Please select a vendor ID from the list'
      };
    }
  }

  // Add data validation for siteManagerName (Column L, rows 2-11)
  if (managerNames.length > 0) {
    for (let row = 2; row <= 11; row++) {
      worksheet.getCell(`L${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${managerNames.join(',')}"`],
        showErrorMessage: true,
        errorStyle: 'error',
        errorTitle: 'Invalid Manager Name',
        error: 'Please select a manager name from the list'
      };
    }
  }

  // Add data validation for teamAssignment (Column M, rows 2-11)
  if (allTeamMemberNames.length > 0) {
    for (let row = 2; row <= 11; row++) {
      worksheet.getCell(`M${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${allTeamMemberNames.join(',')}"`],
        showErrorMessage: true,
        errorStyle: 'error',
        errorTitle: 'Invalid Team Member Name',
        error: 'Please select a team member name from the list'
      };
    }
  }

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Write workbook to buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Return as Excel blob
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
