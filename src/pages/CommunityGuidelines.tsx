import React from 'react';
import { motion } from 'framer-motion';

export default function CommunityGuidelines() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-stone-50 min-h-screen py-16"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-200">
          <h1 className="text-4xl font-extrabold text-stone-900 mb-8">Community Guidelines</h1>
          
          <div className="prose prose-stone max-w-none">
            <p className="text-stone-600 mb-6">
              <strong>Effective Date:</strong> March 3, 2026
            </p>
            
            <p className="text-stone-600 mb-8">
              Welcome to CSRG Kenya. Our platform is dedicated to fostering constructive dialogue, civic engagement, and community-led development through Ward Citizen Assemblies. To ensure a safe, respectful, and productive environment for all wananchi, we have established these Community Guidelines. By participating in our platform, you agree to abide by these rules.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">1. Respectful Dialogue</h2>
            <p className="text-stone-600 mb-4">
              We encourage open and honest discussions about the issues affecting our communities. However, all interactions must be respectful and constructive. We do not tolerate:
            </p>
            <ul className="list-disc pl-6 text-stone-600 mb-6 space-y-2">
              <li>Personal attacks, insults, or derogatory language directed at individuals or groups.</li>
              <li>Harassment, bullying, or intimidation of any kind.</li>
              <li>Hate speech, discrimination, or incitement to violence based on ethnicity, religion, gender, political affiliation, or any other characteristic, in accordance with the National Cohesion and Integration Act, 2008.</li>
            </ul>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">2. Constructive Participation</h2>
            <p className="text-stone-600 mb-4">
              Our goal is to find solutions to community challenges. When proposing issues or participating in discussions, please strive to:
            </p>
            <ul className="list-disc pl-6 text-stone-600 mb-6 space-y-2">
              <li>Focus on the issue at hand and avoid derailing conversations.</li>
              <li>Provide evidence or context to support your claims or proposals.</li>
              <li>Be open to different perspectives and willing to engage in meaningful debate.</li>
              <li>Propose actionable solutions rather than just highlighting problems.</li>
            </ul>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">3. Accuracy and Truthfulness</h2>
            <p className="text-stone-600 mb-4">
              We rely on accurate information to make informed decisions. Please ensure that the information you share is truthful and verifiable. Do not:
            </p>
            <ul className="list-disc pl-6 text-stone-600 mb-6 space-y-2">
              <li>Spread false or misleading information, rumors, or propaganda.</li>
              <li>Impersonate other individuals, organizations, or public officials.</li>
              <li>Create fake accounts or use automated bots to manipulate discussions or voting.</li>
            </ul>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">4. Privacy and Security</h2>
            <p className="text-stone-600 mb-4">
              Respect the privacy and security of others. Do not:
            </p>
            <ul className="list-disc pl-6 text-stone-600 mb-6 space-y-2">
              <li>Share personal information (such as phone numbers, addresses, or ID numbers) of others without their explicit consent.</li>
              <li>Post content that violates the intellectual property rights of others.</li>
              <li>Attempt to hack, disrupt, or compromise the security of our platform.</li>
            </ul>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">5. Enforcement</h2>
            <p className="text-stone-600 mb-6">
              We take these guidelines seriously. Violations may result in warnings, content removal, temporary suspension, or permanent banning from the platform. We reserve the right to report illegal activities to the relevant Kenyan authorities.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">6. Reporting Violations</h2>
            <p className="text-stone-600 mb-6">
              If you encounter content or behavior that violates these guidelines, please report it immediately using the reporting tools provided on the platform or by contacting us at report@csrg.ke.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">7. Updates to Guidelines</h2>
            <p className="text-stone-600 mb-6">
              We may update these Community Guidelines periodically to reflect changes in our platform or legal requirements. We encourage you to review them regularly.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
