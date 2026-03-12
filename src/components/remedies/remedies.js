import React from "react";
import "./remedies.css";
import {
  FaMugHot,
  FaTint,
  FaSpa,
  FaHotjar,
  FaLeaf,
  FaAppleAlt,
  FaBed,
  FaHeartbeat,
  FaSeedling
} from "react-icons/fa";

const remediesData = [
  { id: 1, name: "Ginger Tea", desc: "Helps reduce menstrual cramps and bloating.", icon: <FaMugHot /> },
  { id: 2, name: "Heat Therapy", desc: "A heating pad relaxes uterine muscles and eases pain.", icon: <FaHotjar /> },
  { id: 3, name: "Chamomile Tea", desc: "Calming tea that can reduce inflammation and discomfort.", icon: <FaLeaf /> },
  { id: 4, name: "Yoga & Stretching", desc: "Gentle stretches improve circulation and reduce cramps.", icon: <FaSpa /> },
  { id: 5, name: "Hydration", desc: "Drinking water helps reduce bloating and fatigue.", icon: <FaTint /> },

  { id: 6, name: "Turmeric Milk", desc: "Natural anti-inflammatory that helps relieve pain.", icon: <FaMugHot /> },
  { id: 7, name: "Peppermint Tea", desc: "Soothes the stomach and eases nausea.", icon: <FaLeaf /> },
  { id: 8, name: "Fennel Seeds", desc: "Helps digestion and reduces menstrual bloating.", icon: <FaSeedling /> },
  { id: 9, name: "Warm Bath", desc: "Relaxes muscles and reduces tension in the body.", icon: <FaHotjar /> },

  { id: 10, name: "Light Walking", desc: "Gentle movement improves blood flow and mood.", icon: <FaHeartbeat /> },
  { id: 11, name: "Magnesium-Rich Foods", desc: "Foods like bananas and nuts help relax muscles.", icon: <FaAppleAlt /> },
  { id: 12, name: "Good Rest", desc: "Adequate sleep helps the body recover and regulate hormones.", icon: <FaBed /> },

  { id: 13, name: "Deep Breathing", desc: "Slow breathing reduces stress and pain sensitivity.", icon: <FaSpa /> },
  { id: 14, name: "Herbal Infusions", desc: "Herbal blends like cinnamon or basil may ease cramps.", icon: <FaLeaf /> },
  { id: 15, name: "Warm Soups", desc: "Light warm meals are comforting and easy to digest.", icon: <FaMugHot /> }
];

const Remedies = () => {
  return (
    <div className="remedies-container">
      <h2>Gentle Home Remedies</h2>

      <div className="remedies-grid">
        {remediesData.map((remedy) => (
          <div key={remedy.id} className="remedy-card">
            <div className="remedy-icon">{remedy.icon}</div>
            <h3>{remedy.name}</h3>
            <p>{remedy.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Remedies;