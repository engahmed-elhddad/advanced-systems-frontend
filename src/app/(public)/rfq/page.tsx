"use client";

import { useEffect, useState } from "react";
import { submitRFQ } from "@/lib/api";
import { trackLead } from "@/lib/analytics";

type RfqFormState = {
  part_number: string;
  quantity: string;
  name: string;
  company: string;
  email: string;
  message: string;
};

export default function RFQPage() {
  const [form, setForm] = useState<RfqFormState>({
    part_number: "",
    quantity: "1",
    name: "",
    company: "",
    email: "",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RfqFormState, string>>>({});
  const [step, setStep] = useState<1 | 2>(1);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const part = params.get("part_number") || params.get("part");
    const savedEmail = localStorage.getItem("rfq_email");
    const savedCompany = localStorage.getItem("rfq_company");
    setForm((prev) => ({
      ...prev,
      ...(part ? { part_number: part } : {}),
      ...(savedEmail ? { email: savedEmail } : {}),
      ...(savedCompany ? { company: savedCompany } : {}),
    }));
  }, []);

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validateStepOne(): boolean {
    const nextErrors: Partial<Record<keyof RfqFormState, string>> = {};
    if (!form.part_number.trim()) nextErrors.part_number = "Part number is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateStepTwo(): boolean {
    const nextErrors: Partial<Record<keyof RfqFormState, string>> = {};
    if (!form.quantity.trim() || Number(form.quantity) < 1) nextErrors.quantity = "Quantity must be at least 1.";
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    const valid = validateStepTwo();
    if (!valid) {
      setStatus("error");
      setErrorMsg("Please correct the highlighted fields.");
      return;
    }

    setStatus("loading");
    if (typeof window !== "undefined") {
      localStorage.setItem("rfq_email", form.email.trim());
      if (form.company.trim()) localStorage.setItem("rfq_company", form.company.trim());
    }
    try {
      await submitRFQ({
        part_number: form.part_number.trim(),
        quantity: Number(form.quantity) || 1,
        contact_name: form.name.trim() || "Customer",
        company: form.company.trim(),
        email: form.email.trim(),
        country: "Egypt",
        message: "",
      });
      trackLead({
        part_number: form.part_number.trim(),
        source: "rfq_form_submit",
        conversion_type: "rfq",
      });

      setStatus("success");
      setStep(1);
      setForm({
        part_number: "",
        quantity: "1",
        name: "",
        company: "",
        email: "",
        message: "",
      });
    } catch {
      setStatus("error");
      setErrorMsg("Failed to submit request. Please try again.");
    }
  }

  return (
    <div className="page-container py-10">
      <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Get Price in 2 Hours</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Step {step} of 2 {step === 1 ? "— start with part number and email" : "— add details"}
        </p>

        {status === "success" && (
          <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Request submitted successfully
          </p>
        )}

        {status === "error" && errorMsg && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label htmlFor="part_number" className="mb-1 block text-sm font-medium text-gray-700">
                  Part Number *
                </label>
                <input
                  id="part_number"
                  name="part_number"
                  type="text"
                  required
                  placeholder="e.g. 6ES7-214-1AG40-0XB0"
                  value={form.part_number}
                  onChange={onChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                {fieldErrors.part_number && <p className="mt-1 text-xs text-red-600">{fieldErrors.part_number}</p>}
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={onChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!validateStepOne()) {
                    setStatus("error");
                    setErrorMsg("Please correct the highlighted fields.");
                    return;
                  }
                  setErrorMsg("");
                  setStatus("idle");
                  setStep(2);
                }}
                className="w-full rounded-md bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-gray-700">
                  Quantity *
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  required
                  value={form.quantity}
                  onChange={onChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                {fieldErrors.quantity && <p className="mt-1 text-xs text-red-600">{fieldErrors.quantity}</p>}
              </div>

              <div>
                <label htmlFor="company" className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                  Company <span className="text-[#9CA3AF]">(optional)</span>
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="Company name"
                  value={form.company}
                  onChange={onChange}
                  className="w-full rounded-[2px] border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:border-[#0072CE] focus:ring-1 focus:ring-[#0072CE]/20"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setStatus("idle");
                    setErrorMsg("");
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full rounded-[2px] bg-[#0072CE] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005BA4] disabled:opacity-60 transition-colors duration-150"
                >
                  {status === "loading" ? "Submitting..." : "Get Price in 2 Hours"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
