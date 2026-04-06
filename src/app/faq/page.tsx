import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FAQ — Industrial Automation Parts Questions Answered',
  description: 'Frequently asked questions about ordering industrial automation parts, RFQ process, shipping, and technical support from Advanced Systems.',
  alternates: { canonical: 'https://www.advancedsystems-int.com/faq' },
}

const FAQS = [
  {
    question: 'How do I request a quote for a part?',
    answer:
      'Click the "Get Price" button on any product page, or submit an RFQ through our quote request form. You can also search for a part number, and if we don\'t list it yet, you can request pricing directly from the results page.',
  },
  {
    question: 'How fast will I get a response?',
    answer:
      'We typically respond to RFQs within 2–4 hours during business days. Complex or hard-to-source parts may take up to 24 hours.',
  },
  {
    question: 'Do you sell genuine parts only?',
    answer:
      'Yes. We source all parts from authorized distributors and verified suppliers. Every component is checked for authenticity before shipping.',
  },
  {
    question: 'Which brands do you supply?',
    answer:
      'We supply parts from major industrial automation manufacturers including Siemens, ABB, Schneider Electric, Omron, Mitsubishi, SICK, IFM, Pilz, Delta, and many more.',
  },
  {
    question: 'Do you ship internationally?',
    answer:
      'Yes. We ship worldwide. Delivery times vary by destination — typically 3–7 business days for most locations. We provide tracking for all shipments.',
  },
  {
    question: 'Can I request a part that isn\'t listed on your website?',
    answer:
      'Absolutely. If you search for a part and we don\'t list it, you\'ll see an option to request pricing anyway. We source from a wide network and can find most industrial automation parts.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept bank wire transfers, and can discuss other payment options based on order size and destination. Payment details are provided with each quote.',
  },
  {
    question: 'Do you offer quantity discounts?',
    answer:
      'Yes. Pricing is competitive by default, and we offer additional volume discounts for larger orders. Submit an RFQ with your required quantities for the best pricing.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'We accept returns for defective or incorrect parts within 30 days of delivery. Contact us with your order reference and we\'ll arrange a return or replacement.',
  },
  {
    question: 'How can I contact your team?',
    answer:
      'You can reach us via email at eng.ahmed@advancedsystems-int.com, by phone at +20 100 062 9229, or through WhatsApp using the floating button on every page.',
  },
]

export default function FAQPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] tracking-tight mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-[#6B7280] mb-12">
          Common questions about ordering industrial automation parts from Advanced Systems.
        </p>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <details
              key={idx}
              className="group rounded-[2px] border border-[#E5E7EB] bg-white shadow-sm transition-shadow duration-150 hover:shadow-md"
            >
              <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-[#1A1A1A] font-medium text-sm select-none">
                <span>{faq.question}</span>
                <svg
                  className="w-4 h-4 text-[#6B7280] shrink-0 ml-4 transition-transform duration-150 group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-4 text-sm text-[#6B7280] leading-relaxed border-t border-[#F3F4F6]">
                <p className="pt-3">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-16 rounded-[2px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Still have questions?</h2>
          <p className="text-[#6B7280] mb-5">Our team is ready to help you find the right part.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white font-semibold text-sm shadow-sm transition-colors duration-150"
            >
              Contact Us
            </Link>
            <a
              href="https://wa.me/201000629229?text=Hello, I have a question about industrial parts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] font-medium text-sm hover:bg-[#F9FAFB] transition-colors duration-150"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  )
}
