import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <Link to="/" className="text-sm text-primary hover:underline">← Back to Home</Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 2, 2026</p>

        <div className="space-y-6 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-2">1. Who We Are</h2>
            <p>Leads2Gold is operated by Crowell Digital Marketplace, Frisco, Texas. We are the data controller for personal information you provide.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account data:</strong> name, email, hashed password, subscription status.</li>
              <li><strong>Usage data:</strong> searches performed, leads generated, CRM entries you create.</li>
              <li><strong>Payment data:</strong> handled and stored exclusively by Stripe. We never see or store full card numbers.</li>
              <li><strong>Technical data:</strong> IP address, browser, timestamps for security auditing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">3. How We Use Your Data</h2>
            <p>To deliver the Service, authenticate you, process payments, enforce monthly limits, send transactional and (with consent) marketing email, prevent abuse, and comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">4. Exclusive Per-User Data Isolation</h2>
            <p>Your account, CRM prospects, saved searches, and lead usage are protected by <strong>Row-Level Security (RLS)</strong> at the database layer. Every read and write is scoped to your authenticated user ID — no other customer, and no unauthenticated request, can access your records. Only designated administrators can access aggregate account data for billing and support, and never share your CRM contents with other customers.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">5. Database & Infrastructure Security</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Data encrypted in transit (TLS 1.2+) and at rest (AES-256) via Supabase/Postgres.</li>
              <li>Passwords hashed with bcrypt; sessions issued as short-lived JWTs.</li>
              <li>API keys and secrets stored in a hardened secrets vault — never in the client bundle.</li>
              <li>Least-privilege service roles; the anon key cannot bypass RLS.</li>
              <li>Automatic daily backups with point-in-time recovery.</li>
              <li>Continuous security scans and dependency audits.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">6. Sharing of Information</h2>
            <p>We do <strong>not</strong> sell your personal data. We share it only with processors necessary to run the Service: Stripe (payments), Supabase (hosting/DB), Resend (transactional email), and enrichment providers (business data only, not your account details). Each is contractually bound to protect your data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">7. Data Retention</h2>
            <p>Account and CRM data is retained while your account is active and for 30 days after cancellation, after which it is permanently deleted unless required by law (e.g., billing records retained 7 years).</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">8. Your Rights</h2>
            <p>You may request access, correction, export, or deletion of your personal data at any time by emailing Marcus@cdmweb.store. GDPR and CCPA rights (including opt-out of marketing) are honored within 30 days.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">9. Cookies</h2>
            <p>We use only strictly necessary cookies for authentication and session management. We do not run third-party advertising trackers.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">10. Children</h2>
            <p>The Service is intended for users aged 18+. We do not knowingly collect data from children.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">11. Changes</h2>
            <p>We will notify subscribers by email of material changes to this policy at least 14 days before they take effect.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">12. Contact</h2>
            <p>Crowell Digital Marketplace · Frisco, TX 75036 · Marcus@cdmweb.store · 940-236-2236</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
