import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Refund and Cancellation Policy - HomeXpert",
  description: "Learn about HomeXpert's refund and cancellation policy for services and bookings",
}

const policyContent = {
  title: "Refund and Cancellation Policy",
  subtitle: "",
  effectiveDate: "2025-07-02",
  sections: [
    {
      type: "intro",
      content: "This Refund and Cancellation Policy outlines the conditions under which refunds may be granted by HomesXpert Services Pvt. Ltd. (\"HomesXpert,\" \"we,\" \"us,\" or \"our\")."
    },
    {
      type: "section",
      title: "1. General Policy",
      content: "Refunds are issued solely at the discretion of HomesXpert and are governed by our Terms of Use. All refunds are processed as wallet credits to your HomesXpert account, which can be used for future services. Refunds to original payment methods are not supported unless explicitly stated."
    },
    {
      type: "section",
      title: "2. What Qualifies for a Refund",
      content: "You may be eligible for a refund in the following scenarios:",
      list: [
        "Service Mismatch: If a customer books a service (e.g., home cleaning) but later switches to a completely unrelated one (e.g., electrical work)",
        "Location Mismatch: If the customer's location changes and is outside your serviceable area",
        "Duplicate Charges: If you are charged twice for the same lead or booking within 7 days"
      ],
      afterList: "Refund requests must be submitted within 3 days of the original charge."
    },
    {
      type: "section",
      title: "3. What Does Not Qualify for a Refund",
      content: "Refunds will not be issued in the following cases:",
      list: [
        "The customer chooses not to proceed with the service",
        "No outcome or ROI from the service connection",
        "Service expectations are subjective or performance-related",
        "You failed to respond or follow up with the customer"
      ]
    },
    {
      type: "section",
      title: "4. How to Request a Refund",
      content: "To request a refund:",
      list: [
        "Log into your HomesXpert Partner account",
        "Go to the Wallet or Lead Detail page",
        "Submit your refund request with full details within 3 days"
      ]
    },
    {
      type: "section",
      title: "5. Refund Processing",
      list: [
        "Refunds are typically reviewed within 1–2 business days",
        "In rare cases, it may take up to 5 business days for resolution",
        "Approved refunds will be credited to your HomesXpert Wallet"
      ]
    },
    {
      type: "section",
      title: "6. Discretionary Review",
      content: "Each request is reviewed case-by-case. HomesXpert reserves the right to approve or deny any refund based on the circumstances provided."
    },
    {
      type: "section",
      title: "7. Final Authority",
      content: "In the event of a conflict between this policy and the Terms of Use, the Terms of Use shall prevail."
    },
    {
      type: "contact",
      content: "For any questions, contact: support@homesxpert.in"
    },
    {
      type: "footer",
      content: "2025 HomesXpert. All rights reserved."
    }
  ]
}

export default function RefundPolicyPage() {
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
                    </div>
                  )}

                  {section.type === "contact" && (
                    <div className="bg-card p-6 rounded-lg border">
                      <p className="text-text-secondary leading-relaxed">
                        {section.content}
                      </p>
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