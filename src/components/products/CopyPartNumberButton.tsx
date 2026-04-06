'use client';

import { Copy } from 'lucide-react';

export function CopyPartNumberButton({ partNumber }: { partNumber: string }) {
  return (
    <button
      type="button"
      title="Copy part number"
      onClick={() => void navigator.clipboard.writeText(partNumber)}
      className="text-gray-400 hover:text-secondary transition-colors"
    >
      <Copy className="w-5 h-5" />
    </button>
  );
}
