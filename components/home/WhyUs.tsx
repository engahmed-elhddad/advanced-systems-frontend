import { Shield, Clock, Globe, Headphones } from 'lucide-react'

const features = [
  { icon: Shield, title: 'Verified Suppliers', desc: 'All suppliers vetted for quality and reliability.' },
  { icon: Clock, title: 'Fast Quotes', desc: 'Get competitive pricing within 24 hours.' },
  { icon: Globe, title: 'Global Shipping', desc: 'Delivery to 80+ countries worldwide.' },
  { icon: Headphones, title: 'Expert Support', desc: 'Technical assistance from industry specialists.' },
]

export function WhyUs() {
  return (
    <section>
      <h2 className="section-title text-center mb-10">Why Choose Advanced Systems</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card p-6 text-center group">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
              <Icon className="w-7 h-7 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
