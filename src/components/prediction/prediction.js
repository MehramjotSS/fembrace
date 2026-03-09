import React, { useState } from "react";
import "./prediction.css";
import PredictionResult from "./../predictionResult/predictionResult";

const Prediction = () => {
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    bmi: "",
    bloodGroup: "",
    pulseRate: "",
    cycleRegularity: "",
    cycleLength: "",
    marriageStatus: "",
    pregnant: "",
    abortions: "",
    hip: "",
    waist: "",
    waistHipRatio: "",
    weightGain: "",
    hairGrowth: "",
    skinDarkening: "",
    hairLoss: "",
    pimples: "",
    fastFood: "",
    regularExercise: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const handleChange = (e) => {
  const { name, value } = e.target;

  const updatedData = {
    ...formData,
    [name]: value,
  };

  /* -------- BMI AUTO CALCULATION -------- */

  const weight = parseFloat(updatedData.weight);
  const heightCm = parseFloat(updatedData.height);

  if (!isNaN(weight) && !isNaN(heightCm) && heightCm > 0) {
    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    updatedData.bmi = bmi.toFixed(2);
  }

  /* -------- WAIST HIP RATIO AUTO CALCULATION -------- */

  const waist = parseFloat(updatedData.waist);
  const hip = parseFloat(updatedData.hip);

  if (!isNaN(waist) && !isNaN(hip) && hip > 0) {
    const ratio = waist / hip;
    updatedData.waistHipRatio = ratio.toFixed(2);
  }

  setFormData(updatedData);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate numeric fields
    const numericFields = [
      "age", "weight", "height", "bmi", "pulseRate",
      "cycleRegularity", "cycleLength", "marriageStatus",
      "abortions", "hip", "waist", "waistHipRatio",
    ];
    const invalidInputs = numericFields.some(
      (name) => formData[name] === "" || isNaN(formData[name])
    );

    if (invalidInputs) {
      alert("Please fill out all fields with valid data.");
      setLoading(false);
      return;
    }

    const payload = {
      "Age (yrs)": +formData.age,
      "Weight (Kg)": +formData.weight,
      "Height(Cm)": +formData.height,
      BMI: +formData.bmi,
      "Blood Group": bloodGroups.indexOf(formData.bloodGroup) + 1,
      "Pulse rate(bpm)": +formData.pulseRate,
      "Cycle(R/I)": +formData.cycleRegularity,
      "Cycle length(days)": +formData.cycleLength,
      "Marraige Status (Yrs)": +formData.marriageStatus,
      "Pregnant(Y/N)": formData.pregnant,
      "No. of aborptions": +formData.abortions,
      "Hip(inch)": +formData.hip,
      "Waist(inch)": +formData.waist,
      "Waist:Hip Ratio": +formData.waistHipRatio,
      "Weight gain(Y/N)": formData.weightGain,
      "hair growth(Y/N)": formData.hairGrowth,
      "Skin darkening (Y/N)": formData.skinDarkening,
      "Hair loss(Y/N)": formData.hairLoss,
      "Pimples(Y/N)": formData.pimples,
      "Fast food (Y/N)": formData.fastFood,
      "Reg.Exercise(Y/N)": formData.regularExercise,
    };

    try {
      const [predictionRes, explanationRes] = await Promise.all([
        fetch("http://localhost:5002/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch("http://localhost:5002/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ]);

      const predictionData = await predictionRes.json();
      const explanationData = await explanationRes.json();

      if (predictionData.error) throw new Error(predictionData.error);
      if (explanationData.error) throw new Error(explanationData.error);

      setResult({
        ...predictionData,
        explanation: explanationData.lime_explanation,
      });
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
      setShowResult(true);
    }
  };

  const handleReset = () => {
    setShowResult(false);
    setResult(null);
  };

  const renderForm = () => (
    <div className="form-container">
      <h2>PCOS PREDICTION FORM</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Personal Information */}
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="input-group">
              <label htmlFor="age">Age (yrs)</label>
              <input
                id="age"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                id="weight"
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="height">Height (cm)</label>
              <input
                id="height"
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="bmi">BMI</label>
              <input
                id="bmi"
                type="number"
                name="bmi"
                step="0.01"
                value={formData.bmi}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="bloodGroup">Blood Group</label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Medical Information */}
          <div className="form-section">
            <h3>Medical Information</h3>
            <div className="input-group">
              <label htmlFor="pulseRate">Pulse Rate (bpm)</label>
              <input
                id="pulseRate"
                type="number"
                name="pulseRate"
                value={formData.pulseRate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="cycleRegularity">Cycle Regularity</label>
              <select
                id="cycleRegularity"
                name="cycleRegularity"
                value={formData.cycleRegularity}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="1">Regular</option>
                <option value="0">Irregular</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="cycleLength">Cycle Length (days)</label>
              <input
                id="cycleLength"
                type="number"
                name="cycleLength"
                value={formData.cycleLength}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="marriageStatus">Marriage Status (Yrs)</label>
              <input
                id="marriageStatus"
                type="number"
                name="marriageStatus"
                value={formData.marriageStatus}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="pregnant">Pregnant (Y/N)</label>
              <select
                id="pregnant"
                name="pregnant"
                value={formData.pregnant}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="abortions">No. of Abortions</label>
              <input
                id="abortions"
                type="number"
                name="abortions"
                value={formData.abortions}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Physical Measurements */}
          <div className="form-section">
            <h3>Physical Measurements</h3>
            <div className="input-group">
              <label htmlFor="hip">Hip (inch)</label>
              <input
                id="hip"
                type="number"
                name="hip"
                value={formData.hip}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="waist">Waist (inch)</label>
              <input
                id="waist"
                type="number"
                name="waist"
                value={formData.waist}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="waistHipRatio">Waist-Hip Ratio</label>
              <input
                id="waistHipRatio"
                type="number"
                name="waistHipRatio"
                step="0.01"
                value={formData.waistHipRatio}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Symptoms and Lifestyle */}
          <div className="form-section">
            <h3>Symptoms and Lifestyle</h3>
            {[
              { label: "Weight Gain", name: "weightGain" },
              { label: "Hair Growth", name: "hairGrowth" },
              { label: "Skin Darkening", name: "skinDarkening" },
              { label: "Hair Loss", name: "hairLoss" },
              { label: "Pimples", name: "pimples" },
              { label: "Fast Food Consumption", name: "fastFood" },
              { label: "Regular Exercise", name: "regularExercise" },
            ].map(({ label, name }) => (
              <div className="input-group" key={name}>
                <label htmlFor={name}>{label} (Y/N)</label>
                <select
                  id={name}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Predicting..." : "Predict PCOS"}
        </button>
      </form>
    </div>
  );

  return (
    <>
      {showResult ? (
        <div>
          {loading ? (
            <div className="form-container loading-screen">
              <div className="loading-indicator">
                <span className="loading-spinner" />
                Analysing your data…
              </div>
            </div>
          ) : (
            <>
              <PredictionResult result={result} formData={formData} />
              <div className="retake-wrapper">
                <button className="retake-btn" onClick={handleReset}>
                  ← Retake Assessment
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        renderForm()
      )}
    </>
  );
};

export default Prediction;