import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm">
      <h1 className="text-2xl font-extrabold mb-2">Privacy Policy</h1>
      <p className="text-sm text-text-secondary mb-4">Last updated: February 1, 2026</p>

      <p className="mb-4">Rugged Customs ("we", "us", "our") operates the Rugged Customs Payment Portal (the "Service"). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our web and mobile applications.</p>

      <h2 className="text-lg font-semibold mt-4">Information We Collect</h2>
      <ul className="list-disc pl-5 mb-4">
        <li><strong>Account information:</strong> name, email, role, company/site associations when you create an account or are invited to the Service.</li>
        <li><strong>Usage data:</strong> pages viewed, features used, timestamps, and basic diagnostic data to improve the Service.</li>
        <li><strong>Files and attachments:</strong> documents, images or other files you upload while using the Service.</li>
        <li><strong>Device and connection data:</strong> browser, IP address, device model, platform and app version, and other technical details when you access the Service.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-4">How We Use Information</h2>
      <ul className="list-disc pl-5 mb-4">
        <li>Provide, maintain, and improve the Service.</li>
        <li>Authenticate and manage user access and roles.</li>
        <li>Send transactional messages (password resets, notifications) when you opt in or as required for account functionality.</li>
        <li>Analyze usage and performance to diagnose issues and monitor for abuse.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-4">Data Sharing and Disclosure</h2>
      <p className="mb-4">We do not sell personal information. We may share data with service providers, law enforcement when required, and affiliates or partners only as necessary to provide the Service.</p>

      <h2 className="text-lg font-semibold mt-4">Security</h2>
      <p className="mb-4">We employ administrative, technical, and physical safeguards to protect personal data. If you suspect a breach, contact us immediately.</p>

      <h2 className="text-lg font-semibold mt-4">Contact</h2>
      <p>If you have questions or requests regarding this Privacy Policy, email us at <a href="mailto:privacy@ruggedcustoms.example" className="text-blue-600">privacy@ruggedcustoms.example</a>.</p>
    </div>
  );
};

export default PrivacyPolicy;
