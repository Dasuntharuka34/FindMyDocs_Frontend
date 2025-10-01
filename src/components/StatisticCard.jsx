import React from 'react';
import '../styles/components/StatisticCard.css';

function StatisticCard({ label, value }) {
  return (
    <div className="statistic-card">
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}

export default StatisticCard;
