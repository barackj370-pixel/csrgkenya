import React from 'react';
import { motion } from 'framer-motion';

export default function TermsOfService() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-stone-50 min-h-screen py-16"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-200">
          <h1 className="text-4xl font-extrabold text-stone-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-stone max-w-none">
            <p className="text-stone-600 mb-6">
              <strong>Effective Date:</strong> March 3, 2026
            </p>
            
            <p className="text-stone-600 mb-8">
              Welcome to CSRG Kenya. These Terms of Service ("Terms") govern your access to and use of our platform, including our website, applications, and services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-stone-600 mb-6">
              By registering for an account, proposing issues, or participating in Ward Citizen Assemblies through our platform, you confirm that you have read, understood, and agree to these Terms. If you do not agree, you may not use our Services.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">2. Eligibility</h2>
            <p className="text-stone-600 mb-6">
              You must be at least 18 years old and a resident of Kenya to use our Services. By using our Services, you represent and warrant that you meet these eligibility requirements.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">3. User Accounts</h2>
            <p className="text-stone-600 mb-4">
              To access certain features of our Services, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-stone-600 mb-6 space-y-2">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain the security of your password and accept responsibility for all activities that occur under your account.</li>
              <li>Promptly notify us of any unauthorized use of your account or security breaches.</li>
            </ul>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">4. User Conduct</h2>
            <p className="text-stone-600 mb-4">
              You agree to use our Services in a lawful and respectful manner. You must not:
            </p>
            <ul className="list-disc pl-6 text-stone-600 mb-6 space-y-2">
              <li>Post or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.</li>
              <li>Engage in hate speech or incite violence, in violation of the National Cohesion and Integration Act, 2008.</li>
              <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
              <li>Interfere with or disrupt the operation of our Services or the servers or networks connected to our Services.</li>
            </ul>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">5. Content Ownership</h2>
            <p className="text-stone-600 mb-6">
              You retain ownership of any content you submit, post, or display on or through our Services. By submitting content, you grant CSRG Kenya a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content in any and all media or distribution methods.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">6. Termination</h2>
            <p className="text-stone-600 mb-6">
              We may suspend or terminate your access to our Services at any time, with or without cause, and with or without notice. Upon termination, your right to use our Services will immediately cease.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">7. Governing Law</h2>
            <p className="text-stone-600 mb-6">
              These Terms shall be governed by and construed in accordance with the laws of the Republic of Kenya, without regard to its conflict of law provisions. Any dispute arising out of or relating to these Terms or our Services shall be subject to the exclusive jurisdiction of the courts of Kenya.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">8. Changes to Terms</h2>
            <p className="text-stone-600 mb-6">
              We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the new Terms on this page and updating the effective date. Your continued use of our Services after such changes constitutes your acceptance of the new Terms.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">9. Contact Us</h2>
            <p className="text-stone-600 mb-6">
              If you have any questions about these Terms, please contact us at:
              <br />
              <strong>Email:</strong> legal@csrg.ke
              <br />
              <strong>Address:</strong> Nairobi, Kenya
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
