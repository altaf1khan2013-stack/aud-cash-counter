import { useState, useCallback } from "react";

const DENOMINATIONS = [
  { label: "$100", value: 100, type: "note" },
  { label: "$50", value: 50, type: "note" },
  { label: "$20", value: 20, type: "note" },
  { label: "$10", value: 10, type: "note" },
  { label: "$5", value: 5, type: "note" },
  { label: "$2", value: 2, type: "coin" },
  { label: "$1", value: 1, type: "coin" },
  { label: "50¢", value: 0.5, type: "coin" },
  { label: "20¢", value: 0.2, type: "coin" },
  { label: "10¢", value: 0.1, type: "coin" },
  { label: "5¢", value: 0.05, type: "coin" },
];

const NUM_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "00", "⌫"];

const fmt = (v) =>
  v.toLocaleString("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 });

export default function CashCounter() {
  const [quantities, setQuantities] = useState(
    Object.fromEntries(DENOMINATIONS.map((d) => [d.value, 0]))
  );
  const [floatAmount, setFloatAmount] = useState(300);
  const [editingFloat, setEditingFloat] = useState(false);
  const [floatInput, setFloatInput] = useState("300");
  const [activeRow, setActiveRow] = useState(null);
  const [inputBuffer, setInputBuffer] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const grandTotal = DENOMINATIONS.reduce((s, d) => s + d.value * quantities[d.value], 0);
  const totalQty = DENOMINATIONS.reduce((s, d) => s + quantities[d.value], 0);
  const netAmount = grandTotal - floatAmount;

  const selectRow = useCallback((denomValue) => {
    setEditingFloat(false);
    if (activeRow === denomValue) {
      setActiveRow(null);
      setInputBuffer("");
    } else {
      setActiveRow(denomValue);
      const current = quantities[denomValue];
      setInputBuffer(current > 0 ? String(current) : "");
    }
  }, [activeRow, quantities]);

  const handleKey = useCallback((key) => {
    if (activeRow === null) return;
    let nb;
    if (key === "⌫") nb = inputBuffer.slice(0, -1);
    else if (key === "00") nb = inputBuffer + "00";
    else nb = inputBuffer + key;
    if (nb.length > 5) return;
    setInputBuffer(nb);
    setQuantities((prev) => ({ ...prev, [activeRow]: parseInt(nb, 10) || 0 }));
  }, [activeRow, inputBuffer]);

  const handleFloatKey = useCallback((key) => {
    let nv;
    if (key === "⌫") nv = floatInput.slice(0, -1);
    else if (key === "00") nv = floatInput + "00";
    else nv = floatInput + key;
    if (nv.length > 6) return;
    setFloatInput(nv);
    setFloatAmount(parseInt(nv, 10) || 0);
  }, [floatInput]);

  const handleReset = () => {
    setQuantities(Object.fromEntries(DENOMINATIONS.map((d) => [d.value, 0])));
    setActiveRow(null);
    setInputBuffer("");
    setShowReset(false);
  };

  const moveNext = () => {
    if (editingFloat) { setEditingFloat(false); return; }
    const idx = DENOMINATIONS.findIndex((d) => d.value === activeRow);
    if (idx < DENOMINATIONS.length - 1) {
      const next = DENOMINATIONS[idx + 1].value;
      setActiveRow(next);
      setInputBuffer(quantities[next] > 0 ? String(quantities[next]) : "");
    } else {
      setActiveRow(null);
      setInputBuffer("");
    }
  };

  const handleExport = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
    const rows = DENOMINATIONS.filter((d) => quantities[d.value] > 0)
      .map((d) => `<tr><td style="padding:8px 14px;border-bottom:1px solid #e0e0e0;font-weight:600">${d.label}</td><td style="padding:8px 14px;border-bottom:1px solid #e0e0e0;text-align:center">${quantities[d.value]}</td><td style="padding:8px 14px;border-bottom:1px solid #e0e0e0;text-align:right">${fmt(d.value * quantities[d.value])}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cash Count - ${dateStr}</title><style>@media print{body{margin:0}@page{margin:1.2cm}}body{font-family:-apple-system,'Helvetica Neue',sans-serif;color:#1a1a2e;max-width:460px;margin:0 auto;padding:30px 20px}.header{text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1a1a2e}h1{margin:0 0 4px;font-size:22px;letter-spacing:1px}.meta{font-size:13px;color:#666}table{width:100%;border-collapse:collapse;margin:16px 0}th{padding:10px 14px;background:#1a1a2e;color:white;font-size:12px;text-transform:uppercase;letter-spacing:.5px}.totals{margin-top:20px;border-top:2px solid #1a1a2e;padding-top:14px}.total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:15px}.total-row.grand{font-size:20px;font-weight:700;padding:10px 0}.total-row.net{font-size:17px;font-weight:600;color:${netAmount >= 0 ? "#16a34a" : "#dc2626"}}.footer{text-align:center;margin-top:30px;font-size:11px;color:#aaa}</style></head><body><div class="header"><h1>CASH COUNT</h1><div class="meta">${dateStr} at ${timeStr}</div></div><table><thead><tr><th style="text-align:left">Denomination</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div class="total-row grand"><span>Grand Total (${totalQty} items)</span><span>${fmt(grandTotal)}</span></div><div class="total-row"><span>Float Deduction</span><span>- ${fmt(floatAmount)}</span></div><div class="total-row net"><span>Net Amount</span><span>${netAmount >= 0 ? "" : "-"}${fmt(Math.abs(netAmount))}</span></div></div><div class="footer">Generated by AUD Cash Counter</div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Cash_Count_${now.toISOString().slice(0, 10)}.html`; a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const padActive = activeRow !== null || editingFloat;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0a0a14 0%, #111827 100%)",
      color: "#e8e8f0",
      fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif",
      WebkitFontSmoothing: "antialiased",
      display: "flex", flexDirection: "column",
    }}>

      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 14px 8px",
        paddingTop: "max(12px, env(safe-area-inset-top))",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#818cf8", textTransform: "uppercase" }}>
          AUD Cash Counter
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowExport(true)} style={{
            width: 36, height: 36, borderRadius: 10,
            border: "1px solid rgba(129,140,248,0.2)", background: "rgba(129,140,248,0.1)",
            color: "#818cf8", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
          }}>↗</button>
          <button onClick={() => setShowReset(true)} style={{
            width: 36, height: 36, borderRadius: 10,
            border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.08)",
            color: "#f87171", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
          }}>↺</button>
        </div>
      </div>

      {/* Main: Denomination buttons LEFT | Qty + Total RIGHT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px", paddingBottom: 420, WebkitOverflowScrolling: "touch" }}>
        {DENOMINATIONS.map((d) => {
          const qty = quantities[d.value];
          const rowTotal = d.value * qty;
          const active = activeRow === d.value;
          return (
            <div key={d.value} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              {/* LEFT — denomination button */}
              <button
                onClick={() => selectRow(d.value)}
                style={{
                  width: 68, height: 44, borderRadius: 10, flexShrink: 0,
                  border: active ? "2px solid #818cf8" : "1.5px solid rgba(255,255,255,0.06)",
                  background: active
                    ? d.type === "note" ? "linear-gradient(135deg, #4338ca, #6366f1)" : "linear-gradient(135deg, #b45309, #d97706)"
                    : d.type === "note" ? "rgba(67,56,202,0.15)" : "rgba(180,83,9,0.12)",
                  color: active ? "#fff" : d.type === "note" ? "#a5b4fc" : "#fbbf24",
                  fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                  letterSpacing: -0.3, display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: active
                    ? d.type === "note" ? "0 3px 12px rgba(99,102,241,0.35)" : "0 3px 12px rgba(217,119,6,0.3)"
                    : "none",
                  transition: "all 0.12s ease",
                }}
              >
                {d.label}
              </button>

              {/* RIGHT — qty + row total */}
              <div
                onClick={() => selectRow(d.value)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "6px 12px", borderRadius: 10, minHeight: 44, cursor: "pointer",
                  background: active ? "rgba(129,140,248,0.08)" : qty > 0 ? "rgba(255,255,255,0.02)" : "transparent",
                  border: active ? "1.5px solid rgba(129,140,248,0.25)" : "1px solid rgba(255,255,255,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 9, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>QTY</span>
                  <span style={{
                    fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    color: active ? "#c7d2fe" : qty > 0 ? "#e8e8f0" : "#374151", minWidth: 32,
                  }}>
                    {active && inputBuffer === "" ? <span style={{ opacity: 0.3 }}>0</span> : qty}
                    {active && <span style={{
                      display: "inline-block", width: 2, height: 20, background: "#818cf8",
                      marginLeft: 2, verticalAlign: "text-bottom", animation: "blink 1s step-end infinite",
                    }} />}
                  </span>
                </div>
                <span style={{
                  fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums",
                  color: rowTotal > 0 ? "#a5b4fc" : "#2d3748",
                }}>{fmt(rowTotal)}</span>
              </div>
            </div>
          );
        })}
        <div style={{ textAlign: "center", padding: "10px 0", fontSize: 11, color: "#4b5563", letterSpacing: 1.5 }}>
          {totalQty} {totalQty === 1 ? "ITEM" : "ITEMS"} COUNTED
        </div>
      </div>

      {/* === FIXED BOTTOM: Numpad + Totals === */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        background: "rgba(8,8,18,0.97)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "6px 10px 0",
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
      }}>
        {/* Active indicator */}
        {padActive && (
          <div style={{
            textAlign: "center", fontSize: 11, fontWeight: 600, color: "#818cf8",
            letterSpacing: 1, marginBottom: 4, textTransform: "uppercase",
          }}>
            {editingFloat
              ? `Editing Float → $${floatInput || "0"}`
              : `${DENOMINATIONS.find((d) => d.value === activeRow)?.label} — enter quantity`}
          </div>
        )}

        {/* Numpad */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5,
          maxWidth: 300, margin: "0 auto",
        }}>
          {NUM_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => editingFloat ? handleFloatKey(key) : handleKey(key)}
              disabled={!padActive}
              style={{
                height: 46, borderRadius: 10, border: "none",
                background: key === "⌫" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.07)",
                color: key === "⌫" ? "#f87171" : "#e8e8f0",
                fontSize: key === "⌫" ? 20 : 19, fontWeight: 600,
                cursor: padActive ? "pointer" : "not-allowed",
                opacity: padActive ? 1 : 0.3,
                fontFamily: "inherit", transition: "all 0.1s",
                WebkitTapHighlightColor: "transparent", userSelect: "none",
              }}
            >{key}</button>
          ))}
        </div>

        {/* NEXT / DONE */}
        {padActive && (
          <button onClick={moveNext} style={{
            width: "100%", maxWidth: 300, margin: "6px auto 0", display: "block",
            height: 42, borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #4338ca, #6366f1)",
            color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", letterSpacing: 0.5,
            boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
          }}>
            {editingFloat ? "DONE" : activeRow === DENOMINATIONS[DENOMINATIONS.length - 1].value ? "DONE ✓" : "NEXT ↓"}
          </button>
        )}

        {/* TOTALS BAR — below numpad */}
        <div style={{
          display: "flex", gap: 5, marginTop: 8, paddingTop: 8,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* Grand Total */}
          <div style={{
            flex: 1.3, padding: "7px 10px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontSize: 8, fontWeight: 800, color: "#6b7280", letterSpacing: 1.5, marginBottom: 1 }}>AUD TOTAL</div>
            <div style={{ fontSize: 17, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "#f1f5f9", letterSpacing: -0.3 }}>
              {fmt(grandTotal)}
            </div>
          </div>

          {/* Float — tappable */}
          <button
            onClick={() => { setActiveRow(null); setInputBuffer(""); setEditingFloat(!editingFloat); setFloatInput(String(floatAmount)); }}
            style={{
              flex: 0.9, padding: "7px 10px", borderRadius: 10, textAlign: "left", fontFamily: "inherit", color: "#e8e8f0",
              background: editingFloat ? "rgba(129,140,248,0.12)" : "rgba(255,255,255,0.03)",
              border: editingFloat ? "1.5px solid #818cf8" : "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 8, fontWeight: 800, color: "#6366f1", letterSpacing: 1.5, marginBottom: 1 }}>FLOAT</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#c7d2fe" }}>
              {fmt(floatAmount)}
            </div>
          </button>

          {/* Net */}
          <div style={{
            flex: 1.1, padding: "7px 10px", borderRadius: 10,
            background: netAmount >= 0 ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${netAmount >= 0 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
          }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1.5, marginBottom: 1, color: netAmount >= 0 ? "#22c55e" : "#ef4444" }}>NET</div>
            <div style={{
              fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums",
              color: netAmount >= 0 ? "#86efac" : "#fca5a5", letterSpacing: -0.3,
            }}>
              {netAmount < 0 && "−"}{fmt(Math.abs(netAmount))}
            </div>
          </div>
        </div>
      </div>

      {/* Reset modal */}
      {showReset && (
        <div onClick={() => setShowReset(false)} style={{
          position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#1e1e36", borderRadius: 20, padding: "24px 22px", width: "100%", maxWidth: 310,
            border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)", textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>↺</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Reset All Counts?</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 18, lineHeight: 1.5 }}>
              All quantities will be cleared. Float stays the same.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowReset(false)} style={{
                flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "#d1d5db", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
              <button onClick={handleReset} style={{
                flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #dc2626, #ef4444)", color: "white",
                fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Export modal */}
      {showExport && (
        <div onClick={() => setShowExport(false)} style={{
          position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#1e1e36", borderRadius: 20, padding: "24px 22px", width: "100%", maxWidth: 310,
            border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)", textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Export Cash Count</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 10, lineHeight: 1.5 }}>Download a printable report.</div>
            <div style={{
              background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "12px 14px", margin: "12px 0", fontSize: 13, textAlign: "left",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: "#9ca3af" }}>Items</span><span style={{ fontWeight: 600 }}>{totalQty}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: "#9ca3af" }}>Total</span><span style={{ fontWeight: 700, fontSize: 15 }}>{fmt(grandTotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 5, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ color: "#9ca3af" }}>Net</span>
                <span style={{ fontWeight: 700, color: netAmount >= 0 ? "#86efac" : "#fca5a5" }}>
                  {netAmount < 0 && "−"}{fmt(Math.abs(netAmount))}
                </span>
              </div>
            </div>
            <button onClick={handleExport} style={{
              width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #4338ca, #6366f1)", color: "white",
              fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 6,
            }}>Download Report</button>
            <button onClick={() => setShowExport(false)} style={{
              width: "100%", padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent", color: "#9ca3af", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
            }}>Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        button:active { transform:scale(0.96); }
        html { overflow-x:hidden; }
        ::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
}
