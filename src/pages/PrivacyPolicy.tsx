import React from 'react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-stone-50 min-h-screen py-16"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-200">
          <h1 className="text-4xl font-extrabold text-stone-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-stone max-w-none">
            <p className="text-stone-600 mb-6">
              <strong>Effective Date:</strong> March 3, 2026
            </p>
            
            <p className="text-stone-600 mb-8">
              At CSRG Kenya, we are committed to protecting your privacy and ensuring that your personal data is handled in compliance with the Data Protection Act, 2019 of Kenya. This Privacy Policy outlines how we collect, use, and safeguard your information when you use our platform.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-stone-600 mb-4">
              We collect information that you provide directly to us when you register for an account, propose issues, or register community groups. This may include:
            </p>
            <ul className="list-disc pl-6 text-stone-600 mb-6 space-y-2">
              <li>Your name, email address, and contact details.</li>
              <li>Your role (e.g., Citizen, Mobilizer, Admin).</li>
              <li>Your associated Ward and County.</li>
              <li>Information about community groups you register, including leader names and member counts.</li>
            </ul>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-stone-600 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-stone-600 mb-6 space-y-2">
              <li>Facilitate the organization of Ward Citizen Assemblies.</li>
              <li>Communicate with you regarding upcoming assemblies, proposed issues, and platform updates.</li>
              <li>Verify the authenticity of community groups and mobilizers.</li>
              <li>Improve our platform and services to better serve the citizens of Kenya.</li>
            </ul>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">3. Data Sharing and Disclosure</h2>
            <p className="text-stone-600 mb-6">
              We do not sell your personal data. We may share your information with authorized ward administrators and local leaders solely for the purpose of facilitating citizen assemblies and addressing community issues. We may also disclose information if required by Kenyan law or to protect the rights and safety of our users.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">4. Data Security</h2>
            <p className="text-stone-600 mb-6">
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">5. Your Rights</h2>
            <p className="text-stone-600 mb-6">
              Under the Data Protection Act, 2019, you have the right to access, correct, or delete your personal data. You may also object to or restrict the processing of your data. To exercise these rights, please contact us at privacy@csrg.ke.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">6. Changes to this Policy</h2>
            <p className="text-stone-600 mb-6">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the effective date.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">7. Contact Us</h2>
            <p className="text-stone-600 mb-6">
              If you have any questions or concerns about this Privacy Policy, please contact us at:
              <br />
              <strong>Email:</strong> privacy@csrg.ke
              <br />
              <strong>Address:</strong> Nairobi, Kenya
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
