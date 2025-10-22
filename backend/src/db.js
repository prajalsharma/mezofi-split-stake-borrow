// backend/src/db.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

export default {
  query: (text, params) => pool.query(text, params),

  async getUser(id) {
    const res = await this.query('SELECT * FROM users WHERE id=$1', [id]);
    return res.rows[0];
  },

  async insertUser(user) {
    const { id, display_name, phone, email, wallet_address, collateral_btc_address, fiat_currency, kyc_status } = user;
    await this.query(
      `INSERT INTO users(id, display_name, phone, email, wallet_address, collateral_btc_address, fiat_currency, kyc_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO NOTHING`,
      [id, display_name, phone, email, wallet_address, collateral_btc_address, fiat_currency, kyc_status]
    );
  },

  async insertTx(tx) {
    const { from_user, to_user, amount_fiat, amount_musd, tx_hash, borrow_used, borrow_amount_musd, status } = tx;
    const res = await this.query(
      `INSERT INTO txs(from_user, to_user, amount_fiat, amount_musd, tx_hash, borrow_used, borrow_amount_musd, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [from_user, to_user, amount_fiat, amount_musd, tx_hash, borrow_used, borrow_amount_musd, status]
    );
    return res.rows[0];
  },

  // Add DB accessors for trips, trip_members, expenses, loans as needed for routes
};
