import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 13, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>When you use Zenka, we collect the following information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Personal Information:</strong> Full name, phone number, email address, ID number, and employment details provided during loan application.</li>
              <li><strong>Financial Information:</strong> Income level, loan history, savings deposits, and M-Pesa transaction details.</li>
              <li><strong>Device Information:</strong> Device type, operating system, and app version for service optimization.</li>
              <li><strong>Usage Data:</strong> How you interact with our app to improve user experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Process and evaluate loan applications</li>
              <li>Facilitate M-Pesa payments and disbursements</li>
              <li>Manage your savings account</li>
              <li>Send notifications about your account and transactions</li>
              <li>Provide customer support</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Data Sharing</h2>
            <p>We do not sell your personal data. We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Payment Processors:</strong> M-Pesa/Safaricom for processing payments and disbursements.</li>
              <li><strong>Regulatory Bodies:</strong> As required by Kenyan law and financial regulations.</li>
              <li><strong>Service Providers:</strong> Third-party services that help us operate our platform (hosting, analytics).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
            <p>We implement industry-standard security measures including encryption, secure servers, and access controls to protect your personal and financial information. All data transmissions are encrypted using SSL/TLS protocols.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active or as needed to provide services. Financial records are retained as required by Kenyan financial regulations. You may request deletion of your account data by contacting our support team.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
            <p>Under the Kenya Data Protection Act 2019, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to data processing</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Cookies & Local Storage</h2>
            <p>Our app uses local storage and session storage to maintain your login session and preferences. No third-party tracking cookies are used within the app.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Children's Privacy</h2>
            <p>Zenka is not intended for users under 18 years of age. We do not knowingly collect information from children under 18.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. We will notify you of significant changes through the app or via email.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Contact Us</h2>
            <p>If you have questions about this privacy policy or your data, contact us:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: support@zenka.co.ke</li>
              <li>In-app support chat</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
