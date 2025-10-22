// backend/src/routes/expense.js
import express from 'express';
import multer from 'multer';
import { parseReceipt } from '../ocrService';
import db from '../db';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/expense/upload', upload.single('image'), async (req, res) => {
  const { userId, tripId } = req.body;
  if (!userId) return res.status(400).send({ error: 'userId missing' });
  if (!req.file) return res.status(400).send({ error: 'image missing' });

  try {
    const ocrResult = await parseReceipt(req.file.buffer);
    const amountMUSD = ocrResult.total / (process.env.FIXED_MUSD_RATE_INR || 88);

    // Insert expense
    const result = await db.query(
      `INSERT INTO expenses(user_id, trip_id, merchant, amount_fiat, amount_musd, category, date, ocr_raw, onchain_tx, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *`,
      [userId, tripId || null, ocrResult.merchant, ocrResult.total, amountMUSD, 'uncategorized', ocrResult.date, JSON.stringify(ocrResult.rawText), null]
    );

    // TODO: For hackathon, onchain_tx is null; real version could broadcast MUSD burn/anchor

    res.send({ success: true, expense: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'internal_error' });
  }
});

export default router;
