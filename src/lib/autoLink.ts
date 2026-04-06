const LINK_RULES: Array<{ pattern: RegExp; href: string; label: string }> = [
  { pattern: /\bsiemens\b/gi, href: "/brand/siemens", label: "Siemens" },
  { pattern: /\bplc\b/gi, href: "/categories/plc", label: "PLC" },
  { pattern: /\bsensor(s)?\b/gi, href: "/categories/sensors", label: "Sensor" },
];

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function autoLink(text: string): string {
  const safe = escapeHtml(text || "");
  return LINK_RULES.reduce((current, rule) => {
    return current.replace(rule.pattern, (match) => {
      const label = match.trim() || rule.label;
      return `<a href="${rule.href}" class="text-[#0B1F3A] underline decoration-[#FF7A00] decoration-2 underline-offset-2 hover:text-[#FF7A00] transition-colors">${label}</a>`;
    });
  }, safe);
}
