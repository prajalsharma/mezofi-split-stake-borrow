import { db } from '@/db';
import { expenses } from '@/db/schema';

async function main() {
    const sampleExpenses = [
        {
            groupId: 1,
            description: 'Hotel booking for 3 nights in Shibuya',
            amount: 450.00,
            paidById: 1,
            category: 'Accommodation',
            receiptUrl: null,
            date: new Date('2024-12-15').toISOString(),
            splitType: 'EQUAL',
            createdAt: new Date('2024-12-15').toISOString(),
        },
        {
            groupId: 1,
            description: 'Group dinner at izakaya restaurant',
            amount: 125.00,
            paidById: 2,
            category: 'Food',
            receiptUrl: null,
            date: new Date('2024-12-18').toISOString(),
            splitType: 'EQUAL',
            createdAt: new Date('2024-12-18').toISOString(),
        },
        {
            groupId: 1,
            description: 'Train tickets from Narita to Shibuya',
            amount: 85.50,
            paidById: 3,
            category: 'Transport',
            receiptUrl: null,
            date: new Date('2024-12-14').toISOString(),
            splitType: 'PERCENTAGE',
            createdAt: new Date('2024-12-14').toISOString(),
        },
        {
            groupId: 2,
            description: 'Monthly utilities bill (electricity, water, gas)',
            amount: 247.00,
            paidById: 1,
            category: 'Accommodation',
            receiptUrl: null,
            date: new Date('2024-12-01').toISOString(),
            splitType: 'EQUAL',
            createdAt: new Date('2024-12-01').toISOString(),
        },
        {
            groupId: 2,
            description: 'Weekly grocery shopping at Whole Foods',
            amount: 156.75,
            paidById: 2,
            category: 'Food',
            receiptUrl: null,
            date: new Date('2024-12-10').toISOString(),
            splitType: 'EXACT',
            createdAt: new Date('2024-12-10').toISOString(),
        },
        {
            groupId: 2,
            description: 'Internet and cable TV monthly bill',
            amount: 89.99,
            paidById: 3,
            category: 'Accommodation',
            receiptUrl: null,
            date: new Date('2024-12-05').toISOString(),
            splitType: 'EQUAL',
            createdAt: new Date('2024-12-05').toISOString(),
        },
        {
            groupId: 3,
            description: 'Ski lift passes for the weekend',
            amount: 320.00,
            paidById: 2,
            category: 'Activities',
            receiptUrl: null,
            date: new Date('2024-12-22').toISOString(),
            splitType: 'EQUAL',
            createdAt: new Date('2024-12-22').toISOString(),
        },
        {
            groupId: 3,
            description: 'Restaurant dinner at mountain lodge',
            amount: 180.50,
            paidById: 3,
            category: 'Food',
            receiptUrl: null,
            date: new Date('2024-12-23').toISOString(),
            splitType: 'PERCENTAGE',
            createdAt: new Date('2024-12-23').toISOString(),
        },
    ];

    await db.insert(expenses).values(sampleExpenses);
    
    console.log('✅ Expenses seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});