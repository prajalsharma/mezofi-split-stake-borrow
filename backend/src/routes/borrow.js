// backend/src/routes/borrow.js
import express from 'express';
import db from '../db';
import MezoClient from '../mezoClient';
import notify from '../notify';

const router = express.Router();
const mezo = new MezoClient(process.env.MEZO_RPC_URL);

router.post('/borrow', async (req, res) => {
  const { userId, amountMUSD } = req.body;
  if (!userId || !amountMUSD) return res.status(400).send({ error: 'missing params' });

  try {
    const user = await db.getUser(userId);
    if (!user) return res.status(404).send({ error: 'user not found' });

    if (!user.collateral_btc_address) {
      return res.status(400).send({ error: 'no BTC collateral registered' });
    }

    const borrow = await mezo.borrowMUSD(user.wallet_address, amountMUSD);
    const borrowRes = await mezo.waitForConfirmation(borrow.txHash);
    if (!borrowRes.success) return res.status(500).send({ error: 'borrow_failed' });

    await db.query(
      'INSERT INTO loans(user_id, amount_musd, borrow_tx, closed, created_at, apr) VALUES ($1,$2,$3,false,NOW(),5.0)', // APR dummy
      [userId, amountMUSD, borrow.txHash]
    );

    notify.user(userId, { type: 'borrow_confirmed', amountMUSD, txHash: borrow.txHash });
    return res.send({ success: true, txHash: borrow.txHash });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'internal_error' });
  }
});

export default router;
