import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "HomesXpert Lead Subscription – Refund & Cancellation Policy - HomeXpert",
  description: "Learn about HomeXpert's lead subscription refund and cancellation policy for vendors and service professionals",
}

const policyContent = {
  title: "HomesXpert Lead Subscription – Refund & Cancellation Policy",
  subtitle: "",
  effectiveDate: "2025-07-15",
  lastUpdated: "2025-07-15",
  sections: [
    {
      type: "intro",
      content: "This policy outlines the conditions under which refunds may be considered for vendors or service professionals (\"you\" or \"vendor\") who subscribe to lead packages on HomesXpert.in (\"we,\" \"our,\" or \"the Company\")."
    },
    {
      type: "section",
      title: "1. Our Responsibility",
      content: "HomesXpert is responsible for providing contact details of potential customers who have shown genuine interest in the vendor's services and are located within the vendor's local service area. These are called valid leads.",
      afterContent: "We do not guarantee sales or conversions from the leads. Follow-up, rate discussion, and service closure are the sole responsibility of the vendor."
    },
    {
      type: "section",
      title: "2. Valid Leads (Eligible & Chargeable)",
      content: "A valid lead is defined as a customer who:",
      list: [
        "Has requested the type of service you offer (e.g., painter, plumber, carpenter, etc.)",
        "Resides in your registered or agreed service area.",
        "Has provided a working contact number that is reachable within 48 hours.",
        "Was generated within 72 hours of the customer showing interest."
      ]
    },
    {
      type: "section",
      title: "3. Invalid Leads (May Qualify for Replacement or Refund)",
      content: "You may report a lead as invalid if it meets any of the following:",
      list: [
        "Switched Off/Invalid Number: Number does not ring or stays off for more than 48 hours.",
        "Wrong Category: Lead asked for a completely different service you don't offer.",
        "Wrong Location: Lead is from an area you don't serve, outside your registered pin code.",
        "Duplicate/Fake: Repeated or spam entries with the same details.",
        "Customer Denial: Customer clearly states they never requested the service."
      ],
      afterList: "⚠ Note: Leads where the customer delays service or stops responding do not qualify as invalid."
    },
    {
      type: "section",
      title: "4. Refund Conditions",
      content: "We generally do not provide refunds, except in the rare case where HomesXpert fails to fulfill its responsibility to deliver valid leads as per the plan.",
      afterContent: "Refunds will be provided as wallet credits only, which can be used for future plans. Direct refunds to bank or UPI accounts are not issued."
    },
    {
      type: "section",
      title: "5. Plan Validity & Lead Carry Forward",
      list: [
        "By default, all lead plans are valid for 30 days from the date of activation.",
        "If longer validity or lead carry-forward is required, it must be mutually agreed before payment.",
        "Any unused or unclaimed leads will be carried forward to the next plan, only if this was pre-agreed."
      ]
    },
    {
      type: "section",
      title: "6. Refund Process",
      content: "We are confident in the quality of our leads. However, in the rare case that we are unable to provide the promised number of valid leads, the company may issue a partial refund after deducting applicable processing charges.",
      afterContent: "To request a refund or report invalid leads:",
      list: [
        "Drop a mail to support@homesxpert.in with the lead details and your concern."
      ],
      afterList: "Requests are reviewed within 2–5 working days and refunds, if approved, are issued as wallet credits."
    },
    {
      type: "section",
      title: "7. No Refund Scenarios",
      content: "Refunds will not be issued if:",
      list: [
        "The vendor fails to call or follow up promptly.",
        "The customer delays service, declines due to pricing, or changes their mind.",
        "Disputes arise after the service is completed.",
        "The vendor is unavailable or rejects the lead.",
        "The plan expires and lead quota is unused without prior carry-forward agreement."
      ]
    },
    {
      type: "section",
      title: "8. Final Decision",
      content: "All refund requests are reviewed on a case-by-case basis. The company reserves the right to accept or reject any claim. The decision of HomesXpert will be final and binding."
    },
    {
      type: "contact",
      content: "For support, contact us at support@homesxpert.in"
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
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                {policyContent.title}
              </h1>
              <div className="space-y-1">
                <p className="text-sm text-text-secondary">
                  Effective Date: {policyContent.effectiveDate}
                </p>
                <p className="text-sm text-text-secondary">
                  Last Updated: {policyContent.lastUpdated}
                </p>
              </div>
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
                      {section.afterContent && (
                        <p className="text-text-secondary leading-relaxed">
                          {section.afterContent}
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
                        <p className="text-text-secondary leading-relaxed font-medium">
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