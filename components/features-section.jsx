import { CheckCircle, Clock, Shield, Star, Truck, Users } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: <Star className="h-10 w-10 text-primary" />,
      title: "Quality Service",
      description: "All our vendors are vetted professionals with proven track records of excellence.",
    },
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "Fast Response",
      description: "Get quick responses and service scheduling that fits your timeline.",
    },
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: "Secure Booking",
      description: "Our platform ensures secure transactions and protected personal information.",
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-primary" />,
      title: "Verified Professionals",
      description: "Every vendor is thoroughly verified with proper documentation and background checks.",
    },
    {
      icon: <Truck className="h-10 w-10 text-primary" />,
      title: "On-time Service",
      description: "Our professionals arrive on schedule, respecting your time and commitments.",
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Customer Support",
      description: "Dedicated support team available to assist with any questions or concerns.",
    },
  ]

  return (
    <section className="py-20 bg-muted" id="about">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-white">Why Choose Us</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Features that Make Us Different</h2>
            <p className="max-w-[900px] text-text-secondary md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              HomeXpert provides a seamless experience connecting you with the best home service professionals.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card flex flex-col items-center space-y-2 rounded-lg border bg-card p-6 text-center shadow-sm transition-all duration-200"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
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
