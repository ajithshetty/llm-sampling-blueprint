import React, { useState, useMemo, useRef } from "react";

const TOKENS = [
  { word: "sunny", logit: 8.2 },
  { word: "cloudy", logit: 7.6 },
  { word: "nice", logit: 7.1 },
  { word: "rainy", logit: 6.8 },
  { word: "hot", logit: 6.2 },
  { word: "cold", logit: 5.9 },
  { word: "terrible", logit: 4.5 },
  { word: "unpredictable", logit: 4.0 },
  { word: "weird", logit: 3.0 },
  { word: "extraordinary", logit: 2.0 },
  { word: "purple", logit: -1.0 },
  { word: "banana", logit: -2.0 },
];

const C = {
  bg: "#0a1420",
  panel: "#0e1d30",
  panelBorder: "#1e3a56",
  grid: "#152c44",
  cyan: "#38bdf8",
  cyanDim: "#0e7490",
  amber: "#fbbf24",
  text: "#dce6f0",
  textMuted: "#5f7c99",
  cut: "#25415f",
};

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

const PRESETS = [
  { name: "Precise", temperature: 0.3, topK: 12, topP: 1.0 },
  { name: "Balanced", temperature: 0.8, topK: 12, topP: 0.9 },
  { name: "Creative", temperature: 1.2, topK: 6, topP: 0.95 },
  { name: "Chaotic", temperature: 2.2, topK: 12, topP: 1.0 },
];

export default function SamplingBlueprint() {
  const [temperature, setTemperature] = useState(1.0);
  const [topK, setTopK] = useState(12);
  const [topP, setTopP] = useState(1.0);
  const [log, setLog] = useState([]);
  const [flashIdx, setFlashIdx] = useState(null);
  const flashTimer = useRef(null);

  const {
    probsAfterTemp,
    finalProbs,
    keptAfterKSet,
    keptAfterPSet,
    order,
  } = useMemo(() => {
    const scaled = TOKENS.map((t) => t.logit / temperature);
    const probsAfterTemp = softmax(scaled);

    const order = TOKENS.map((_, i) => i).sort(
      (a, b) => probsAfterTemp[b] - probsAfterTemp[a]
    );

    const keptAfterKSet = new Set(order.slice(0, topK));

    let cum = 0;
    const keptAfterPSet = new Set();
    for (const i of order) {
      if (!keptAfterKSet.has(i)) continue;
      if (cum >= topP && keptAfterPSet.size > 0) break;
      cum += probsAfterTemp[i];
      keptAfterPSet.add(i);
    }

    const finalSum = [...keptAfterPSet].reduce(
      (s, i) => s + probsAfterTemp[i],
      0
    );
    const finalProbs = TOKENS.map((_, i) =>
      keptAfterPSet.has(i) ? probsAfterTemp[i] / finalSum : 0
    );

    return { probsAfterTemp, finalProbs, keptAfterKSet, keptAfterPSet, order };
  }, [temperature, topK, topP]);

  const scaleMax = 0.95;
  const topPick = order[0];
  const keptCount = keptAfterPSet.size;

  const sample = () => {
    const r = Math.random();
    let acc = 0;
    let chosen = order[0];
    for (let i = 0; i < TOKENS.length; i++) {
      acc += finalProbs[i];
      if (r <= acc) {
        chosen = i;
        break;
      }
    }
    setFlashIdx(chosen);
    setLog((prev) => [TOKENS[chosen].word, ...prev].slice(0, 8));
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashIdx(null), 650);
  };

  const applyPreset = (p) => {
    setTemperature(p.temperature);
    setTopK(p.topK);
    setTopP(p.topP);
  };

  const tempNote =
    temperature < 0.7
      ? "Below 1, the distribution sharpens — the model leans hard on its favorite."
      : temperature <= 1.15
      ? "Near 1, the raw distribution is used close to unchanged."
      : "Above 1, the distribution flattens — long-shot tokens get a real chance.";

  const kNote =
    topK >= 12
      ? "At 12 (all tokens), top-k does nothing — nothing is discarded."
      : `Only the ${topK} highest-probability token${
          topK === 1 ? "" : "s"
        } survive; every other token is discarded before sampling.`;

  const pNote =
    topP >= 1.0
      ? "At 1.0, top-p keeps everything that survived top-k."
      : `Keeps the smallest set of tokens whose probabilities add up to ${(
          topP * 100
        ).toFixed(0)}% — here, that's ${keptCount} token${
          keptCount === 1 ? "" : "s"
        }.`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        padding: "20px 14px 40px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        .sb-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: linear-gradient(90deg, ${C.cyanDim}, ${C.grid});
          outline: none;
        }
        .sb-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 3px;
          background: ${C.cyan};
          border: 2px solid ${C.bg};
          box-shadow: 0 0 0 1px ${C.cyan};
          cursor: pointer;
        }
        .sb-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          background: ${C.cyan};
          border: 2px solid ${C.bg};
          box-shadow: 0 0 0 1px ${C.cyan};
          cursor: pointer;
        }
        @keyframes sb-pulse {
          0% { box-shadow: 0 0 0 0 rgba(251,191,36,0.55); }
          100% { box-shadow: 0 0 0 10px rgba(251,191,36,0); }
        }
        .sb-flash { animation: sb-pulse 0.65s ease-out; }
        .sb-preset:active { transform: translateY(1px); }
      `}</style>

      <div style={{ maxWidth: 460, margin: "0 auto", position: "relative" }}>
        {/* corner brackets */}
        {[
          { top: -8, left: -8, bt: true, bl: true },
          { top: -8, right: -8, bt: true, br: true },
          { bottom: -8, left: -8, bb: true, bl: true },
          { bottom: -8, right: -8, bb: true, br: true },
        ].map((c, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              top: c.top,
              bottom: c.bottom,
              left: c.left,
              right: c.right,
              borderTop: c.bt ? `2px solid ${C.cyanDim}` : "none",
              borderBottom: c.bb ? `2px solid ${C.cyanDim}` : "none",
              borderLeft: c.bl ? `2px solid ${C.cyanDim}` : "none",
              borderRight: c.br ? `2px solid ${C.cyanDim}` : "none",
              pointerEvents: "none",
            }}
          />
        ))}

        <div style={{ marginBottom: 4, fontSize: 11, color: C.textMuted, letterSpacing: 1 }}>
          SPEC · NEXT-TOKEN SAMPLING
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 6px",
            color: C.text,
          }}
        >
          Temperature, top-k, top-p
        </h1>
        <p style={{ fontSize: 13, lineHeight: 1.5, color: C.textMuted, margin: "0 0 18px" }}>
          Three knobs that reshape a model's next-token distribution before it
          samples. Adjust them and watch the bars move.
        </p>

        {/* prompt line */}
        <div
          style={{
            border: `1px dashed ${C.panelBorder}`,
            background: C.panel,
            padding: "10px 12px",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <span style={{ color: C.textMuted }}>PROMPT&nbsp;</span>
          "The weather today is{" "}
          <span style={{ color: C.amber, fontWeight: 600 }}>___</span>"
        </div>

        {/* presets */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              className="sb-preset"
              onClick={() => applyPreset(p)}
              style={{
                flex: "1 1 auto",
                background: "transparent",
                border: `1px solid ${C.panelBorder}`,
                color: C.textMuted,
                fontFamily: "inherit",
                fontSize: 11,
                padding: "6px 8px",
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* pipeline breadcrumb */}
        <div
          style={{
            fontSize: 10,
            color: C.textMuted,
            marginBottom: 10,
            letterSpacing: 0.3,
          }}
        >
          logits → ÷ temp → softmax → top-k → top-p → renormalize → sample
        </div>

        {/* bars */}
        <div
          style={{
            border: `1px solid ${C.panelBorder}`,
            background: C.panel,
            padding: "12px 12px 8px",
            marginBottom: 20,
          }}
        >
          {order.map((i) => {
            const t = TOKENS[i];
            const ghostW = Math.min(100, (probsAfterTemp[i] / scaleMax) * 100);
            const finalW = Math.min(100, (finalProbs[i] / scaleMax) * 100);
            const cut = finalProbs[i] === 0;
            const isTop = i === topPick && !cut;
            const flashing = flashIdx === i;
            return (
              <div
                key={t.word}
                className={flashing ? "sb-flash" : ""}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 2px",
                  opacity: cut ? 0.45 : 1,
                }}
              >
                <div
                  style={{
                    width: 82,
                    fontSize: 12,
                    color: cut ? C.textMuted : C.text,
                    textDecoration: cut ? "line-through" : "none",
                    flexShrink: 0,
                  }}
                >
                  {t.word}
                </div>
                <div
                  style={{
                    position: "relative",
                    flex: 1,
                    height: 14,
                    background: C.grid,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${ghostW}%`,
                      background: C.cut,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${finalW}%`,
                      background: isTop ? C.amber : C.cyan,
                      transition: "width 120ms linear",
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 42,
                    fontSize: 11,
                    color: cut ? C.textMuted : C.text,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {cut ? "cut" : `${(finalProbs[i] * 100).toFixed(1)}%`}
                </div>
              </div>
            );
          })}
        </div>

        {/* sliders */}
        {[
          {
            label: "Temperature",
            value: temperature.toFixed(2),
            note: tempNote,
            min: 0.1,
            max: 2.5,
            step: 0.05,
            set: setTemperature,
            raw: temperature,
          },
          {
            label: "Top-K",
            value: topK >= 12 ? "off" : topK,
            note: kNote,
            min: 1,
            max: 12,
            step: 1,
            set: (v) => setTopK(Math.round(v)),
            raw: topK,
          },
          {
            label: "Top-P",
            value: topP >= 1.0 ? "off" : topP.toFixed(2),
            note: pNote,
            min: 0.05,
            max: 1.0,
            step: 0.05,
            set: setTopP,
            raw: topP,
          },
        ].map((s) => (
          <div key={s.label} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              <span style={{ color: C.text, fontWeight: 600 }}>{s.label}</span>
              <span style={{ color: C.amber }}>{s.value}</span>
            </div>
            <input
              className="sb-slider"
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={s.raw}
              onChange={(e) => s.set(parseFloat(e.target.value))}
            />
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5, lineHeight: 1.4 }}>
              {s.note}
            </div>
          </div>
        ))}

        {/* sample button */}
        <button
          onClick={sample}
          style={{
            width: "100%",
            background: C.cyan,
            color: C.bg,
            border: "none",
            padding: "12px",
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 0.5,
            cursor: "pointer",
            marginBottom: 14,
          }}
        >
          SAMPLE A TOKEN
        </button>

        {/* output tape */}
        <div
          style={{
            border: `1px dashed ${C.panelBorder}`,
            padding: "10px 12px",
            minHeight: 40,
            fontSize: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span style={{ color: C.textMuted, marginRight: 4 }}>OUTPUT&nbsp;</span>
          {log.length === 0 && (
            <span style={{ color: C.textMuted }}>— nothing sampled yet</span>
          )}
          {log.map((w, idx) => (
            <span
              key={idx}
              style={{
                color: idx === 0 ? C.amber : C.text,
                opacity: idx === 0 ? 1 : 1 - idx * 0.09,
              }}
            >
              {w}
              {idx < log.length - 1 ? " ·" : ""}
            </span>
          ))}
        </div>

        {/* sources */}
        <div style={{ marginTop: 22, fontSize: 11, color: C.textMuted, lineHeight: 1.9 }}>
          <div style={{ letterSpacing: 1, marginBottom: 4, color: C.textMuted }}>
            LEARN MORE
          </div>
          <div>
            <a href="https://huggingface.co/docs/transformers/en/generation_strategies" target="_blank" rel="noopener noreferrer" style={{ color: C.cyan }}>
              HF: generation strategies (temp → top-k → top-p order)
            </a>
          </div>
          <div>
            <a href="https://arxiv.org/abs/1904.09751" target="_blank" rel="noopener noreferrer" style={{ color: C.cyan }}>
              Holtzman et al. 2019 — nucleus (top-p) sampling paper
            </a>
          </div>
          <div>
            <a href="https://arxiv.org/abs/1805.04833" target="_blank" rel="noopener noreferrer" style={{ color: C.cyan }}>
              Fan, Lewis & Dauphin 2018 — top-k sampling paper
            </a>
          </div>
          <div>
            <a href="https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters.html" target="_blank" rel="noopener noreferrer" style={{ color: C.cyan }}>
              AWS Bedrock: inference request parameters reference
            </a>
          </div>
          <div>
            <a href="https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-request-response.html" target="_blank" rel="noopener noreferrer" style={{ color: C.cyan }}>
              AWS Bedrock: Claude request/response (temperature, top_p, top_k)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
