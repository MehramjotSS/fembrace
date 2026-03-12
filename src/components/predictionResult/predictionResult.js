import React from "react";
import "./predictionResult.css";
import GaugeChart from "react-gauge-chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getRiskLevel(prob) {
  if (prob < 0.3) return { label: "Low Risk", color: "#5BE12C", emoji: "✅" };
  if (prob < 0.6) return { label: "Moderate Risk", color: "#F5CD19", emoji: "⚠️" };
  return { label: "High Risk", color: "#EA4228", emoji: "🔴" };
}

// ─── Recommendations ────────────────────────────────────────────────────────

const Recommendations = ({ formData }) => {
  const tips = [];

  if (formData.weightGain === "Y")
    tips.push({
      icon: "🥗",
      text: "Maintain a balanced diet and actively manage your weight through mindful eating.",
    });
  if (formData.fastFood === "Y")
    tips.push({
      icon: "🚫",
      text: "Reduce fast food intake — opt for whole foods rich in fibre and nutrients.",
    });
  if (formData.regularExercise === "N")
    tips.push({
      icon: "🏃‍♀️",
      text: "Aim for at least 30 minutes of moderate exercise daily to regulate hormones.",
    });
  if (formData.skinDarkening === "Y")
    tips.push({
      icon: "🩺",
      text: "Consider checking for insulin resistance — skin darkening can be an early sign.",
    });
  if (formData.hairLoss === "Y")
    tips.push({
      icon: "💊",
      text: "Consult a dermatologist or endocrinologist about hormonal hair loss options.",
    });
  if (formData.pimples === "Y")
    tips.push({
      icon: "🌿",
      text: "A low-glycaemic diet and proper skincare can help manage hormonal acne.",
    });
  if (formData.hairGrowth === "Y")
    tips.push({
      icon: "🔬",
      text: "Excess hair growth may indicate elevated androgens — a hormone panel is advisable.",
    });

  if (tips.length === 0)
    tips.push({
      icon: "🌟",
      text: "Keep up the great work! Maintain your healthy lifestyle and schedule regular checkups.",
    });

  return (
    <div className="recommendations">
      <h4 className="section-title">
        <span className="section-icon">💡</span> Personalised Health Suggestions
      </h4>
      <ul className="rec-list">
        {tips.map((tip, i) => (
          <li key={i} className="rec-item">
            <span className="rec-icon">{tip.icon}</span>
            <span className="rec-text">{tip.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Custom Tooltip for Bar Chart ───────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">{payload[0].value.toFixed(1)}% impact</p>
      </div>
    );
  }
  return null;
};

// ─── Main Component ─────────────────────────────────────────────────────────

const PredictionResult = ({ result, formData }) => {
  if (!result) return null;

  if (result.error) {
    return (
      <div className="result-dashboard error-state">
        <p className="error-message">⚠️ Error: {result.error}</p>
      </div>
    );
  }

  const prob = result.probability ?? 0;
  const risk = getRiskLevel(prob);

  // Chart data from LIME explanation
  const chartData = result.explanation
    ? Object.entries(result.explanation)
        .map(([feature, value]) => ({
          name: feature
            .replace(/_/g, " ")
            .replace(/\(Y\/N\)/g, "")
            .replace(/\(.*?\)/g, "")
            .trim()
            .split(" ")
            .slice(0, 3)
            .join(" "),
          impact: Math.abs(value * 100),
          raw: value,
        }))
        .sort((a, b) => b.impact - a.impact)
        .slice(0, 6)
    : [];

  // Sorted explanation items
  const sortedExplanation = result.explanation
    ? Object.entries(result.explanation)
        .map(([feature, value]) => ({ feature, value, abs: Math.abs(value) }))
        .sort((a, b) => b.abs - a.abs)
        .slice(0, 5)
    : [];

  return (
    <div className="result-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-brand">FemBrace</div>
        <h2 className="dashboard-title">PCOS Health Analytics</h2>
        <p className="dashboard-subtitle">
          Your personalised risk assessment & insights
        </p>
      </div>

      {/* Risk Banner */}
      <div className={`result-banner risk-${risk.label.split(" ")[0].toLowerCase()}`}>
        <div className="banner-inner">
          <span className="banner-emoji">{risk.emoji}</span>
          <div className="banner-text">
            <span className="banner-prob">
              {(prob * 100).toFixed(1)}% PCOS Probability
            </span>
            <span className="risk-level" style={{ color: risk.color }}>
              {risk.label}
            </span>
          </div>
        </div>
      </div>

      {/* Gauge + Stats Row */}
      <div className="gauge-stats-row">
        <div className="gauge-wrapper">
          <h4 className="section-title">
            <span className="section-icon">🎯</span> Risk Gauge
          </h4>
          <GaugeChart
            id="pcos-gauge"
            percent={prob}
            arcsLength={[0.3, 0.3, 0.4]}
            colors={["#5BE12C", "#F5CD19", "#EA4228"]}
            arcWidth={0.3}
            needleColor="#c9a4c4"
            needleBaseColor="#c9a4c4"
            textColor="#e8d5e8"
            formatTextValue={(v) => `${v}%`}
            style={{ width: "100%", maxWidth: 320, margin: "0 auto" }}
          />
        </div>

        <div className="stats-panel">
          <div className="stat-card">
            <span className="stat-label">Probability Score</span>
            <span className="stat-value" style={{ color: risk.color }}>
              {(prob * 100).toFixed(2)}%
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Risk Category</span>
            <span className="stat-value risk-level" style={{ color: risk.color }}>
              {risk.label}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Diagnosis</span>
            <span
              className="stat-value"
              style={{ color: result.prediction === "PCOS" ? "#EA4228" : "#5BE12C" }}
            >
              {result.prediction ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Feature Impact Chart */}
      {chartData.length > 0 && (
        <div className="chart-container">
          <h4 className="section-title">
            <span className="section-icon">📊</span> Feature Impact Chart
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: "#c9a4c4", fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fill: "#c9a4c4", fontSize: 11 }}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="impact" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.raw > 0 ? "#ff4d6d" : "#5BE12C"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="chart-note">
            🔴 Red bars increase risk · 🟢 Green bars decrease risk
          </p>
        </div>
      )}

      {/* Key Factors */}
      {sortedExplanation.length > 0 && (
        <div className="explanation-container">
          <h4 className="section-title">
            <span className="section-icon">🔍</span> Key Factors Influencing This Prediction
          </h4>
          <ul className="explanation-list">
            {sortedExplanation.map(({ feature, value }) => (
              <li
                key={feature}
                className={`explanation-item ${value > 0 ? "positive" : "negative"}`}
              >
                <span className="feature-name">
                  {feature
                    .replace(/_/g, " ")
                    .replace(/\(Y\/N\)/g, "")
                    .replace(/\(.*?\)/g, "")
                    .trim()}
                </span>
                <span className="feature-value">
                  {value > 0 ? "▲ Increases" : "▼ Decreases"} risk by{" "}
                  {Math.abs(value * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
          <p className="explanation-note">
            Based on LIME (Local Interpretable Model-agnostic Explanations) analysis.
          </p>
        </div>
      )}

      {/* Recommendations */}
      <Recommendations formData={formData} />

      {/* Footer CTA */}
      <div className="dashboard-footer">
        <p>
          ⚕️ This tool is for informational purposes only. Please consult a
          healthcare professional for a formal diagnosis.
        </p>
      </div>
    </div>
  );
};

export default PredictionResult;