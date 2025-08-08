import express from 'express';
import { startBot, stopBot } from '../ai_service/botRunner';

const router = express.Router();

router.post('/ai/bot/start', async (req, res) => {
  const { userId, coin } = req.body;
  await startBot(userId, coin);
  res.json({ status: 'Bot started' });
});

router.post('/ai/bot/stop', (req, res) => {
  const { userId } = req.body;
  stopBot(userId);
  res.json({ status: 'Bot stopped' });
});

export default router;