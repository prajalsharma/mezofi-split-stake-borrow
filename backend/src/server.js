// backend/src/server.js
import express from 'express';
import http from 'http';
import cors from 'cors';
import { init as initNotify } from './notify';
import registerRoute from './routes/register';
import resolveRoute from './routes/resolve';
import payRoute from './routes/pay';
import topupRoute from './routes/topup';
import tripRoute from './routes/trip';
import expenseRoute from './routes/expense';
import borrowRoute from './routes/borrow';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/register', registerRoute);
app.use('/api/resolve', resolveRoute);
app.use('/api/pay', payRoute);
app.use('/api/topup', topupRoute);
app.use('/api/trip', tripRoute);
app.use('/api/expense', expenseRoute);
app.use('/api/borrow', borrowRoute);

// Initialize notifications
initNotify(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
