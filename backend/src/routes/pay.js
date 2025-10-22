// backend/src/routes/pay.js
import express from 'express';
import db from '../db';
import MezoClient from '../mezoClient';
import { convertFiatToMUSD } from '../pricing';
import notify from '../notify';

const router = express.Router();
const mezo = new MezoClient(process.env.MEZO_RPC_URL);

router.post('/pay', async (req, res) => {
  const { fromUserId, toUserId, amountFiat, ref } = req.body;
  if (!fromUserId || !toUserId || !amountFiat) return res.status(400).send({ error: 'missing params' });

  try {
    const fromUser = await db.getUser(fromUserId);
    const toUser = await db.getUser(toUserId);
    if (!fromUser || !toUser) return res.status(404).send({ error: 'user not found' });

    const musdNeeded = convertFiatToMUSD(amountFiat, fromUser.fiat_currency);

    let borrowUsed = false;
    let borrowAmount = 0;
    const balance = await mezo.getMUSDBalance(fromUser.wallet_address);

    if (balance < musdNeeded) {
      const shortfall = parseFloat((musdNeeded - balance).toFixed(8));
      if (!fromUser.collateral_btc_address) {
        return res.status(400).send({ error: 'no BTC collateral address registered' });
      }
      const borrow = await mezo.borrowMUSD(fromUser.wallet_address, shortfall);
      const borrowRes = await mezo.waitForConfirmation(borrow.txHash);
      if (!borrowRes.success) return res.status(500).send({ error: 'borrow_failed' });
      borrowUsed = true;
      borrowAmount = shortfall;
    }

    const transfer = await mezo.transferMUSD(fromUser.wallet_address, toUser.wallet_address, musdNeeded);
    const transferRes = await mezo.waitForConfirmation(transfer.txHash);
    if (!transferRes.success) {
      // TODO: Implement rollback logic of borrow if transfer fails (out of scope for hackathon)
      return res.status(500).send({ error: 'transfer_failed' });
    }

    const tx = await db.insertTx({
      from_user: fromUserId,
      to_user: toUserId,
      amount_fiat: amountFiat,
      amount_musd: musdNeeded,
      tx_hash: transferRes.txHash,
      borrow_used: borrowUsed,
      borrow_amount_musd: borrowAmount,
      status: 'CONFIRMED',
    });

    notify.user(fromUserId, { type: 'payment_sent', tx });
    notify.user(toUserId, { type: 'payment_received', tx });

    return res.send({ success: true, txHash: transferRes.txHash, borrowUsed });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'internal_error' });
  }
});

export default router;
