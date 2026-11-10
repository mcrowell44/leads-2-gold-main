import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <Link to="/" className="text-sm text-primary hover:underline">← Back to Home</Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 2, 2026</p>

        <div className="space-y-6 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using Leads2Gold (the "Service"), operated by Crowell Digital Marketplace ("we", "us"), you agree to be bound by these Terms & Conditions. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">2. Account Registration</h2>
            <p>You must provide accurate, current, and complete information when creating an account. You are responsible for safeguarding your credentials and for all activity that occurs under your account. Notify us immediately at Marcus@cdmweb.store of any unauthorized use.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">3. Subscription & Billing</h2>
            <p>The Pro plan is billed at <strong>$259.99/month</strong> via Stripe on an auto-renewing basis until canceled. Subscribers receive up to <strong>2,500 quality leads per month</strong>. Unused leads do not roll over. Cancellations take effect at the end of the current billing period. All fees are non-refundable except where required by law.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">4. Free Trial</h2>
            <p>New users receive 2 free searches after providing a name and email. Free-trial data is used solely to deliver the service and communicate with you.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">5. Acceptable Use</h2>
            <p>You agree not to: (a) resell, sublicense, or redistribute lead data to third parties; (b) use the Service to send spam or violate CAN-SPAM, TCPA, GDPR, or CCPA; (c) reverse engineer or scrape the platform; (d) misrepresent your identity or affiliation; (e) upload malicious code.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">6. Data Ownership</h2>
            <p>You retain ownership of the prospect notes, CRM entries, and imported files you create. We retain ownership of the platform, generated insights, and aggregated anonymized analytics. Business contact information surfaced through the Service is derived from publicly available sources.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">7. Third-Party Services</h2>
            <p>The Service uses Stripe (payments), Supabase (auth & database), Resend (email), and various search/enrichment providers. Your use of the Service is also subject to those providers' terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">8. Disclaimers & Limitation of Liability</h2>
            <p>The Service is provided "AS IS" without warranties of any kind. We do not guarantee the accuracy, completeness, or conversion rate of any lead. To the maximum extent permitted by law, our aggregate liability shall not exceed the amount you paid in the prior 3 months.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">9. Termination</h2>
            <p>We may suspend or terminate accounts that violate these Terms. Upon termination, your access ends and CRM data may be deleted after 30 days.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">10. Governing Law</h2>
            <p>These Terms are governed by the laws of the State of Texas, USA. Disputes shall be resolved in the state or federal courts of Collin County, Texas.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">11. Contact</h2>
            <p>Crowell Digital Marketplace · Frisco, TX 75036 · Marcus@cdmweb.store · 940-236-2236</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
