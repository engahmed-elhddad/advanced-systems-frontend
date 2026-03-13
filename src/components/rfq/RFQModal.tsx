"use client";
import { useState } from "react";
import { submitRFQ } from "@/lib/api";

interface RFQModalProps {
  product: any;
  onClose: () => void;
}

export function RFQModal({ product, onClose }: RFQModalProps) {
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitRFQ({
        part_number: product?.part_number ?? product?.id ?? "",
        quantity: 1,
        company,
        contact_name: name,
        email,
        country: "US",
        message,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? "Failed to submit RFQ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-white text-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-2">
          Request a quote for {product?.part_number ?? product?.name}
        </h2>
        {success ? (
          <div className="space-y-4">
            <p>Your request has been sent. We will contact you shortly.</p>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Contact name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <textarea
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Message (optional)"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send RFQ"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

