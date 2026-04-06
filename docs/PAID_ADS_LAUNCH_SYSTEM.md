# Paid Ads Lead Generation System

This playbook defines a launch-ready Meta Ads + Google Ads system for generating RFQ and WhatsApp leads for industrial products.

## 1) Meta Ads Campaign Structure

- **Campaign**
  - Objective: `Leads` (Messages / WhatsApp)
  - Name: `ME-Industrial-Leads-Core`

- **Ad Sets**
  - `AS-PLC-EG+ME`
  - `AS-Sensors-EG+ME`
  - `AS-Drives-EG+ME`

- **Geo**
  - Egypt + Middle East countries relevant to your sales coverage

- **Interests**
  - Industrial automation
  - PLC
  - Siemens
  - Schneider Electric

- **Primary Creative**
  - Headline: `Need Industrial Spare Parts Fast?`
  - Text: `Get original PLCs, sensors, and drives with fast delivery.`
  - CTA: `Send Message` (WhatsApp destination)

## 2) Google Ads Search Structure

- **Campaign**
  - Name: `Search-HighIntent-IndustrialParts-EG`
  - Bidding: Start with Maximize Conversions (after tracking validation)

- **Ad Groups**
  - `PLC`
  - `Sensors`
  - `Automation Supplier`

- **Core Keywords**
  - `buy Siemens PLC Egypt`
  - `industrial sensors supplier`
  - `PLC supplier Egypt`
  - `automation parts supplier`

- **RSA Copy**
  - Headline: `Buy Industrial Parts Fast | RFQ in Minutes`
  - Description: `Original PLCs, sensors, drives. Fast sourcing and global delivery.`
  - CTA: `Request Quote`

## 3) Landing Page Requirements (Already wired in app)

- Product pages have:
  - **Request Quote** CTA
  - **WhatsApp** CTA
  - trust indicators + product details
- Tracking events are instrumented for:
  - page visits
  - product views
  - quote clicks
  - WhatsApp clicks

## 4) Retargeting Audiences

Build these audiences in Meta and Google:

- **Product Viewers (No Lead)**
  - Include: `ViewContent` / `product_view`
  - Exclude: `Lead` / conversion

- **CTA Clicked (No RFQ submit)**
  - Include: `quote_click` or `whatsapp_click`
  - Exclude: `Lead` conversion

- **Remarketing Ads**
  - Reminder messaging: fast sourcing + delivery
  - WhatsApp quick-contact creatives

## 5) Conversion Tracking (Implemented)

Frontend conversion tracking is connected in `src/lib/analytics.ts`:

- Meta Pixel:
  - `Lead` event on RFQ lead actions
  - `Contact` event on WhatsApp click
  - `ViewContent` on product view

- Google Ads / gtag:
  - `generate_lead` + optional conversion `send_to`
  - WhatsApp conversion with optional `send_to`
  - `view_item` on product view

Backend analytics event API receives first-party event logs:

- `POST /api/v1/analytics/event`
- types: `visit`, `product_view`, `quote_click`, `whatsapp_click`

## 6) Environment Variables (Set before launch)

Add these to frontend runtime env:

- `NEXT_PUBLIC_FB_PIXEL_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL`
- `NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL`

## 7) Budget and Scaling

- Start:
  - Meta: `$5–10/day`
  - Google: `$5–10/day`
- First scale trigger:
  - after first stable conversions and acceptable CPL
- Scale method:
  - increase best ad set/group budgets by 20-30% every 48-72h

## 8) Launch Checklist

- [ ] Pixel helper confirms Meta events (`PageView`, `ViewContent`, `Lead`, `Contact`)
- [ ] Google tag assistant confirms `generate_lead` and conversion events
- [ ] RFQ form submit fires lead event
- [ ] WhatsApp CTA click fires WhatsApp conversion event
- [ ] UTM parameters appear in event payloads
- [ ] `/admin/analytics` shows rising visits/views/clicks

This system is now technically ready for campaign launch and optimization loops.
