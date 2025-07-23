import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Privacy Policy - HomeXpert",
  description: "Learn about how HomeXpert protects your personal data and respects your privacy",
}

const policyContent = {
  title: "Privacy Policy",
  subtitle: "Protecting Your Personal Data",
  effectiveDate: "2025-07-15",
  sections: [
    {
      type: "intro",
      content: "HomesXpert Services Pvt. Ltd. (\"HomesXpert\", \"we\", \"our\", \"us\") is committed to safeguarding your personal data and respecting your privacy. This Privacy Policy (\"Policy\") outlines how we collect, use, store, and disclose personal data when you access or use our website www.homesxpert.in or mobile application (\"Platform\") or any products or services offered on the Platform (\"Services\")."
    },
    {
      type: "section",
      title: "1. How This Policy Applies",
      content: "This Policy applies to individuals who use the Platform to access Services. By using the Platform, you consent to the collection, storage, usage, and disclosure of your personal data in accordance with this Policy."
    },
    {
      type: "section",
      title: "2. Personal Data We Collect",
      content: "We may collect the following categories of personal data:",
      list: [
        "Contact Data: Name, phone number, email, address",
        "Profile Data: Username, photos, location, preferences",
        "Usage Data: Platform activity, clicks, pages viewed, time spent",
        "Technical Data: IP address, browser type, device details",
        "Communications Data: Call/chat history, feedback, survey responses"
      ],
      afterList: "We also collect aggregated data (non-identifiable) for analytics and improvements."
    },
    {
      type: "section",
      title: "3. How We Collect Personal Data",
      content: "We collect data through:",
      list: [
        "Direct interactions (account creation, form submissions, feedback)",
        "Automated means (cookies, tracking tools)",
        "Third-party integrations (advertising, analytics partners)"
      ]
    },
    {
      type: "section",
      title: "4. How We Use Your Personal Data",
      content: "We use your data to:",
      list: [
        "Register and manage your account",
        "Provide and improve Services",
        "Enable communication with service professionals",
        "Track and process transactions",
        "Send updates, alerts, offers, or feedback forms",
        "Comply with legal obligations",
        "Improve security, functionality, and marketing"
      ],
      afterList: "You agree that we may contact you through phone, email, or messaging for service and communication purposes."
    },
    {
      type: "section",
      title: "5. Sharing of Personal Data",
      content: "Your personal data may be shared with:",
      list: [
        "Verified service professionals",
        "Internal affiliates and teams",
        "Trusted external vendors (hosting, payments, marketing)",
        "Legal authorities when required"
      ],
      afterList: "We ensure third-party partners treat your data securely and lawfully."
    },
    {
      type: "section",
      title: "6. Cookies and Tracking",
      content: "We use cookies and related technologies to:",
      list: [
        "Save user preferences",
        "Understand usage behavior",
        "Improve user experience and features"
      ],
      afterList: "You can manage cookie settings via your browser."
    },
    {
      type: "section",
      title: "7. Your Rights",
      list: [
        "Access and Correct: You may access or update your data anytime",
        "Opt-Out: Unsubscribe from marketing communications anytime",
        "Account Deletion: Request account deletion via support@homesxpert.in. We may retain limited data to comply with law"
      ]
    },
    {
      type: "section",
      title: "8. Data Transfers",
      content: "Your data may be processed outside your country of residence, but will be protected under appropriate safeguards as per applicable data protection laws."
    },
    {
      type: "section",
      title: "9. Data Security",
      content: "We implement robust security measures including encryption, masking, and secure storage. You are responsible for keeping your password confidential."
    },
    {
      type: "section",
      title: "10. Data Retention",
      content: "We retain your data as long as necessary to deliver services or fulfill legal obligations. We may anonymize and retain certain information for research and analytics."
    },
    {
      type: "section",
      title: "11. User-Generated Content",
      content: "Content you post publicly (reviews, comments) is visible to other users and may be reused. Please post responsibly."
    },
    {
      type: "section",
      title: "12. Business Transfers",
      content: "In case of merger, acquisition, or asset transfer, your data may be transferred to a successor entity."
    },
    {
      type: "section",
      title: "13. Policy Updates",
      content: "We may periodically revise this Policy. Continued use of the Platform constitutes your acceptance of the updated Policy."
    },
    {
      type: "section",
      title: "14. Grievance Redressal",
      content: "For privacy-related queries or complaints, contact:",
      contact: {
        title: "Grievance Officer",
        email: "support@homesxpert.in"
      }
    },
    {
      type: "footer",
      content: "2025 HomesXpert. All rights reserved."
    }
  ]
}

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl">
                {policyContent.title}
              </h1>
              <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                {policyContent.subtitle}
              </p>
              <p className="text-sm text-text-secondary">
                Effective Date: {policyContent.effectiveDate}
              </p>
            </div>
          </div>
        </section>

        {/* Policy Content */}
        <section className="py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {policyContent.sections.map((section, index) => (
                <div key={index} className="space-y-4">
                  {section.type === "intro" && (
                    <div className="bg-card p-6 rounded-lg border">
                      <p className="text-text-secondary leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  )}

                  {section.type === "section" && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold text-foreground">
                        {section.title}
                      </h2>
                      {section.content && (
                        <p className="text-text-secondary leading-relaxed">
                          {section.content}
                        </p>
                      )}
                      {section.list && (
                        <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                          {section.list.map((item, idx) => (
                            <li key={idx} className="leading-relaxed">{item}</li>
                          ))}
                        </ul>
                      )}
                      {section.afterList && (
                        <p className="text-text-secondary leading-relaxed">
                          {section.afterList}
                        </p>
                      )}
                      {section.contact && (
                        <div className="bg-card p-4 rounded-lg border">
                          <p className="font-medium">{section.contact.title}</p>
                          <p className="text-primary">{section.contact.email}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {section.type === "footer" && (
                    <div className="text-center pt-8 border-t">
                      <p className="text-text-secondary">
                        {section.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
} 