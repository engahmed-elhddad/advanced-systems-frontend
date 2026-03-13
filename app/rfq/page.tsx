"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { submitRFQ } from "@/lib/api"

export default function RFQPage() {
  const searchParams = useSearchParams()
  const [form, setForm] = useState({
    part_number: searchParams?.get("part_number") || searchParams?.get("part") || "",
    quantity: "1",
    company: "",
    contact_name: "",
    email: "",
    country: "",
    message: "",
  })

  useEffect(() => {
    const part = searchParams?.get("part_number") || searchParams?.get("part")
    if (part) setForm((f) => ({ ...f, part_number: part }))
  }, [searchParams])
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")
    try {
      await submitRFQ({
        part_number: form.part_number,
        quantity: Number(form.quantity) || 1,
        company: form.company,
        contact_name: form.contact_name || form.company || "Customer",
        email: form.email,
        country: form.country,
        message: form.message,
      })
      setStatus("success")
      setForm({ part_number: "", quantity: "1", company: "", contact_name: "", email: "", country: "", message: "" })
    } catch {
      setStatus("error")
      setErrorMsg("Failed to submit. Please email us at eng.ahmed@advancedsystems-int.com")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-gray-50 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-primary-600 text-sm font-semibold uppercase tracking-widest mb-4">
            Request For Quote
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Get a Fast Quote</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Can&apos;t find pricing? Need a specific quantity? Submit your RFQ and our team will respond within 24 hours with pricing and availability.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {status === "success" ? (
          <div className="rounded-2xl border border-primary-200 bg-primary-50 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 mx-auto mb-4">
              <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">RFQ Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">Our team will respond within 24 hours with pricing and lead time.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setStatus("idle")} className="btn-secondary">
                Submit Another RFQ
              </button>
              <Link href="/products" className="btn-primary">Browse Products</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 space-y-5 shadow-soft">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Part Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="part_number">
                    Part Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="part_number" name="part_number" type="text" required
                    value={form.part_number} onChange={handleChange}
                    placeholder="e.g. 6ES7318-3EL01-0AB0"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="quantity">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="quantity" name="quantity" type="number" required min="1"
                    value={form.quantity} onChange={handleChange} placeholder="1"
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 space-y-5 shadow-soft">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="company">Company Name</label>
                  <input id="company" name="company" type="text" value={form.company} onChange={handleChange} placeholder="Your company" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="contact_name">Contact Name</label>
                  <input id="contact_name" name="contact_name" type="text" value={form.contact_name} onChange={handleChange} placeholder="Your name" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@company.com" className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="country">Country</label>
                <select id="country" name="country" value={form.country} onChange={handleChange} className="input">
                  <option value="">Select country…</option>
                  {["Egypt","Saudi Arabia","UAE","Kuwait","Qatar","Bahrain","Oman","Jordan","Libya","Algeria","Morocco","Tunisia","Other"].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="message">Additional Notes</label>
                <textarea
                  id="message" name="message" rows={4}
                  value={form.message} onChange={handleChange}
                  placeholder="Condition (new/used), urgency, target price…"
                  className="input resize-none"
                />
              </div>
            </div>

            {status === "error" && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</div>
            )}

            <button type="submit" disabled={status === "loading"} className="btn-primary w-full py-3.5">
              {status === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting…
                </span>
              ) : "Submit RFQ Request"}
            </button>

            <p className="text-center text-xs text-gray-500">
              Or contact us via{" "}
              <a href="mailto:eng.ahmed@advancedsystems-int.com" className="text-primary-600 hover:underline font-medium">email</a>
              {" "}or{" "}
              <a href="https://wa.me/201000629229" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline font-medium">WhatsApp</a>
            </p>
          </form>
        )}

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "⚡", title: "Fast Response", desc: "We respond to all RFQs within 24 hours" },
            { icon: "🌍", title: "Global Sourcing", desc: "Parts sourced from verified suppliers worldwide" },
            { icon: "✅", title: "Quality Assured", desc: "All parts verified for authenticity & quality" },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-soft">
              <span className="text-2xl mb-2 block">{item.icon}</span>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-xs text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
