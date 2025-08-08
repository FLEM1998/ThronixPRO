import React from 'react';
import axios from 'axios';

export const BotControl = () => {
  const startBot = async () => {
    await axios.post('/ai/bot/start', { userId: 'user123', coin: 'BTC' });
  };

  const stopBot = async () => {
    await axios.post('/ai/bot/stop', { userId: 'user123' });
  };

  return (
    <div>
      <button onClick={startBot}>Start AI Bot</button>
      <button onClick={stopBot}>Stop AI Bot</button>
    </div>
  );
};