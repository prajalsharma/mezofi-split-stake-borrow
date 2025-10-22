// backend/src/routes/register.js
import express from 'express';
import db from '../db';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { id, display_name, phone, email } = req.body;

    if (!id || !display_name) {
      return res.status(400).send({ error: 'Missing required fields' });
    }

    // TODO: create custodial wallet & collateral address for testnet user, mock OK for hackathon
    const wallet_address = `0xMOCK_WALLET_${id}`;
    const collateral_btc_address = `btc_collateral_mock_${id}`;

    await db.insertUser({
      id,
      display_name,
      phone: phone || null,
      email: email || null,
      wallet_address,
      collateral_btc_address,
      fiat_currency: 'INR',
      kyc_status: 'NOT_SUBMITTED',
    });

    return res.send({ success: true, id, wallet_address, collateral_btc_address });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'internal_error' });
  }
});

export default router;
