import Link from "next/link"

export const metadata = {
  title: "Suppliers | Advanced Systems – Industrial Automation",
  description: "Our trusted network of verified industrial automation suppliers and distributors worldwide.",
}

const SUPPLIERS = [
  {
    name: "Advanced Systems International",
    country: "Egypt",
    flag: "🇪🇬",
    specialties: ["Siemens", "ABB", "Schneider Electric", "Omron"],
    website: "https://advancedsystems-int.com",
    verified: true,
    description: "Leading industrial automation distributor in Egypt and the Middle East region.",
  },
  {
    name: "Global Automation Partners",
    country: "UAE",
    flag: "🇦🇪",
    specialties: ["Pilz", "SICK", "IFM", "Balluff"],
    website: "#",
    verified: true,
    description: "Specialist in safety systems and industrial sensors across the Gulf region.",
  },
  {
    name: "Tech Motion Solutions",
    country: "Saudi Arabia",
    flag: "🇸🇦",
    specialties: ["Mitsubishi", "Delta", "Lenze", "KEB"],
    website: "#",
    verified: true,
    description: "Expert distributor for drives, servo systems and motion control equipment.",
  },
]

export default function SuppliersPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Hero */}
      <div className="border-b border-[#1e2d4f] bg-gradient-to-br from-[#0f1629] to-[#0a0f1a] py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <span className="inline-flex items-center gap-2 text-sky-400 text-sm font-medium uppercase tracking-widest mb-4">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Supplier Network
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Trusted Industrial Suppliers</h1>
          <p className="text-slate-400 max-w-2xl">
            Our verified network of industrial automation suppliers ensures you receive genuine, quality-assured parts with competitive pricing and fast delivery.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: "🔒", title: "Verified Suppliers", desc: "All suppliers undergo rigorous verification for authenticity and quality standards" },
            { icon: "🚀", title: "Fast Sourcing", desc: "Global network enables rapid part sourcing even for discontinued or rare items" },
            { icon: "💰", title: "Competitive Pricing", desc: "Multiple supplier relationships allow us to offer the best market pricing" },
          ].map(b => (
            <div key={b.title} className="rounded-xl border border-[#1e2d4f] bg-[#0f1629] p-5">
              <span className="text-2xl mb-2 block">{b.icon}</span>
              <h3 className="text-sm font-semibold text-white mb-1">{b.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Supplier cards */}
        <h2 className="text-xl font-bold text-white mb-5">Our Supplier Network</h2>
        <div className="space-y-4 mb-12">
          {SUPPLIERS.map(s => (
            <div key={s.name} className="rounded-xl border border-[#1e2d4f] bg-[#0f1629] p-6 flex flex-col sm:flex-row gap-5 hover:border-sky-500/30 transition">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{s.flag}</span>
                  <div>
                    <h3 className="font-semibold text-white text-base flex items-center gap-2">
                      {s.name}
                      {s.verified && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">VERIFIED</span>
                      )}
                    </h3>
                    <span className="text-xs text-slate-500">{s.country}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-3">{s.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.specialties.map(sp => (
                    <span key={sp} className="text-xs px-2 py-0.5 rounded-full border border-[#2a3a5c] text-slate-400">{sp}</span>
                  ))}
                </div>
              </div>
              {s.website !== "#" && (
                <a
                  href={s.website}
                  target="_blank"
                  rel="noreferrer"
                  className="self-start sm:self-center px-4 py-2 rounded-lg border border-sky-500/30 text-sky-400 text-sm font-medium hover:bg-sky-500/10 transition whitespace-nowrap"
                >
                  Visit Website →
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Become a supplier CTA */}
        <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-900/20 to-[#0f1629] p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Become a Supplier</h2>
          <p className="text-slate-400 mb-5 max-w-md mx-auto">
            Are you an authorized distributor or manufacturer? Join our supplier network to reach industrial buyers across the Middle East.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition"
          >
            Contact Us to Join →
          </Link>
        </div>
      </div>
    </div>
  )
}
