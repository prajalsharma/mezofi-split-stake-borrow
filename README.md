# MezoFi - Split, Stake & Borrow Smart

**The ultimate web3 finance app combining Splitwise-style expense splitting, group staking pools, and Mezo-powered borrowing.**

![MezoFi Banner](https://via.placeholder.com/800x300/FF6B6B/FFFFFF?text=MezoFi)

## 🎆 Features

### 💱 QR Pay + Auto-Borrow
- **Static QR Codes**: Generate payment QR codes with optional amounts
- **Instant Scanning**: Camera-based QR code scanning with real-time detection
- **Auto-Borrow**: Automatically borrow MUSD against BTC collateral when balance is insufficient
- **Multi-Currency**: Support for USD, INR, EUR, GBP with real-time conversion to MUSD

### 🏖️ Trip Management + Staking
- **Group Creation**: Create trips and invite members
- **Pooled Staking**: Members can stake MUSD or borrow against BTC for group funds
- **Yield Generation**: Optional deposit into Mezo yield vaults
- **Smart Settlement**: Automatic distribution of stakes + yields minus expenses

### 🤖 AI Expense Manager
- **OCR Processing**: Upload receipt photos for automatic text extraction
- **Smart Categorization**: AI-powered expense categorization
- **Flexible Splitting**: Equal, percentage, or custom amount splits
- **MUSD Conversion**: All expenses stored in MUSD with fiat UX layer

### 🏦 Mezo Integration
- **Bitcoin Collateral**: Borrow MUSD against BTC holdings
- **Fixed Rates**: Transparent interest rates from Mezo protocol
- **Vault Staking**: Earn yield on pooled MUSD in Mezo vaults
- **On-Chain Settlement**: All transactions verified on Mezo network

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Bun package manager (recommended) or npm
- SQLite database
- Mezo API access (testnet/mainnet)

### Installation

```bash
# Clone the repository
git clone https://github.com/prajalsharma/mezofi-split-stake-borrow.git
cd mezofi-split-stake-borrow

# Install dependencies
bun install
# or: npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
bun run db:migrate
# or: npx drizzle-kit migrate

# Start development server
bun run dev
# or: npm run dev
```

### Environment Configuration

Edit `.env` with your settings:

```bash
# Essential Configuration
MEZO_API_KEY="your-mezo-api-key"
MEZO_NETWORK="testnet" # or "mainnet"
BETTER_AUTH_SECRET="your-auth-secret"
DATABASE_URL="file:./dev.db"

# Optional: OCR Processing
GOOGLE_CLOUD_VISION_API_KEY="your-vision-api-key"

# Optional: File Upload
UPLOADTHING_SECRET="your-uploadthing-secret"
```

## 🎨 Architecture

### Tech Stack
- **Frontend**: Next.js 13 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Drizzle ORM
- **Database**: SQLite (production: PostgreSQL)
- **Blockchain**: Mezo Network (Bitcoin L2)
- **Authentication**: Better Auth (wallet-based)
- **UI Components**: shadcn/ui + Radix

### Key Components

```
src/
├── app/                    # Next.js app router
│   ├── api/                # API endpoints
│   │   ├── pay/            # QR payment processing
│   │   ├── borrow/         # Mezo borrowing
│   │   ├── trips/          # Trip management
│   │   └── expenses/       # OCR expense processing
│   ├── dashboard/          # Main app dashboard
│   └── borrow/             # Borrowing interface
├── components/           # React components
│   ├── QRGenerator.tsx     # Payment QR generation
│   └── QRScanner.tsx       # QR scanning + payment
├── lib/                  # Core utilities
│   ├── mezoClient.ts       # Mezo SDK wrapper
│   └── pricing.ts          # Fiat ↔ MUSD conversion
└── db/                   # Database schema
    ├── schema.ts           # Drizzle schema
    └── migrations/         # SQL migrations
```

### Database Schema

**Core Tables**:
- `users` - User profiles and wallet addresses
- `groups` - Trip/group management
- `expenses` - Expense tracking (MUSD + fiat)
- `loans` - Mezo borrowing records
- `stakes` - Group staking positions
- `transactions` - Payment history

**New Tables**:
- `group_vaults` - Trip yield vault tracking
- `payment_requests` - QR code generation
- `receipt_ocr` - OCR processing results
- `notifications` - User notifications

## 💻 API Reference

### Payment API

```bash
# Generate QR code
GET /api/pay/qr?userId=123&amount=50&currency=USD

# Process payment
POST /api/pay
{
  "fromUserId": 1,
  "toUserId": 2,
  "amountFiat": 50,
  "fiatCurrency": "USD",
  "memo": "Dinner split"
}
```

### Borrowing API

```bash
# Create loan
POST /api/borrow
{
  "userId": 1,
  "amountMUSD": 100,
  "collateralBTC": 0.002,
  "durationDays": 30
}

# Get user loans
GET /api/borrow?userId=1
```

### Trip Management

```bash
# Create trip
POST /api/trips
{
  "name": "Tokyo Trip",
  "createdById": 1,
  "members": [2, 3, 4]
}

# Deposit stake
PUT /api/trips/deposit
{
  "tripId": 1,
  "userId": 1,
  "amountMUSD": 500,
  "stakeType": "musd"
}
```

### Expense Processing

```bash
# Upload receipt for OCR
POST /api/expenses
{
  "groupId": 1,
  "uploadedById": 1,
  "imageBase64": "base64-image-data"
}

# Create expense splits
PUT /api/expenses
{
  "expenseId": 1,
  "splitType": "equal",
  "splits": [
    {"userId": 1},
    {"userId": 2}
  ]
}
```

## 🧪 Testing

### Unit Tests

```bash
# Run tests
bun test
# or: npm test

# Run with coverage
bun test --coverage
```

### API Testing

Example cURL commands:

```bash
# Test QR generation
curl "http://localhost:3000/api/pay/qr?userId=1&amount=25&currency=USD"

# Test payment (requires users in database)
curl -X POST http://localhost:3000/api/pay \
  -H "Content-Type: application/json" \
  -d '{
    "fromUserId": 1,
    "toUserId": 2,
    "amountFiat": 25,
    "fiatCurrency": "USD"
  }'

# Test borrowing
curl -X POST http://localhost:3000/api/borrow \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "amountMUSD": 100,
    "durationDays": 30
  }'
```

### Demo Flow

1. **Setup Demo Users**:
   ```bash
   # Create test users in database
   bun run seed:demo
   ```

2. **QR Payment Flow**:
   - Navigate to `/dashboard`
   - Generate QR code with amount
   - Use second browser/device to scan and pay
   - Observe auto-borrow if insufficient balance

3. **Trip Flow**:
   - Create new trip with members
   - Each member deposits stake (MUSD or BTC-backed)
   - Add expenses throughout trip
   - Settle trip to distribute yields

4. **Expense OCR**:
   - Upload receipt image to trip
   - Review extracted merchant/amount
   - Create splits between members
   - Process payments

## 🔒 Security & Production

### Security Considerations
- **Custodial MUSD**: App holds MUSD balances (consider non-custodial alternatives)
- **Private Keys**: Store securely using HSM/KMS in production
- **API Keys**: Rotate Mezo API keys regularly
- **Input Validation**: All user inputs validated server-side
- **Rate Limiting**: Implement for payment and borrowing endpoints

### Production Deployment

1. **Database Migration**:
   ```bash
   # Use PostgreSQL for production
   DATABASE_URL="postgresql://user:pass@host:5432/mezofi"
   
   # Run migrations
   bun run db:migrate
   ```

2. **Environment Setup**:
   ```bash
   MEZO_NETWORK="mainnet"
   MEZO_API_KEY="prod-api-key"
   APP_ENV="production"
   LOG_LEVEL="warn"
   ```

3. **Deploy to Vercel/Railway**:
   ```bash
   # Vercel
   vercel --prod
   
   # Railway
   railway deploy
   ```

### Compliance Checklist

- [ ] **KYC/AML**: Implement user verification for loans > $X
- [ ] **Licenses**: Obtain money transmitter licenses as required
- [ ] **Audit**: Smart contract and API security audit
- [ ] **Insurance**: Consider coverage for custodial funds
- [ ] **Monitoring**: Set up error tracking and alerts
- [ ] **Backup**: Automated database backups
- [ ] **Compliance**: GDPR, CCPA data protection measures

## 📚 Resources

### Documentation
- [Mezo Network Docs](https://mezo.org/docs/)
- [Drizzle ORM Guide](https://orm.drizzle.team/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Better Auth Guide](https://www.better-auth.com/)

### Community
- [Discord](https://discord.gg/mezofi) - Community support
- [GitHub Issues](https://github.com/prajalsharma/mezofi-split-stake-borrow/issues) - Bug reports
- [Telegram](https://t.me/mezofi) - Updates and announcements

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork the repository
git clone https://github.com/yourusername/mezofi-split-stake-borrow.git

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
bun test

# Submit pull request
git push origin feature/your-feature-name
```

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🚀 Roadmap

- [ ] **Mobile App**: React Native implementation
- [ ] **Multi-Chain**: Expand beyond Mezo to other Bitcoin L2s
- [ ] **DeFi Integration**: Yield farming and liquidity mining
- [ ] **Social Features**: Friend requests and social payments
- [ ] **Advanced Analytics**: Spending insights and budgeting
- [ ] **Enterprise**: Business expense management
- [ ] **Decentralization**: Move toward non-custodial architecture

---

**Built with ❤️ by the MezoFi team** | **Powered by [Mezo Network](https://mezo.org)**