// src/pages/sales/components/POSInterface.jsx
import React, { useMemo, useState } from "react";
import ProductSearch from "./ProductSearch";
import Cart from "./Cart";
import CustomerSearch from "./CustomerSearch";
import PaymentModal from "./PaymentModal";
import ReceiptModal from "./ReceiptModal";
import apiClient from "../../../utils/api";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export default function POSInterface() {
  // cart items: {id, name, price, stock, qty, barcode}
  const [cart, setCart] = useState([]);

  // price adjustments + payment
  const [taxPct, setTaxPct] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");

  // customer
  const [customerId, setCustomerId] = useState("");

  // UI
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [receipt, setReceipt] = useState(null); // { saleId, items, totals }

  const subtotal = useMemo(
    () => round2(cart.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0)),
    [cart]
  );
  const taxAmount = useMemo(() => round2(subtotal * (Number(taxPct) || 0) / 100), [subtotal, taxPct]);
  const discountAmount = useMemo(
    () => round2(subtotal * (Number(discountPct) || 0) / 100),
    [subtotal, discountPct]
  );
  const total = useMemo(() => Math.max(0, round2(subtotal + taxAmount - discountAmount)), [subtotal, taxAmount, discountAmount]);

  const addToCart = (p) => {
    setCart((prev) => {
      const idx = prev.findIndex((it) => it.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        const max = Number(p.stock);
        next[idx] = { ...next[idx], qty: Math.min(max, Number(next[idx].qty) + 1) };
        return next;
      }
      return [
        ...prev,
        {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          stock: Number(p.stock),
          qty: 1,
          barcode: p.barcode || "",
        },
      ];
    });
  };

  const updateQty = (id, qty) =>
    setCart((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, qty: Math.max(1, Math.min(Number(it.stock), Number(qty) || 1)) }
          : it
      )
    );

  const removeItem = (id) => setCart((prev) => prev.filter((it) => it.id !== id));

  const reset = () => {
    setCart([]);
    setCustomerId("");
    setTaxPct(0);
    setDiscountPct(0);
    setPaymentMethod("cash");
    setNote("");
    setError("");
    setSubmitting(false);
    setShowPayment(false);
    setReceipt(null);
  };

  const handleCompleteSale = async () => {
    setError("");
    if (!cart.length) return setError("Add at least one product to the cart.");
    for (const it of cart) {
      if (it.qty < 1) return setError(`Invalid quantity for ${it.name}`);
      if (it.qty > it.stock) return setError(`Quantity exceeds stock for ${it.name}`);
    }
    setShowPayment(true);
  };

  const confirmPayment = async () => {
    const payload = {
      items: cart.map((it) => ({
        product_id: it.id,
        quantity: Number(it.qty),
        unit_price: Number(it.price),
        total_price: round2(it.price * it.qty),
      })),
      customer_id: customerId || null,
      total_amount: total,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      payment_method: paymentMethod,
      note: note || undefined,
    };

    setSubmitting(true);
    try {
      const res = await apiClient.createSale(payload); // { id }
      setReceipt({
        saleId: res?.id,
        items: cart.map((c) => ({
          name: c.name,
          qty: c.qty,
          price: Number(c.price),
          total: round2(c.price * c.qty),
        })),
        totals: { subtotal, taxAmount, discountAmount, total },
      });
      setShowPayment(false);
      // reduce stock in UI
      setCart((prev) => prev.map((it) => ({ ...it, stock: it.stock - it.qty })));
    } catch (e) {
      setError(e?.message || "Sale failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Sales / POS</h1>
        <p className="text-gray-600">Scan or search products, build a cart, and complete the sale.</p>
      </div>

      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {/* Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: search + cart */}
        <div className="lg:col-span-2 space-y-4">
          <ProductSearch onAdd={addToCart} />

          <Cart items={cart} onQtyChange={updateQty} onRemove={removeItem} />
        </div>

        {/* Right: customer + totals */}
        <div className="space-y-4">
          <CustomerSearch value={customerId} onChange={setCustomerId} />

          <div className="space-y-4 rounded-lg border bg-white p-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                Tax %
                <input
                  type="number"
                  min="0"
                  className="w-20 rounded border px-2 py-1 text-right"
                  value={taxPct}
                  onChange={(e) => setTaxPct(e.target.value)}
                />
              </label>
              <span className="font-medium">+ ${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                Discount %
                <input
                  type="number"
                  min="0"
                  className="w-20 rounded border px-2 py-1 text-right"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                />
              </label>
              <span className="font-medium">− ${discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-3 text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Payment Method</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Note (optional)</label>
              <textarea
                className="w-full rounded border px-3 py-2"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any note for receipt/log"
              />
            </div>

            <button
              className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
              disabled={!cart.length || submitting}
              onClick={handleCompleteSale}
            >
              {submitting ? "Processing…" : "Complete Sale"}
            </button>
          </div>
        </div>
      </div>

      {/* Payment confirm */}
      {showPayment && (
        <PaymentModal
          total={total}
          method={paymentMethod}
          onClose={() => setShowPayment(false)}
          onConfirm={confirmPayment}
          disabled={submitting}
        />
      )}

      {/* Receipt */}
      {receipt && (
        <ReceiptModal
          data={receipt}
          onClose={reset}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
}
