"use client";

interface RadarScores {
  complexity: number;
  documentation: number;
  testing: number;
  security: number;
  innovation: number;
  completeness: number;
}

interface RadarChartProps {
  scores: RadarScores;
}

const mono = "JetBrains Mono, monospace";

export default function RadarChart({ scores }: RadarChartProps) {
  const labels = [
    { key: "complexity", label: "complexity" },
    { key: "documentation", label: "docs" },
    { key: "testing", label: "testing" },
    { key: "security", label: "security" },
    { key: "innovation", label: "innovation" },
    { key: "completeness", label: "completeness" },
  ];

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 75;
  const levels = 4;
  const n = labels.length;

  const angleStep = (2 * Math.PI) / n;
  const getPoint = (i: number, r: number) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Grid polygons
  const gridPolygons = Array.from({ length: levels }, (_, l) => {
    const r = (radius * (l + 1)) / levels;
    return Array.from({ length: n }, (_, i) => getPoint(i, r))
      .map((p) => `${p.x},${p.y}`)
      .join(" ");
  });

  // Data polygon
  const dataPoints = labels.map((l, i) => {
    const val = scores[l.key as keyof RadarScores] || 0;
    const r = (val / 100) * radius;
    return getPoint(i, r);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Label positions
  const labelPoints = labels.map((_, i) => getPoint(i, radius + 18));

  return (
    <div style={{ border: "1px solid #1a1a1a", borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.1em", marginBottom: 12 }}>
        // skill_radar
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Grid */}
          {gridPolygons.map((points, i) => (
            <polygon key={i} points={points} fill="none" stroke="#1a1a1a" strokeWidth="1" />
          ))}

          {/* Axes */}
          {labels.map((_, i) => {
            const outer = getPoint(i, radius);
            return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#1a1a1a" strokeWidth="1" />;
          })}

          {/* Data area */}
          <polygon
            points={dataPolygon}
            fill="rgba(0,255,136,0.08)"
            stroke="#00ff88"
            strokeWidth="1.5"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(0,255,136,0.3))" }}
          />

          {/* Data points */}
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00ff88" style={{ filter: "drop-shadow(0 0 4px #00ff88)" }} />
          ))}

          {/* Labels */}
          {labels.map((l, i) => {
            const lp = labelPoints[i];
            const val = scores[l.key as keyof RadarScores] || 0;
            return (
              <g key={i}>
                <text
                  x={lp.x} y={lp.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="7" fill="#555"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {l.label}
                </text>
                <text
                  x={lp.x} y={lp.y + 9}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="7" fill="#00ff88"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Center dot */}
          <circle cx={cx} cy={cy} r="2" fill="#1a1a1a" />
        </svg>

        {/* Legend */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 16px", width: "100%" }}>
          {labels.map((l) => {
            const val = scores[l.key as keyof RadarScores] || 0;
            const color = val >= 70 ? "#00ff88" : val >= 40 ? "#60a5fa" : "#f87171";
            return (
              <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ height: 2, width: 12, background: color, borderRadius: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: "#444", fontFamily: mono }}>{l.label}</span>
                <span style={{ fontSize: 9, color, fontFamily: mono, marginLeft: "auto" }}>{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
