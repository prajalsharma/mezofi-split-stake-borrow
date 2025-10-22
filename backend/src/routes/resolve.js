// backend/src/routes/resolve.js
import express from 'express';
import db from '../db';

const router = express.Router();

router.get('/resolve/:id', async (req, res) => {
  try {
    const user = await db.getUser(req.params.id);
    if (!user) return res.status(404).send({ error: 'User not found' });
    return res.send({ wallet_address: user.wallet_address });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'internal_error' });
  }
});

export default router;
