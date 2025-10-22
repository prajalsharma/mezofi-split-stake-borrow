// backend/src/routes/trip.js
import express from 'express';
import db from '../db';
import MezoClient from '../mezoClient';

const router = express.Router();
const mezo = new MezoClient(process.env.MEZO_RPC_URL);

// Create a new trip pool
router.post('/trip/create', async (req, res) => {
  const { creator, title, currency = 'INR' } = req.body;
  if (!creator || !title) return res.status(400).send({ error: 'missing params' });

  try {
    const result = await db.query(
      `INSERT INTO trips(creator, title, currency, created_at, vault_deposited) VALUES ($1,$2,$3,NOW(),false) RETURNING *`,
      [creator, title, currency]
    );
    return res.send({ success: true, trip: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'internal_error' });
  }
});

// Join a trip
router.post('/trip/join', async (req, res) => {
  const { tripId, userId, stake_btc_addr } = req.body;
  if (!tripId || !userId) return res.status(400).send({ error: 'missing params' });
  try {
    await db.query(
      `INSERT INTO trip_members (trip_id, user_id, stake_amount_musd, stake_btc_addr, share_percent, joined_at) VALUES ($1,$2,0,$3,0,NOW()) ON CONFLICT DO NOTHING`,
      [tripId, userId, stake_btc_addr || null]
    );
    return res.send({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'internal_error' });
  }
});

// Deposit money to trip pool
router.post('/trip/deposit', async (req, res) => {
  const { tripId, userId, amountFiat } = req.body;
  if (!tripId || !userId || !amountFiat) return res.status(400).send({ error: 'missing params' });

  try {
    const user = await db.getUser(userId);
    if (!user) return res.status(404).send({ error: 'user not found' });

    // Convert fiat to MUSD
    const musd = amountFiat / (process.env.FIXED_MUSD_RATE_INR || 88);

    // TODO: For MVP, skip vault deposit, just update stake_amount_musd for user in trip
    await db.query(
      `UPDATE trip_members SET stake_amount_musd = stake_amount_musd + $1 WHERE trip_id=$2 AND user_id=$3`,
      [musd, tripId, userId]
    );

    return res.send({ success: true, depositedMUSD: musd });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'internal_error' });
  }
});

// Settle trip (simplified, distribute stakes)
router.post('/trip/settle', async (req, res) => {
  const { tripId } = req.body;
  if (!tripId) return res.status(400).send({ error: 'missing params' });

  try {
    // TODO: Implement vault withdrawal, share calculation, MUSD distribution or repayment.
    return res.send({ success: true, msg: 'Trip settled - simulation only' });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'internal_error' });
  }
});

export default router;
