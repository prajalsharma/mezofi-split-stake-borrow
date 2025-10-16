import { db } from '@/db';
import { loans } from '@/db/schema';

async function main() {
    const sampleLoans = [
        {
            userId: 1,
            amount: 5000.00,
            collateralAmount: 6500.00,
            interestRate: 0.055,
            duration: 180,
            status: 'ACTIVE',
            startDate: new Date('2024-11-15').toISOString(),
            endDate: new Date('2025-05-14').toISOString(),
            createdAt: new Date('2024-11-10').toISOString(),
        },
        {
            userId: 2,
            amount: 12000.00,
            collateralAmount: 15000.00,
            interestRate: 0.0725,
            duration: 365,
            status: 'ACTIVE',
            startDate: new Date('2024-10-01').toISOString(),
            endDate: new Date('2025-10-01').toISOString(),
            createdAt: new Date('2024-09-28').toISOString(),
        },
        {
            userId: 3,
            amount: 8500.00,
            collateralAmount: 10200.00,
            interestRate: 0.06,
            duration: 270,
            status: 'PAID',
            startDate: new Date('2024-09-20').toISOString(),
            endDate: new Date('2025-06-17').toISOString(),
            createdAt: new Date('2024-09-15').toISOString(),
        }
    ];

    await db.insert(loans).values(sampleLoans);
    
    console.log('✅ Loans seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});