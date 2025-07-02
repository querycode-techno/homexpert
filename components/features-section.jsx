import { CheckCircle, Clock, Shield, Star, Truck, Users, Handshake } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: <Star className="h-10 w-10 text-primary text-yellow-800" />,
      title: "Verified & Vetted Xperts",
      description: "Get service from trusted, background-verified Xperts with proven skills and real experience.",
    },
    {
      icon: <Shield className="h-10 w-10 text-primary text-red-500" />,
      title: "Matched to Your Needs",
      description: "We connect you with tailored service options personalized to fit your exact requirements and preferences.",
    },
    {
      icon: <Handshake className="h-10 w-10 text-primary text-yellow-500" />,
      title: "Support at Every Step",
      description: "Enjoy seamless service and reliable support, from booking to completion we’re with you at every stage. Add this somewhere in the home page and about us page.",
    },
    // {
    //   icon: <CheckCircle className="h-10 w-10 text-primary text-blue-500" />,
    //   title: "Verified Professionals",
    //   description: "Every vendor is thoroughly verified with proper documentation and background checks.",
    // },
    // {
    //   icon: <Truck className="h-10 w-10 text-primary text-blue-500" />,
    //   title: "On-time Service",
    //   description: "Our professionals arrive on schedule, respecting your time and commitments.",
    // },
    // {
    //   icon: <Users className="h-10 w-10 text-primary text-blue-500" />,
    //   title: "Customer Support",
    //   description: "Dedicated support team available to assist with any questions or concerns.",
    // },
  ]

  return (
    <section className="py-20 bg-muted" id="about">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            {/* <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-xl font-bold text-yellow-500">Why Choose Us</div> */}
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-blue-500">Features that Make Us Different</h2>
            <p className="max-w-[900px] text-text-secondary md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            With over 5 years of experience, presence in 50+ cities across India, and a network of thousands of verified Xperts, HomesXpert makes finding the right home service professional easy and reliable.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card flex flex-col items-center space-y-2 rounded-lg border bg-card p-6 text-center shadow-sm transition-all duration-200"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-blue-900">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-text-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
