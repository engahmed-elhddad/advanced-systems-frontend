import { SlidersHorizontal } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="admin-card-lg">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
        <SlidersHorizontal className="admin-icon" />
        Settings
      </h1>
      <p className="mt-2 text-sm text-slate-500">Placeholder for admin settings.</p>
    </div>
  );
}
