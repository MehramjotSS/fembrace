import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./calendar.css";
import symptomData from "../../backend/symptoms.json";

const symptomGroups = symptomData;

const MenstrualCalendar = ({ currUser }) => {
  const username = currUser;

  const [startDate, setStartDate] = useState(null);
  const [periodLength, setPeriodLength] = useState(5);
  const [cycleInterval, setCycleInterval] = useState(28);
  const [periods, setPeriods] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayData, setDayData] = useState({ flow: 0, symptoms: [], note: "" });

  // Normalize any date -> midnight
  const normalizeDate = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  // Generate all period days
  const getPeriodDays = (start, length) =>
    Array.from({ length }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return normalizeDate(d);
    });

  // Fetch all periods on mount (optional)
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/periods?username=${username}`);
        const data = await res.json();
        setPeriods(data.periods || []);
      } catch (err) {
        console.error("Error fetching periods:", err);
      }
    };
    fetchPeriods();
  }, [username]);

  const tileClassName = ({ date, view }) => {
    if (view !== "month" || !startDate) return;
    const periodDates = getPeriodDays(startDate, periodLength);
    if (periodDates.some(d => d.toDateString() === date.toDateString()))
      return "current-period";
  };

  // Click on a day
  const onDayClick = async (date) => {
    const normalized = normalizeDate(date);
    setSelectedDate(normalized);
    try {
      const res = await fetch(
        `http://localhost:5001/api/day?username=${username}&date=${normalized.toISOString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setDayData(data.day || { flow: 0, symptoms: [], note: "" });
      } else {
        setDayData({ flow: 0, symptoms: [], note: "" });
      }
    } catch (err) {
      console.error("Error fetching day data:", err);
      setDayData({ flow: 0, symptoms: [], note: "" });
    }
  };

  const toggleSymptom = (s) => {
    const existing = dayData.symptoms.find(x => x.name === s.name);
    let newSymptoms;
    if (existing) {
      const newIntensity = (existing.intensity + 1) % 6;
      if (newIntensity === 0) newSymptoms = dayData.symptoms.filter(x => x.name !== s.name);
      else newSymptoms = dayData.symptoms.map(x => x.name === s.name ? { ...x, intensity: newIntensity } : x);
    } else {
      newSymptoms = [...dayData.symptoms, { ...s, intensity: 1 }];
    }
    setDayData({ ...dayData, symptoms: newSymptoms });
  };

  const savePeriod = async () => {
    if (!startDate) return;
    const normalizedStart = normalizeDate(startDate);

    let newPeriod = periods.find(
      p => new Date(p.start).toDateString() === normalizedStart.toDateString()
    );

    if (!newPeriod) {
      newPeriod = {
        username,
        start: normalizedStart,
        end: new Date(normalizedStart.getFullYear(), normalizedStart.getMonth(), normalizedStart.getDate() + periodLength - 1),
        cycleInterval,
        days: getPeriodDays(normalizedStart, periodLength).map(d => ({
          date: d,
          flow: 0,
          symptoms: [],
          note: ""
        }))
      };
      setPeriods([...periods, newPeriod]);
    }

    if (selectedDate) {
      newPeriod.days = newPeriod.days.map(d =>
        new Date(d.date).toDateString() === selectedDate.toDateString()
          ? { ...dayData, date: selectedDate }
          : d
      );
    }

    try {
      const res = await fetch("http://localhost:5001/api/period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPeriod)
      });
      const saved = await res.json();
      console.log("Saved period:", saved);
      alert("Saved!");
    } catch (err) {
      console.error("Error saving period:", err);
    }
  };

  return (
    <div className="calendar-container">
      {/* Top inputs */}
      <div className="input-section">
        <div className="input-box">
          <label>Start Date:</label>
          <input type="date" onChange={e => setStartDate(normalizeDate(new Date(e.target.value)))} />
        </div>
        <div className="input-box">
          <label>Period Length:</label>
          <input type="number" value={periodLength} onChange={e => setPeriodLength(Number(e.target.value))} min="3" max="10" />
        </div>
        <div className="input-box">
          <label>Cycle Interval:</label>
          <input type="number" value={cycleInterval} onChange={e => setCycleInterval(Number(e.target.value))} min="21" max="35" />
        </div>
      </div>

      <button onClick={savePeriod} style={{ marginBottom: "20px" }}>Save Period / Changes</button>

      <div className="calendar-panel-container">
        {/* Left view panel */}
        {selectedDate && (
          <div className="view-panel">
            <h4>View: {selectedDate.toDateString()}</h4>
            <label>Flow:</label>
            <div>{dayData.flow > 0 ? "🩸".repeat(dayData.flow) : "No flow"}</div>
            <label>Symptoms:</label>
            <ul>
              {dayData.symptoms.length > 0 ? dayData.symptoms.map((s, i) => (
                <li key={i}>{s.name} {s.emoji.repeat(s.intensity)}</li>
              )) : <li>No symptoms</li>}
            </ul>
            <label>Note:</label>
            <div>{dayData.note || "—"}</div>
          </div>
        )}

        {/* Calendar */}
        <Calendar tileClassName={tileClassName} onClickDay={onDayClick} />

        {/* Right edit panel */}
        {selectedDate && (
          <div className="day-panel">
            <h4>Edit: {selectedDate.toDateString()}</h4>
            <label>Flow:</label>
            <input type="number" value={dayData.flow} min={0} max={5} onChange={e => setDayData({ ...dayData, flow: Number(e.target.value) })} />
            <label>Symptoms:</label>
            <div className="add-symptoms">
              {Object.entries(symptomGroups).map(([category, symptoms]) => (
                <div key={category} className="symptom-category" style={{ width: "100%", marginBottom: 10 }}>
                  <h5 style={{ margin: "6px 0" }}>{category}</h5>
                  <div className="symptom-buttons">
                    {symptoms.map(s => {
                      const existing = dayData.symptoms.find(x => x.name === s.name);
                      const intensity = existing ? existing.intensity : 0;
                      return (
                        <button key={s.name} onClick={() => toggleSymptom(s)} style={{ marginRight: 6, marginBottom: 6 }}>
                          {s.emoji} {s.name} {intensity > 0 && `(${intensity})`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <label>Note:</label>
            <textarea value={dayData.note} onChange={e => setDayData({ ...dayData, note: e.target.value })}></textarea>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenstrualCalendar;
