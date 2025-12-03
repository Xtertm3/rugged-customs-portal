import { VendorBillingRequest } from '../App';

export const generateEmailTemplate = (request: VendorBillingRequest): { subject: string; body: string } => {
  // Derive a clean base site name without embedded codes
  const rawName = request.siteName || '';
  const siteIdMatch = rawName.match(/\bIN-?\d+\b/i);
  const rlIdMatch = rawName.match(/\bR\/RL-?\d+\b/i);
  const baseSiteName = rawName
    .replace(siteIdMatch?.[0] || '', '')
    .replace(rlIdMatch?.[0] || '', '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim() || request.siteName;

  const subject = `Approval Request - ${baseSiteName} | Site ID: ${request.siteIdCode} | RL ID: ${request.rlId}`;

  // Build table rows
  const tableRows = request.lineItems.map((item) => {
    return `<tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${request.rlId}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${request.siteIdCode}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${request.siteName}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.itemCode}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>`;
  }).join('');

  // Determine activity type (for email body text)
  const activityTypes = [...new Set(request.lineItems.map(item => item.category))];
  const activityText = activityTypes.length === 1 
    ? activityTypes[0].toLowerCase() 
    : 'multiple activities';

  const body = `Hi sir,

With reference to the above subject, we have executed ${activityText} at the below mentioned site. Kindly approve of the same.

<div style="margin: 10px 0; font-family: Arial, sans-serif;">
  <div><strong>Site Name:</strong> ${baseSiteName}</div>
  <div><strong>Site ID:</strong> ${request.siteIdCode}</div>
  <div><strong>RL ID:</strong> ${request.rlId}</div>
</div>

<table style="border-collapse: collapse; width: 100%; margin: 20px 0; font-family: Arial, sans-serif;">
  <thead>
    <tr style="background-color: #4CAF50; color: white;">
      <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Project ID</th>
      <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Site ID</th>
      <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Site Name</th>
      <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Item Code</th>
      <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Description</th>
      <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Qty</th>
      <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Rate</th>
      <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Total</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows}
  </tbody>
  <tfoot>
    <tr style="background-color: #f2f2f2; font-weight: bold;">
      <td colspan="7" style="border: 1px solid #ddd; padding: 12px; text-align: right;">Grand Total:</td>
      <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${request.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
  </tfoot>
</table>

Best regards,
${request.requestedByName}
Rugged Customs`;

  return { subject, body };
};

export const openOutlookEmail = (request: VendorBillingRequest, recipientEmail?: string) => {
  const { subject, body } = generateEmailTemplate(request);
  
  // Try to open Outlook with mailto (works in most environments)
  const mailto = `mailto:${recipientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/<[^>]*>/g, '\n'))}`;
  
  // For HTML email, we need to use a different approach
  // Option 1: Open mailto (plain text version)
  window.open(mailto, '_blank');
  
  // Option 2: Copy HTML to clipboard for manual paste
  const htmlEmail = `
Subject: ${subject}

${body}
  `;
  
  // Try to copy to clipboard
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(htmlEmail).then(() => {
      console.log('Email template copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy email template:', err);
    });
  }
  
  return { subject, body };
};

// Alternative: Generate downloadable .eml file for Outlook
export const generateEmlFile = (request: VendorBillingRequest, recipientEmail?: string) => {
  const { subject, body } = generateEmailTemplate(request);
  
  const emlContent = `To: ${recipientEmail || ''}
Subject: ${subject}
Content-Type: text/html; charset=UTF-8

<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  ${body.replace(/\n/g, '<br>')}
</body>
</html>`;

  const blob = new Blob([emlContent], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Approval_Request_${request.siteIdCode}_${Date.now()}.eml`;
  a.click();
  URL.revokeObjectURL(url);
};
