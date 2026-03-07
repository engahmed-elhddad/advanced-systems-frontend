import "./globals.css"
import Link from "next/link"
import SearchBar from "@/components/SearchBar"


export const metadata = {
  title: "Advanced Systems | Industrial Automation Supplier Egypt",

  description:
    "Industrial Trading & Automation Solutions. New, Refurbished & Tested Equipment.",

  verification:{
    google:"2gJzgVPjoS0mwS4tHz3w6TmaMWAQFxY_GDZ7pg1Gkog",
  },

  openGraph:{
    title:"Advanced Systems",
    description:"Industrial Automation Supplier Egypt",
    url:"https://advancedsystems-int.com",
    siteName:"Advanced Systems",
    type:"website"
  }

}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Advanced Systems",
  "url": "https://advancedsystems-int.com",
  "logo": "https://advancedsystems-int.com/logo.png",
  "email": "eng.ahmed@advancedsystems-int.com",
  "telephone": "+201000629229",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "EG",
    "addressLocality": "10th of Ramadan City"
  }
}

  return (
    <html lang="en">
      <body className="bg-gray-100">

        {/* SEO ORGANIZATION SCHEMA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema)
          }}
        />

        {/* 🔷 NAVBAR */}
        <nav className="bg-gray-900 text-white px-8 py-4 flex justify-between items-center shadow-lg">

          <Link href="/" className="text-2xl font-bold tracking-wide">
            Advanced Systems
          </Link>

          <SearchBar />

          <div className="flex gap-8 text-sm items-center">

            <Link href="/" className="hover:text-blue-400">
              Home
            </Link>

            <Link href="/product/315-2AH14-0AB0" className="hover:text-blue-400">
              Sample Product
            </Link>

            <Link href="#" className="hover:text-blue-400">
              Contact
            </Link>

            <a
              href="mailto:eng.ahmed@advancedsystems-int.com"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
            >
              RFQ
            </a>

          </div>
        </nav>

        {/* 🔷 PAGE CONTENT */}
        {children}

        {/* 🔷 FOOTER */}
        <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">

            <div>
              <h3 className="text-white font-semibold mb-4">
                Advanced Systems
              </h3>
              <p>
                Industrial Trading & Automation Company  
                10th of Ramadan City – Egypt
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">
                Services
              </h3>
              <p>New Equipment</p>
              <p>Refurbished & Certified</p>
              <p>Industrial Sourcing</p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">
                Contact
              </h3>
              <p>Email: eng.ahmed@advancedsystems-int.com</p>
              <p>Phone: 01000629229</p>
              <p>Website: advancedsystems-int.com</p>
            </div>

          </div>

          <div className="text-center text-xs mt-10 text-gray-600">
            © 2026 Advanced Systems . All Rights Reserved.
          </div>
        </footer>

      </body>
    </html>
  )
}