// backend/src/routes/topup.js
import express from 'express';
import db from '../db';

const router = express.Router();

// Mock fiat top-up for demo: adds fiat equivalent to user (no Mezo interaction)
router.post('/topup', async (req, res) => {
  const { userId, amountFiat } = req.body;
  if (!userId || !amountFiat) return res.status(400).send({ error: 'Missing params' });

  try {
    // Here you could update user balance or notify user, for now just simple response
    return res.send({ success: true, message: `Topup of 	7${amountFiat} successful for user ${userId}` });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'internal_error' });
  }
});

export default router;
