import { useEffect, useRef, useState } from "react";
import { cn } from "@/frontend/theme/tokens";
import { X, CheckCircle2, ArrowRight, Loader2, Smartphone, CreditCard, Building2 } from "lucide-react";
import { formatBDT } from "@/backend/utils/currency";

/**
 * PaymentMethodSelector — per D019
 *
 * Bangladesh MFS + Card payment method picker.
 * On mobile: slides up as a bottom sheet (via Vaul or CSS).
 * On desktop: modal overlay.
 *
 * Flow: Select method -> Enter PIN/confirm -> Processing -> Success
 */

export type PaymentMethod = "bkash" | "nagad" | "rocket" | "card" | "bank";

interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  number?: string;
  desc: string;
}

const METHODS: PaymentMethodInfo[] = [
  {
    id: "bkash",
    name: "bKash",
    icon: <span className="text-lg">💚</span>,
    color: "#D12053",
    bg: "rgba(209,32,83,0.08)",
    number: "0171X-XXXXXX",
    desc: "Mobile banking via bKash",
  },
  {
    id: "nagad",
    name: "Nagad",
    icon: <span className="text-lg">🟠</span>,
    color: "#ED6E1B",
    bg: "rgba(237,110,27,0.08)",
    number: "0181X-XXXXXX",
    desc: "Mobile banking via Nagad",
  },
  {
    id: "rocket",
    name: "Rocket",
    icon: <span className="text-lg">🟣</span>,
    color: "#8E24AA",
    bg: "rgba(142,36,170,0.08)",
    number: "0191X-XXXXXXX",
    desc: "DBBL Mobile Banking",
  },
  {
    id: "card",
    name: "Card Payment",
    icon: <CreditCard className="w-5 h-5" />,
    color: "#1565C0",
    bg: "rgba(21,101,192,0.08)",
    desc: "Visa / Mastercard / Amex",
  },
  {
    id: "bank",
    name: "Bank Transfer",
    icon: <Building2 className="w-5 h-5" />,
    color: "#37474F",
    bg: "rgba(55,71,79,0.08)",
    desc: "Direct bank transfer (NPSB)",
  },
];

type FlowStep = "select" | "confirm" | "processing" | "success" | "error";

interface PaymentMethodSelectorProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  invoiceRef?: string;
  onPaymentComplete?: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  open,
  onClose,
  amount,
  invoiceRef,
  onPaymentComplete,
}: PaymentMethodSelectorProps) {
  const [step, setStep] = useState<FlowStep>("select");
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [pin, setPin] = useState("");
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("select");
      setSelected(null);
      setPin("");
    }
  }, [open]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && step !== "processing") {
      onClose();
    }
  };

  const handleSelectMethod = (id: PaymentMethod) => {
    setSelected(id);
    setStep("confirm");
  };

  const handleConfirmPayment = () => {
    setStep("processing");
    // Simulate payment processing
    setTimeout(() => {
      setStep("success");
      onPaymentComplete?.(selected!);
    }, 2500);
  };

  const selectedMethod = METHODS.find((m) => m.id === selected);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={handleBackdrop}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet / Modal */}
      <div
        ref={sheetRef}
        className="relative z-10 w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl max-h-[85vh] overflow-y-auto"
        style={{ boxShadow: "0 -10px 40px rgba(0,0,0,0.15)" }}
      >
        {/* Handle bar (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: cn.borderLight }}>
          <div>
            <h2 className="text-lg" style={{ color: cn.text }}>
              {step === "select" && "Choose Payment Method"}
              {step === "confirm" && "Confirm Payment"}
              {step === "processing" && "Processing..."}
              {step === "success" && "Payment Successful"}
              {step === "error" && "Payment Failed"}
            </h2>
            {invoiceRef && step === "select" && (
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                Invoice: {invoiceRef}
              </p>
            )}
          </div>
          {step !== "processing" && (
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 cn-touch-target">
              <X className="w-5 h-5" style={{ color: cn.textSecondary }} />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Amount display */}
          {step !== "success" && (
            <div className="text-center mb-5 py-3 rounded-xl" style={{ background: cn.pinkBg }}>
              <p className="text-xs" style={{ color: cn.textSecondary }}>Amount to Pay</p>
              <p className="text-2xl" style={{ color: cn.pink }}>{formatBDT(amount)}</p>
            </div>
          )}

          {/* ── Step: Select Method ── */}
          {step === "select" && (
            <div className="space-y-2.5">
              {METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleSelectMethod(method.id)}
                  className="w-full flex items-center gap-3.5 p-4 rounded-xl border transition-all hover:shadow-sm cn-touch-target"
                  style={{ borderColor: cn.border }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: method.bg, color: method.color }}
                  >
                    {method.icon}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm" style={{ color: cn.text }}>{method.name}</p>
                    <p className="text-xs truncate" style={{ color: cn.textSecondary }}>
                      {method.number || method.desc}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0" style={{ color: cn.textSecondary }} />
                </button>
              ))}
            </div>
          )}

          {/* ── Step: Confirm ── */}
          {step === "confirm" && selectedMethod && (
            <div className="space-y-5">
              {/* Selected method card */}
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: selectedMethod.bg }}>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "white", color: selectedMethod.color }}
                >
                  {selectedMethod.icon}
                </div>
                <div>
                  <p className="text-sm" style={{ color: selectedMethod.color }}>{selectedMethod.name}</p>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>
                    {selectedMethod.number || selectedMethod.desc}
                  </p>
                </div>
              </div>

              {/* MFS PIN entry (for bKash, Nagad, Rocket) */}
              {["bkash", "nagad", "rocket"].includes(selectedMethod.id) && (
                <div>
                  <label className="block text-xs mb-2" style={{ color: cn.textSecondary }}>
                    Enter your {selectedMethod.name} PIN
                  </label>
                  <div className="flex gap-2 justify-center">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <input
                        key={i}
                        type="password"
                        maxLength={1}
                        value={pin[i] || ""}
                        onChange={(e) => {
                          const newPin = pin.split("");
                          newPin[i] = e.target.value.slice(-1);
                          setPin(newPin.join(""));
                          // Auto-focus next
                          if (e.target.value && i < 4) {
                            const next = e.target.parentElement?.children[i + 1] as HTMLInputElement;
                            next?.focus();
                          }
                        }}
                        className="w-12 h-14 text-center rounded-xl border text-xl focus:outline-none"
                        style={{
                          borderColor: pin[i] ? selectedMethod.color : cn.border,
                          color: cn.text,
                          fontSize: "20px",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-center mt-2" style={{ color: cn.textSecondary }}>
                    Demo: Enter any 5-digit PIN
                  </p>
                </div>
              )}

              {/* Card fields */}
              {selectedMethod.id === "card" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: cn.textSecondary }}>Card Number</label>
                    <input type="text" placeholder="4111 1111 1111 1111"
                      className="w-full px-4 py-3 rounded-xl border text-sm"
                      style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: cn.textSecondary }}>Expiry</label>
                      <input type="text" placeholder="MM/YY"
                        className="w-full px-4 py-3 rounded-xl border text-sm"
                        style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: cn.textSecondary }}>CVV</label>
                      <input type="password" placeholder="•••"
                        className="w-full px-4 py-3 rounded-xl border text-sm"
                        style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} />
                    </div>
                  </div>
                  <p className="text-xs text-center" style={{ color: cn.textSecondary }}>
                    Demo: Enter any test card details
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep("select"); setPin(""); }}
                  className="flex-1 py-3.5 rounded-xl border text-sm cn-touch-target"
                  style={{ borderColor: cn.border, color: cn.text }}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={
                    (["bkash", "nagad", "rocket"].includes(selectedMethod.id) && pin.length < 5) ? true : false
                  }
                  className="flex-1 py-3.5 rounded-xl text-white text-sm cn-touch-target disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: selectedMethod.color }}
                >
                  <Smartphone className="w-4 h-4" />
                  Pay {formatBDT(amount)}
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Processing ── */}
          {step === "processing" && selectedMethod && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: selectedMethod.bg }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: selectedMethod.color }} />
              </div>
              <h3 className="text-lg mb-2" style={{ color: cn.text }}>Processing Payment</h3>
              <p className="text-sm" style={{ color: cn.textSecondary }}>
                {selectedMethod.id === "bkash" && "Confirming with bKash..."}
                {selectedMethod.id === "nagad" && "Confirming with Nagad..."}
                {selectedMethod.id === "rocket" && "Confirming with Rocket..."}
                {selectedMethod.id === "card" && "Verifying card with your bank..."}
                {selectedMethod.id === "bank" && "Initiating bank transfer..."}
              </p>
              <p className="text-xs mt-3" style={{ color: cn.textSecondary }}>
                Do not close this window
              </p>
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === "success" && selectedMethod && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: cn.greenBg }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: cn.green }} />
              </div>
              <h3 className="text-lg mb-1" style={{ color: cn.text }}>Payment Successful!</h3>
              <p className="text-2xl mb-3" style={{ color: cn.green }}>{formatBDT(amount)}</p>
              <div className="space-y-2 mb-6 text-left max-w-xs mx-auto">
                {[
                  { label: "Method", value: selectedMethod.name },
                  { label: "Transaction ID", value: `TXN-${Date.now().toString(36).toUpperCase()}` },
                  { label: "Date", value: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" }) },
                  ...(invoiceRef ? [{ label: "Invoice", value: invoiceRef }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm py-1.5 border-b" style={{ borderColor: cn.borderLight }}>
                    <span style={{ color: cn.textSecondary }}>{row.label}</span>
                    <span style={{ color: cn.text }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl text-white text-sm cn-touch-target"
                style={{ background: cn.green }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
