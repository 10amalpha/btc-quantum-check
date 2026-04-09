"use client";

import { useState, useEffect, useRef } from "react";

// --- Address classification logic (pure client-side) ---
function classifyAddress(addr) {
  const trimmed = addr.trim();

  // P2PKH — starts with 1
  if (/^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed)) {
    return {
      type: "P2PKH",
      label: "Pay-to-Public-Key-Hash",
      era: "Legacy (2009–present)",
      quantum: "protected",
      reason:
        "Tu clave pública permanece oculta detrás de un hash hasta que gastas. Mientras no reutilices la dirección después de gastar, tu clave pública no queda expuesta on-chain.",
      action:
        "Evita reutilizar esta dirección después de enviar fondos. Considera migrar a una dirección SegWit (bc1q) para fees más bajos.",
    };
  }

  // P2SH — starts with 3
  if (/^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed)) {
    return {
      type: "P2SH",
      label: "Pay-to-Script-Hash",
      era: "Multisig / Wrapped SegWit (2012–present)",
      quantum: "protected",
      reason:
        "El script (y las claves públicas dentro) están protegidos por un hash. La clave pública no se revela hasta que se ejecuta el script de gasto.",
      action:
        "Misma recomendación: no reutilices después de gastar. Si es una dirección wrapped SegWit, considera migrar a native SegWit (bc1q).",
    };
  }

  // Bech32 — P2WPKH (42 chars total)
  if (/^bc1q[a-z0-9]{38}$/.test(trimmed)) {
    return {
      type: "P2WPKH",
      label: "Pay-to-Witness-Public-Key-Hash (Native SegWit)",
      era: "SegWit (2017–present)",
      quantum: "protected",
      reason:
        "Tu clave pública está hasheada. Solo se revela al momento de gastar, y si no reutilizas la dirección, permanece segura.",
      action:
        "Este es el estándar actual recomendado. No reutilices después de gastar.",
    };
  }

  // Bech32 — P2WSH (62 chars total)
  if (/^bc1q[a-z0-9]{58}$/.test(trimmed)) {
    return {
      type: "P2WSH",
      label: "Pay-to-Witness-Script-Hash",
      era: "SegWit Multisig (2017–present)",
      quantum: "protected",
      reason:
        "Similar a P2SH pero nativo SegWit. El script permanece hasheado hasta el momento del gasto.",
      action: "Segura mientras no se reutilice. Mantén la práctica actual.",
    };
  }

  // Bech32m — P2TR (Taproot)
  if (/^bc1p[a-z0-9]{58}$/.test(trimmed)) {
    return {
      type: "P2TR",
      label: "Pay-to-Taproot",
      era: "Taproot (2021–present)",
      quantum: "vulnerable",
      reason:
        "Las direcciones Taproot exponen la clave pública directamente on-chain (tweaked public key). Un computador cuántico suficientemente potente podría derivar la clave privada a partir de esta clave pública expuesta.",
      action:
        "Mueve tus fondos a una dirección P2WPKH (bc1q) o P2SH (3...) antes de que la computación cuántica sea una amenaza real. Tienes tiempo — los expertos estiman 6-7 años — pero no esperes.",
    };
  }

  // P2PK — raw public keys (hex)
  if (/^(04[a-fA-F0-9]{128}|0[23][a-fA-F0-9]{64})$/.test(trimmed)) {
    return {
      type: "P2PK",
      label: "Pay-to-Public-Key (Satoshi-era)",
      era: "Genesis (2009–2012)",
      quantum: "vulnerable",
      reason:
        "Esta es una clave pública cruda expuesta directamente on-chain — el formato original de Satoshi. Un computador cuántico podría derivar la clave privada directamente.",
      action:
        "PRIORIDAD ALTA: Mueve tus fondos inmediatamente a una dirección P2WPKH (bc1q). Estas son las direcciones más vulnerables de toda la red Bitcoin.",
    };
  }

  return null;
}

function ScanLine({ active }) {
  if (!active) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: "linear-gradient(90deg, transparent, #D4A843, transparent)",
        animation: "scanDown 1.5s ease-in-out forwards",
        zIndex: 2,
      }}
    />
  );
}

export default function Home() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleCheck = () => {
    setError("");
    setResult(null);
    setShowResult(false);

    const trimmed = address.trim();
    if (!trimmed) {
      setError("Ingresa una dirección Bitcoin o clave pública.");
      return;
    }

    const classification = classifyAddress(trimmed);
    if (!classification) {
      setError(
        "Formato no reconocido. Ingresa una dirección Bitcoin válida (1..., 3..., bc1q..., bc1p...) o una clave pública hex."
      );
      return;
    }

    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setResult(classification);
      setTimeout(() => setShowResult(true), 50);
    }, 1400);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCheck();
  };

  const handleClear = () => {
    setAddress("");
    setResult(null);
    setError("");
    setShowResult(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const isVulnerable = result?.quantum === "vulnerable";

  const REF_TYPES = [
    { type: "P2PK", prefix: "04... / 02-03...", safe: false },
    { type: "P2PKH", prefix: "1...", safe: true },
    { type: "P2SH", prefix: "3...", safe: true },
    { type: "P2WPKH", prefix: "bc1q... (42 chars)", safe: true },
    { type: "P2WSH", prefix: "bc1q... (62 chars)", safe: true },
    { type: "P2TR", prefix: "bc1p...", safe: false },
  ];

  return (
    <div className="page">
      {/* Header */}
      <header className="header">
        <div className="logo-row">
          <div className="logo-circle">
            <img src="/logo.jpg" alt="10AMPRO" className="logo-img" />
          </div>
          <div className="brand-text">
            <span style={{ color: "#D4A843" }}>10</span>
            <span style={{ color: "#22C55E" }}>AM</span>
            <span style={{ color: "#9CA3AF" }}>PRO</span>
          </div>
        </div>
        <div className="subtitle">QUANTUM VULNERABILITY CHECK</div>
      </header>

      {/* Main */}
      <main className="main">
        <h1 className="title">
          ¿Tu Bitcoin está preparado<br />para la era cuántica?
        </h1>
        <p className="description">
          Pega tu dirección BTC y verifica si tu tipo de dirección expone tu
          clave pública on-chain — el vector de ataque que un computador
          cuántico explotaría primero.
        </p>

        {/* Input */}
        <div className="input-wrapper">
          <div className="input-container">
            <span className="prompt-symbol">₿</span>
            <input
              ref={inputRef}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
              className="address-input"
              spellCheck={false}
              autoComplete="off"
            />
            {address && (
              <button onClick={handleClear} className="clear-btn">
                ✕
              </button>
            )}
          </div>
          <button
            onClick={handleCheck}
            className="check-btn"
            disabled={scanning}
          >
            {scanning ? "ANALIZANDO..." : "VERIFICAR"}
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {/* Result */}
        {result && (
          <div
            className={`result-card ${showResult ? "visible" : ""}`}
            style={{
              borderColor: isVulnerable
                ? "rgba(239,68,68,0.4)"
                : "rgba(34,197,94,0.3)",
            }}
          >
            <ScanLine active={scanning} />

            <div
              className="verdict-badge"
              style={{
                background: isVulnerable
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(34,197,94,0.1)",
                color: isVulnerable ? "#EF4444" : "#22C55E",
                border: isVulnerable
                  ? "1px solid rgba(239,68,68,0.3)"
                  : "1px solid rgba(34,197,94,0.25)",
              }}
            >
              {isVulnerable ? "⚠ VULNERABLE" : "✓ PROTEGIDA"}
            </div>

            <div className="type-row">
              <div className="type-label">TIPO</div>
              <div className="type-value">
                {result.type} <span className="type-sub">— {result.label}</span>
              </div>
            </div>

            <div className="type-row">
              <div className="type-label">ERA</div>
              <div className="type-value-small">{result.era}</div>
            </div>

            <div className="explanation-box">
              <div className="explain-label">DIAGNÓSTICO</div>
              <p className="explain-text">{result.reason}</p>
            </div>

            <div
              className="action-box"
              style={{
                borderColor: isVulnerable
                  ? "rgba(239,68,68,0.2)"
                  : "rgba(34,197,94,0.15)",
                background: isVulnerable
                  ? "rgba(239,68,68,0.05)"
                  : "rgba(34,197,94,0.04)",
              }}
            >
              <div
                className="explain-label"
                style={{ color: isVulnerable ? "#EF4444" : "#22C55E" }}
              >
                QUÉ HACER
              </div>
              <p className="explain-text">{result.action}</p>
            </div>
          </div>
        )}

        {/* Reference table */}
        <div className="ref-section">
          <div className="ref-title">TIPOS DE DIRECCIÓN BTC</div>
          <div className="ref-grid">
            {REF_TYPES.map((item) => (
              <div key={item.type} className="ref-item">
                <span
                  className="ref-dot"
                  style={{ background: item.safe ? "#22C55E" : "#EF4444" }}
                />
                <span className="ref-type">{item.type}</span>
                <span className="ref-prefix">{item.prefix}</span>
                <span
                  className="ref-status"
                  style={{ color: item.safe ? "#22C55E" : "#EF4444" }}
                >
                  {item.safe ? "PROTEGIDA" : "VULNERABLE"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Context */}
        <div className="context-block">
          <p className="context-text">
            <strong style={{ color: "#D4A843" }}>¿Por qué importa?</strong>{" "}
            Los computadores cuánticos podrán, en teoría, romper la criptografía
            de curva elíptica (ECDSA) que protege Bitcoin. Si tu clave pública
            está expuesta on-chain, un atacante con un computador cuántico
            suficientemente potente podría derivar tu clave privada. Los expertos
            estiman que esto podría ser posible en 6-7 años.
          </p>
        </div>

        {/* CTA */}
        <div className="cta-block">
          <a
            href="https://10am.pro"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-link"
          >
            Aprende más sobre quantum computing y crypto en{" "}
            <strong>10am.pro</strong> →
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        Esta herramienta clasifica direcciones localmente. No transmite datos.
        No es consejo financiero.
      </footer>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0A0A0A 0%, #0F0F0F 50%, #0A0A0A 100%);
          color: #E5E7EB;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 20px;
        }

        .header {
          width: 100%;
          max-width: 680px;
          padding-top: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid rgba(212,168,67,0.2);
          overflow: hidden;
          flex-shrink: 0;
        }

        .logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .brand-text {
          font-size: 20px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .subtitle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.25em;
          color: #6B7280;
          text-transform: uppercase;
        }

        .main {
          width: 100%;
          max-width: 680px;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 48px;
        }

        .title {
          font-size: clamp(24px, 5vw, 36px);
          font-weight: 700;
          text-align: center;
          line-height: 1.2;
          margin: 0 0 16px 0;
          color: #F9FAFB;
          letter-spacing: -0.02em;
        }

        .description {
          font-size: 15px;
          line-height: 1.7;
          color: #9CA3AF;
          text-align: center;
          max-width: 560px;
          margin: 0 0 40px 0;
        }

        .input-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .input-container {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 0 16px;
          height: 56px;
          transition: border-color 0.2s;
        }

        .input-container:focus-within {
          border-color: rgba(212,168,67,0.4);
        }

        .prompt-symbol {
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
          color: #D4A843;
          margin-right: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .address-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #F9FAFB;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          letter-spacing: 0.01em;
          min-width: 0;
        }

        .clear-btn {
          background: none;
          border: none;
          color: #6B7280;
          cursor: pointer;
          font-size: 14px;
          padding: 4px 8px;
          flex-shrink: 0;
        }

        .clear-btn:hover {
          color: #9CA3AF;
        }

        .check-btn {
          height: 48px;
          background: rgba(212,168,67,0.1);
          border: 1px solid rgba(212,168,67,0.3);
          border-radius: 8px;
          color: #D4A843;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: all 0.2s;
        }

        .check-btn:hover:not(:disabled) {
          background: rgba(212,168,67,0.18);
        }

        .check-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-msg {
          margin-top: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #EF4444;
          text-align: center;
        }

        .result-card {
          width: 100%;
          margin-top: 32px;
          background: rgba(255,255,255,0.02);
          border: 1px solid;
          border-radius: 12px;
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .result-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .verdict-badge {
          display: inline-block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 6px 16px;
          border-radius: 6px;
          margin-bottom: 24px;
        }

        .type-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 8px;
        }

        .type-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: #6B7280;
          flex-shrink: 0;
          width: 36px;
        }

        .type-value {
          font-size: 18px;
          font-weight: 700;
          color: #F9FAFB;
        }

        .type-sub {
          font-weight: 400;
          font-size: 14px;
          color: #9CA3AF;
        }

        .type-value-small {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #9CA3AF;
        }

        .explanation-box {
          margin-top: 20px;
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .explain-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: #6B7280;
          margin-bottom: 8px;
        }

        .explain-text {
          font-size: 14px;
          line-height: 1.7;
          color: #D1D5DB;
          margin: 0;
        }

        .action-box {
          margin-top: 12px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid;
        }

        .ref-section {
          width: 100%;
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .ref-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: #6B7280;
          margin-bottom: 16px;
        }

        .ref-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ref-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.02);
          border-radius: 6px;
          font-size: 13px;
          flex-wrap: wrap;
        }

        .ref-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .ref-type {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          color: #F9FAFB;
          width: 64px;
          flex-shrink: 0;
        }

        .ref-prefix {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #6B7280;
          flex: 1;
          min-width: 120px;
        }

        .ref-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
        }

        .context-block {
          width: 100%;
          margin-top: 32px;
          padding: 20px;
          background: rgba(212,168,67,0.04);
          border: 1px solid rgba(212,168,67,0.1);
          border-radius: 8px;
        }

        .context-text {
          font-size: 14px;
          line-height: 1.7;
          color: #9CA3AF;
          margin: 0;
        }

        .cta-block {
          margin-top: 32px;
          text-align: center;
        }

        .cta-link {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: #D4A843;
          text-decoration: none;
          letter-spacing: 0.02em;
        }

        .cta-link:hover {
          opacity: 0.8;
        }

        .footer {
          width: 100%;
          max-width: 680px;
          text-align: center;
          padding: 48px 0 24px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #6B7280;
          margin-top: auto;
        }

        @media (max-width: 640px) {
          .header {
            padding-top: 32px;
          }

          .main {
            margin-top: 32px;
          }

          .address-input {
            font-size: 12px;
          }

          .type-value {
            font-size: 16px;
          }

          .type-sub {
            font-size: 12px;
          }

          .ref-item {
            gap: 6px;
            padding: 6px 10px;
            font-size: 12px;
          }

          .ref-type {
            width: 56px;
            font-size: 12px;
          }

          .ref-prefix {
            font-size: 11px;
            min-width: 80px;
          }
        }
      `}</style>
    </div>
  );
}
