import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Privacy Policy</span>
      </nav>

      {/* Header Banner */}
      <div className="border-b border-gray-200 pb-6">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mb-3">
          Legal & Compliance
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Last Updated: November 3, 2026 • Effective Date: January 1, 2026
        </p>
      </div>

      <div className="prose prose-slate max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
        {/* Section 1 */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>1.</span>
            <span>Introduction & Overview</span>
          </h2>
          <p>
            Welcome to <strong>JAMBStar</strong> ("we," "our," or "us"). JAMBStar is dedicated to empowering Nigerian students preparing for the Unified Tertiary Matriculation Examination (UTME) by providing interactive computer-based test (CBT) simulations, subject question banks, and dynamic performance analytics.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, store, disclose, and protect personal and usage data when you visit our website, take practice quizzes, register for an account, or interact with any associated services (collectively, the "Platform").
          </p>
          <p>
            By accessing or using JAMBStar, you acknowledge that you have read, understood, and agree to the data collection and practices described in this Privacy Policy.
          </p>
        </section>

        {/* Section 2: Google AdSense & Cookies - Critical for AdSense Crawlers */}
        <section className="bg-white p-6 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>2.</span>
            <span>Google AdSense & Third-Party Advertising Cookies</span>
          </h2>
          <p>
            JAMBStar partners with third-party advertising companies and networks, primarily <strong>Google AdSense</strong>, to serve advertisements when you visit our website.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>
              <strong>Third-Party Vendors:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to our website or other websites on the Internet.
            </li>
            <li>
              <strong>DoubleClick & Advertising Cookies:</strong> Google's use of advertising cookies (such as the DoubleClick cookie) enables it and its partners to serve targeted ads to our users based on their visit to our sites and/or other sites across the Internet.
            </li>
            <li>
              <strong>Opting Out of Personalized Advertising:</strong> Users may opt out of personalized advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-semibold underline hover:text-emerald-800"
              >
                Google Ads Settings
              </a>
              . Alternatively, you can opt out of third-party vendors' use of cookies for personalized advertising by visiting{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-semibold underline hover:text-emerald-800"
              >
                www.aboutads.info
              </a>
              .
            </li>
          </ul>
          <p className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
            <strong>Notice on Non-Personalized Ads:</strong> Even if you opt out of personalized advertising, you will still see contextual ads. These ads may be based on factors such as the general content of the page you are viewing or your approximate geographic region.
          </p>
        </section>

        {/* Section 3: Information We Collect */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>3.</span>
            <span>Information We Collect</span>
          </h2>
          <p>We collect information in the following categories:</p>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900">A. Account & Profile Information</h3>
              <p className="mt-1 text-gray-600 text-xs">
                When you create a JAMBStar account, we collect your full name, email address, password hash (securely encrypted), and selected academic track (Science, Arts, or Commercial).
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900">B. CBT Simulation & Exam Performance Data</h3>
              <p className="mt-1 text-gray-600 text-xs">
                When you take a practice exam or guest demo, we record quiz responses, time spent per subject, total scores, flagged questions, and submission timestamps. This information is used to compute your personalized candidate progress analytics.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900">C. Log & Device Data</h3>
              <p className="mt-1 text-gray-600 text-xs">
                Like most web applications, our servers automatically collect technical log information, including your Internet Protocol (IP) address, browser type and version, operating system, referring URLs, device type, and time spent on platform pages.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Cookies & Local Storage */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>4.</span>
            <span>Cookies & Local Storage Technologies</span>
          </h2>
          <p>
            We use browser cookies and HTML5 LocalStorage to maintain your authentication session, save your active exam state, ensure timer continuity if you accidentally refresh the exam screen, and store guest evaluation limits.
          </p>
          <p>
            You can instruct your web browser to refuse all cookies or to indicate when a cookie is being sent. However, disabling cookies may prevent you from logging into your account or accessing the CBT exam engine.
          </p>
        </section>

        {/* Section 5: How We Use Your Information */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>5.</span>
            <span>How We Use Your Information</span>
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
            <li>To deliver, maintain, and improve our CBT simulation algorithms and past question banks.</li>
            <li>To display candidate score breakdowns, weak topic diagnostics, and subject readiness metrics.</li>
            <li>To enforce platform security, prevent unauthorized automated bots, and prevent fraud.</li>
            <li>To communicate essential platform notifications, system updates, and account security notices.</li>
            <li>To display relevant educational resources and advertisements that keep our core practice tools accessible.</li>
          </ul>
        </section>

        {/* Section 6: Data Protection & Legal Compliance */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>6.</span>
            <span>Nigerian Data Protection Regulation (NDPR) & Global Privacy</span>
          </h2>
          <p>
            JAMBStar operates in compliance with the <strong>Nigeria Data Protection Act (NDPA)</strong> and the <strong>Nigeria Data Protection Regulation (NDPR)</strong>, as well as internationally recognized data protection principles (including GDPR where applicable).
          </p>
          <p>
            You have the right to request access to the personal data we hold about you, request corrections to inaccurate records, or request the deletion of your account and test history. To exercise any of these rights, please contact our Data Protection Officer at{" "}
            <a href="mailto:privacy@jambstar.com" className="text-emerald-700 font-semibold underline">
              privacy@jambstar.com
            </a>
            .
          </p>
        </section>

        {/* Section 7: Security & Data Retention */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>7.</span>
            <span>Data Security & Retention</span>
          </h2>
          <p>
            We implement industry-standard technical and organizational security measures, including HTTPS encryption in transit, row-level database security (RLS), and encrypted password storage. We retain candidate quiz performance data for as long as your account remains active, or until you submit a written deletion request.
          </p>
        </section>

        {/* Section 8: Contact Us */}
        <section className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>8.</span>
            <span>Contact Information & Privacy Officer</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            If you have questions, feedback, or concerns regarding this Privacy Policy or our data handling practices, please contact our team:
          </p>
          <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-300 space-y-1">
            <p><strong>JAMBStar Educational Technologies</strong></p>
            <p>Email: <a href="mailto:privacy@jambstar.com" className="text-emerald-400 underline">privacy@jambstar.com</a></p>
            <p>Publisher Support: <a href="mailto:support@jambstar.com" className="text-emerald-400 underline">support@jambstar.com</a></p>
            <p>Lagos, Nigeria</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
