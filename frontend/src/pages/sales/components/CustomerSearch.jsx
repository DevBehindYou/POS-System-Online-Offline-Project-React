// src/pages/sales/components/CustomerSearch.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../../../utils/api";

export default function CustomerSearch({ value, onChange }) {
  const [customers, setCustomers] = useState([]);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    (async () => {
      try {
        const cs = await apiClient.getCustomers();
        setCustomers(cs || []);
      } catch {}
    })();
  }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const created = await apiClient.createCustomer({
        name: form.name.trim(),
        email: form.email || null,
        phone: form.phone || null,
        address: null,
      });
      const refreshed = await apiClient.getCustomers();
      setCustomers(refreshed || []);
      if (created?.id) onChange?.(String(created.id));
      setShow(false);
      setForm({ name: "", email: "", phone: "" });
    } catch (e) {
      alert(e?.message || "Failed to add customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <label className="mb-2 block text-sm font-medium">Customer (optional)</label>
      <div className="flex items-end gap-2">
        <select
          className="w-full rounded border px-3 py-2"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
        >
          <option value="">Walk-in Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.phone ? `• ${c.phone}` : ""}
            </option>
          ))}
        </select>
        <button className="rounded border px-3 py-2" onClick={() => setShow(true)}>
          + Add
        </button>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">Add Customer</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="rounded border px-3 py-2" onClick={() => setShow(false)}>
                  Cancel
                </button>
                <button
                  className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
                  onClick={save}
                  disabled={!form.name.trim() || saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
