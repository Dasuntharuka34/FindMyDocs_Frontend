import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import '../styles/components/StatisticCard.css';

function StatisticCard({ label, value, icon: Icon, color }) {
  return (
    <Paper
      elevation={0}
      className="statistic-card"
      sx={{
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
        p: 2 // Added padding for better spacing, as the original Paper had implicit padding from the inner Box
      }}
    >
      <Box>
        <Typography variant="body2" color="var(--text-secondary)" sx={{ mb: 0.5, fontWeight: 'medium' }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {value}
        </Typography>
      </Box>
      {Icon && (
        <Box className="icon-container" sx={{ color: color }}>
          <Icon sx={{ fontSize: 32 }} />
        </Box>
      )}
    </Paper>
  );
}

export default StatisticCard;
