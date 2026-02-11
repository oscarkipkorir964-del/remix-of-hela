import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileCheck, ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-soft py-8 px-4">
      <div className="container max-w-3xl mx-auto">
        <Card className="shadow-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Terms & Conditions</CardTitle>
            <CardDescription>
              Zenka Service Agreement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-6 rounded-xl max-h-[70vh] overflow-y-auto space-y-6 text-sm">
              
              {/* Header */}
              <div className="text-center border-b border-border pb-4">
                <h3 className="font-bold text-lg">ZENKA</h3>
                <p className="text-muted-foreground">P.O BOX 30834-0100, NAIROBI, KENYA</p>
                <p className="text-muted-foreground">+254 755 440 358</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg">TERMS AND CONDITIONS OF LOANS – Zenka Kenya</h3>
                <p className="text-muted-foreground">
                  Terms and Conditions for the Opening and Use of a Loan Account with Zenka, Kenya.
                </p>
              </div>

              {/* Preamble */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">WHEREAS</h4>
                <p className="text-muted-foreground">
                  This Agreement is a financial service and an end-user licence agreement between you ("End-user" or "you" or "Borrower") and Zenka, a company incorporated under the laws of the Republic of Kenya (hereinafter called "Zenka" or "Lender" or "us" or "we").
                </p>
                <p className="text-muted-foreground">
                  This Agreement (together with our Privacy Policy) sets out the complete terms and conditions (the "Terms and Conditions") which shall be applicable to the Account opened by you with Zenka.
                </p>
                <p className="text-muted-foreground">
                  These Terms and Conditions and any amendments or variations thereto take effect on their date of publication.
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">1. DEFINITIONS AND INTERPRETATION</h4>
                
                <div className="space-y-2 pl-4">
                  <p className="text-muted-foreground"><strong>1.1 Definitions</strong></p>
                  <p className="text-muted-foreground">For the purposes of this Agreement, unless the context requires otherwise:</p>
                  
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li><strong>Agreement</strong> means this Agreement;</li>
                    <li><strong>Account</strong> means your loan account with Zenka;</li>
                    <li><strong>Business Day</strong> means a day other than a Saturday, Sunday or national or public holiday in the Republic of Kenya;</li>
                    <li><strong>Credentials</strong> means your personal credentials used to access the App and operate your Account;</li>
                    <li><strong>Credit Reference Bureau</strong> means a credit reference bureau duly licensed under the Banking Act pursuant to the Banking (Credit Reference Bureau) Regulations, 2013;</li>
                    <li><strong>E-Money</strong> means the electronic monetary value depicted in your Mobile Money Account representing an equal amount of cash;</li>
                    <li><strong>Equipment</strong> includes your mobile phone handset, SIM Card and/or other equipment which when used together enables you to access the Network;</li>
                    <li><strong>Force Majeure</strong> means events beyond reasonable control including acts of God, war, strikes, embargoes or government orders;</li>
                    <li><strong>Loan</strong> means the principal amount of the loan made by Zenka to you under this Agreement;</li>
                    <li><strong>Mobile Money Account</strong> means your M-Pesa or other mobile money store of value;</li>
                    <li><strong>Mobile Money Provider</strong> means a Mobile Network Operator authorized by the Central Bank of Kenya to offer Mobile Money Services;</li>
                    <li><strong>Network</strong> means a mobile cellular network operated by a Mobile Network Operator;</li>
                    <li><strong>Privacy Policy</strong> means the Zenka privacy policy;</li>
                    <li><strong>Request</strong> means a request or instruction received by Zenka from you through the System;</li>
                    <li><strong>Services</strong> shall include any form of financial services that Zenka may offer you;</li>
                    <li><strong>SIM Card</strong> means the subscriber identity module used with your mobile phone;</li>
                    <li><strong>SMS</strong> means a short message service text message;</li>
                    <li><strong>System</strong> means Zenka's electronic communications software;</li>
                    <li><strong>Transaction Fees</strong> includes any fees and charges payable for the use of the Services.</li>
                  </ul>

                  <p className="text-muted-foreground mt-3"><strong>1.2 Interpretation</strong></p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>The singular shall include the plural and vice versa;</li>
                    <li>A reference to any one gender includes the other two;</li>
                    <li>All headings are for convenience only and not for interpretation;</li>
                    <li>The recitals and schedules form part of this Agreement.</li>
                  </ul>
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">2. ACCEPTANCE OF TERMS AND CONDITIONS</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>2.1 You must carefully read and understand these Terms and Conditions before downloading the App or opening an account with Zenka.</p>
                  <p>2.2 After downloading the App, you will be deemed to accept the Terms and Conditions upon clicking the "Accept" option. If you do not agree, please click "Decline" - you will not be able to access the Services.</p>
                  <p>2.3 By downloading the App and opening an Account, you agree to comply with and be bound by these Terms and Conditions.</p>
                  <p>2.4 These Terms and Conditions may be amended by Zenka from time to time. Continued use constitutes your agreement to any amendments.</p>
                  <p>2.5 Updates to the App may be issued from time to time. You may need to download the latest version to continue using the Services.</p>
                  <p>2.6 By using the App, you consent to us collecting and using technical information about your Equipment for improving our products and services.</p>
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">3. GRANT AND SCOPE OF LICENCE</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>3.1 We grant you a non-transferable, non-exclusive licence to use the App on your Equipment, subject to these Terms. You agree:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Not to rent, lease, sub-license, loan, translate, merge, adapt, vary or modify the App;</li>
                    <li>Not to make alterations to the whole or any part of the App;</li>
                    <li>Not to disassemble, decompile, reverse-engineer or create derivative works;</li>
                    <li>Not to provide the App to any person without prior written consent;</li>
                    <li>To comply with all technology control or export laws and regulations.</li>
                  </ul>
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">4. LICENCE RESTRICTIONS</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>4.1 You must:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Not use the App in any unlawful manner or for any unlawful purpose;</li>
                    <li>Not infringe our intellectual property rights or those of any third party;</li>
                    <li>Not transmit any material that is defamatory, offensive or objectionable;</li>
                    <li>Not use the App in a way that could damage or compromise our systems;</li>
                    <li>Not collect or harvest any information from our systems.</li>
                  </ul>
                </div>
              </div>

              {/* Section 5 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">5. USE OF SERVICES AND PERSONAL INFORMATION</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p><strong>5.1 Intellectual Property Rights</strong></p>
                  <p>You acknowledge that all intellectual property rights in the App belong to us or our licensors. Rights in the App are licensed, not sold.</p>
                  
                  <p className="mt-3"><strong>5.2 Use of the Services</strong></p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>The Services can only be utilized by persons over the age of 18;</li>
                    <li>Zenka reserves the right to verify the authenticity of your Mobile Money Account;</li>
                    <li>Zenka reserves the right to decline your application at its sole discretion;</li>
                    <li>Zenka determines your maximum loan eligibility based on established assessment procedures;</li>
                    <li>Loan terms including interest rate will be displayed on the App.</li>
                  </ul>

                  <p className="mt-3"><strong>5.3 Personal Information</strong></p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>You authorize Zenka to verify information provided against Mobile Money Provider records;</li>
                    <li>Information verified includes phone number, name, date of birth, ID/Passport Number;</li>
                    <li>You authorize Zenka to access data from your Equipment and SMS messages;</li>
                    <li>You consent to Zenka obtaining your Personal Information from Mobile Money Providers;</li>
                    <li>You authorize Zenka to access and query your credit information from licensed CRBs;</li>
                    <li>Zenka may request further information at any time. Failure to provide may result in declined applications.</li>
                  </ul>
                </div>
              </div>

              {/* Section 6 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">6. REQUESTS MADE BY THE BORROWER</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>6.1 You irrevocably authorize Zenka to act on all Requests received from you through the System.</p>
                  <p>6.2 Zenka reserves the right to reject any Request at its discretion.</p>
                  <p>6.3 Zenka may act upon incomplete or ambiguous Requests if it believes it can correct the information.</p>
                  <p>6.4 Zenka shall be deemed to have acted properly even if the Request was sent in error or fraudulently.</p>
                  <p>6.5 Zenka may decline to act on any Request pending further enquiry.</p>
                  <p>6.6 You agree to indemnify Zenka against all claims arising from acting on your Requests.</p>
                  <p>6.7 Zenka shall not be liable for any unauthorized activity on your Account.</p>
                  <p>6.8 Zenka is authorized to comply with court orders or competent authority requirements.</p>
                </div>
              </div>

              {/* Section 7 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">7. SAVINGS, INTEREST AND FEES</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>7.1 A minimum savings balance of KES 500 is required before loan disbursement. Savings are withdrawable after your first loan has been repaid.</p>
                  <p>7.2 The interest payable shall be displayed on the App. Zenka may charge Transaction Fees which are subject to change.</p>
                  <p>7.3 All payments shall be made in full without any set off or counter claim.</p>
                  <p>7.4 If you fail to make payments at the due date, late payment charges will apply.</p>
                  <p>7.5 Zenka may approve loan extension requests subject to payment of accrued interest.</p>
                  
                  <p className="mt-3"><strong>7.6 Important Loan Information</strong></p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Loan Amount:</strong> The amount approved and communicated at the time of acceptance;</li>
                    <li><strong>Loan Charges:</strong> May include late payment interest. All charges are disclosed before disbursement;</li>
                    <li><strong>Interest Rate:</strong> Calculated on a flat rate basis as displayed on the App;</li>
                    <li><strong>Total Cost of Credit:</strong> Includes principal amount, interest, and any late payment fees;</li>
                    <li><strong>Annual Percentage Rate:</strong> Disclosed on the App reflecting the true cost of credit.</li>
                  </ul>

                  <p className="mt-3"><strong>7.7 Customer Complaints</strong></p>
                  <p>You may lodge complaints through:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Telephone: +254 755 440 358</li>
                    <li>Email: support@zenka.co.ke</li>
                  </ul>
                  <p>We shall acknowledge receipt within 48 hours and endeavor to resolve within 7 working days.</p>
                </div>
              </div>

              {/* Section 8 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">8. STATEMENTS</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>8.1 A statement and activity report will be made available on Request via email or the App.</p>
                  <p>8.2 The statement on the App shall provide details of your recent transactions.</p>
                  <p>8.3 You must check your statement carefully and notify Zenka of any discrepancies.</p>
                  <p>8.4 Zenka reserves the right to rectify discrepancies without prior notice.</p>
                  <p>8.5 You will be notified of all transactions by SMS.</p>
                </div>
              </div>

              {/* Section 9 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">9. TAXES</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>9.1 All payments are calculated without regard to taxes. If taxes are payable, you must pay an additional amount.</p>
                  <p>9.2 You consent to Zenka withholding amounts if required by any tax authority.</p>
                </div>
              </div>

              {/* Section 10 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">10. BORROWER'S RESPONSIBILITIES</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>10.1 You shall maintain your Equipment in safe and efficient operating order.</p>
                  <p>10.2 You shall be responsible for any errors caused by malfunction of your Equipment.</p>
                  <p>10.3 You shall follow all instructions and procedures provided by Zenka.</p>
                  <p>10.4 You shall be responsible for keeping your Credentials secret and secure.</p>
                  <p>10.5 You shall take all reasonable precautions to detect unauthorized use of the System.</p>
                  <p>10.6 You shall follow the security procedures notified by Zenka.</p>
                  <p>10.7 You shall not operate the Services in any manner prejudicial to Zenka.</p>
                </div>
              </div>

              {/* Section 11 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">11. DEFAULT ON LOAN</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>11.1 An Event of Default occurs when you:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Fail to pay any sum payable for 90 consecutive days;</li>
                    <li>Are declared bankrupt.</li>
                  </ul>
                  <p>11.2 After an Event of Default, Zenka may:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Terminate this Agreement;</li>
                    <li>Declare all amounts immediately due and payable;</li>
                    <li>Supply information to Credit Reference Bureaus.</li>
                  </ul>
                </div>
              </div>

              {/* Section 12 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">12. VARIATION AND TERMINATION</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>12.1 Zenka may terminate its relationship with you and close your Account at any time.</p>
                  <p>12.2 Zenka may suspend or close your Account if:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>You use the Account for unauthorized purposes or fraud;</li>
                    <li>Your agreement with a Mobile Network Operator is terminated;</li>
                    <li>Required by government, court, or regulatory order;</li>
                    <li>You breach these Terms and Conditions;</li>
                    <li>Technical problems or safety reasons require it;</li>
                    <li>Your Account becomes inactive or dormant;</li>
                    <li>Zenka decides to suspend Services for commercial reasons.</li>
                  </ul>
                  <p>12.3 If your Account has a credit balance from overpayment, you may request payment of such balance.</p>
                  <p>12.4 Termination shall not affect any accrued rights and liabilities.</p>
                </div>
              </div>

              {/* Section 13 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">13. EXCLUSION OF LIABILITY</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>13.1 Zenka shall not be responsible for any loss due to failure of your Equipment, Force Majeure, or circumstances beyond our control.</p>
                  <p>13.2 You acknowledge that the App has not been developed to meet your individual requirements.</p>
                  <p>13.3 We only supply the App for domestic and private use. We have no liability for loss of profit or business.</p>
                  <p>13.4 Zenka will not be liable for losses resulting from:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Defects from you altering the App;</li>
                    <li>Using the App in breach of this Agreement;</li>
                    <li>Breach of Licence or Acceptable Use Restrictions;</li>
                    <li>Unavailability of funds in your Mobile Money Account;</li>
                    <li>Failure of the System, Equipment, or Network;</li>
                    <li>Fraudulent or illegal use of the Services;</li>
                    <li>Your failure to comply with these Terms.</li>
                  </ul>
                  <p>13.5 Under no circumstances shall Zenka be liable for any loss of profit or indirect/consequential loss.</p>
                </div>
              </div>

              {/* Section 14 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">14. INDEMNITY</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>14.1 You undertake to indemnify Zenka against any loss, charge, damage, expense or claim which Zenka suffers from acting on your instructions.</p>
                  <p>14.2 The indemnity covers:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>All claims arising from acting on any Request or system failure;</li>
                    <li>Any loss from use of third-party software;</li>
                    <li>Unauthorized access to your Account or breach of security;</li>
                    <li>Loss from failure to adhere to these Terms;</li>
                    <li>Any damages where circumstances are within your control.</li>
                  </ul>
                </div>
              </div>

              {/* Section 15 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">15. COMMUNICATION BETWEEN US</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>15.1 You can contact us by email at support@zenka.co.ke.</p>
                  <p>15.2 We will contact you by email or SMS to the number you provided.</p>
                  <p>15.3 We may contact your emergency contact if you are unavailable.</p>
                </div>
              </div>

              {/* Section 16 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">16. GENERAL</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p><strong>16.1 Remedies Cumulative</strong></p>
                  <p>No failure to exercise any right shall operate as a waiver thereof.</p>
                  
                  <p className="mt-2"><strong>16.2 No Waiver</strong></p>
                  <p>No failure by Zenka to exercise any right shall operate as a waiver of such right.</p>
                  
                  <p className="mt-2"><strong>16.3 Effect of Invalidity</strong></p>
                  <p>If any provision is found invalid, it shall not affect other provisions which remain in full force.</p>
                </div>
              </div>

              {/* Section 17 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">17. ENTIRE AGREEMENT</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>17.1 These Terms and our Privacy Policy constitute the entire agreement between you and us.</p>
                  <p>17.2 You acknowledge that you do not rely on any statement not set out in these Terms.</p>
                  <p>17.3 Neither party shall have any claim for misrepresentation based on any statement in this Agreement.</p>
                </div>
              </div>

              {/* Section 18 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">18. DISPUTE RESOLUTION</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p><strong>18.1 Disputes</strong></p>
                  <p>The Parties shall use good faith efforts to resolve any dispute. Representatives shall meet and attempt to resolve any dispute. If not resolved within 30 days, arbitration shall apply.</p>
                  
                  <p className="mt-2"><strong>18.2 Arbitration</strong></p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Any dispute shall be referred to a single arbitrator;</li>
                    <li>Arbitration shall take place in Nairobi;</li>
                    <li>The determination shall be final and binding;</li>
                    <li>Nothing shall restrict either party from seeking preliminary injunctive relief.</li>
                  </ul>
                </div>
              </div>

              {/* Section 19 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">19. GOVERNING LAW</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>19.1 This Agreement shall be governed by and construed in accordance with the laws of Kenya.</p>
                </div>
              </div>

              {/* Section 20 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">20. PRIVACY POLICY</h4>
                <div className="space-y-2 pl-4 text-muted-foreground">
                  <p>20.1 We only use your personal information in accordance with our Privacy Policy.</p>
                  <p>20.2 Upon downloading the App and accepting these Terms, you will be deemed to have accepted our Privacy Policy.</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Contact Us:</strong><br />
                  Email: support@zenka.co.ke<br />
                  Phone: +254 755 440 358<br />
                  P.O Box 30834-0100, Nairobi, Kenya
                </p>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;