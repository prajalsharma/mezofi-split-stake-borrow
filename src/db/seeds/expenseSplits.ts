import { db } from '@/db';
import { expenseSplits } from '@/db/schema';

async function main() {
    const sampleExpenseSplits = [
        // Expense 1: Tokyo Trip Hotel $450, EQUAL split, 4 members (users 1,2,3,4)
        {
            expenseId: 1,
            userId: 1,
            amount: 112.50,
            percentage: null,
            paid: true,
            paidAt: new Date('2024-03-20T10:30:00').toISOString(),
        },
        {
            expenseId: 1,
            userId: 2,
            amount: 112.50,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 1,
            userId: 3,
            amount: 112.50,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 1,
            userId: 4,
            amount: 112.50,
            percentage: null,
            paid: true,
            paidAt: new Date('2024-03-21T14:15:00').toISOString(),
        },

        // Expense 2: Tokyo Trip Dinner $125, EQUAL split, 4 members (users 1,2,3,4)
        {
            expenseId: 2,
            userId: 1,
            amount: 31.25,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 2,
            userId: 2,
            amount: 31.25,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 2,
            userId: 3,
            amount: 31.25,
            percentage: null,
            paid: true,
            paidAt: new Date('2024-03-19T18:45:00').toISOString(),
        },
        {
            expenseId: 2,
            userId: 4,
            amount: 31.25,
            percentage: null,
            paid: false,
            paidAt: null,
        },

        // Expense 3: Roommates Utilities $247, EQUAL split, 3 members (users 5,6,7)
        {
            expenseId: 3,
            userId: 5,
            amount: 82.33,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 3,
            userId: 6,
            amount: 82.33,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 3,
            userId: 7,
            amount: 82.34,
            percentage: null,
            paid: true,
            paidAt: new Date('2024-03-16T09:20:00').toISOString(),
        },

        // Expense 4: Roommates Groceries $156, PERCENTAGE split, 3 members (users 5,6,7)
        {
            expenseId: 4,
            userId: 5,
            amount: 62.40,
            percentage: 40.0,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 4,
            userId: 6,
            amount: 46.80,
            percentage: 30.0,
            paid: true,
            paidAt: new Date('2024-03-11T16:30:00').toISOString(),
        },
        {
            expenseId: 4,
            userId: 7,
            amount: 46.80,
            percentage: 30.0,
            paid: false,
            paidAt: null,
        },

        // Expense 5: Study Group Textbooks $320, EXACT split, 5 members (users 8,9,10,11,12)
        {
            expenseId: 5,
            userId: 8,
            amount: 80.00,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 5,
            userId: 9,
            amount: 80.00,
            percentage: null,
            paid: true,
            paidAt: new Date('2024-03-06T11:45:00').toISOString(),
        },
        {
            expenseId: 5,
            userId: 10,
            amount: 60.00,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 5,
            userId: 11,
            amount: 50.00,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 5,
            userId: 12,
            amount: 50.00,
            percentage: null,
            paid: true,
            paidAt: new Date('2024-03-07T13:20:00').toISOString(),
        },

        // Expense 6: Study Group Pizza $85, EQUAL split, 5 members (users 8,9,10,11,12)
        {
            expenseId: 6,
            userId: 8,
            amount: 17.00,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 6,
            userId: 9,
            amount: 17.00,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 6,
            userId: 10,
            amount: 17.00,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 6,
            userId: 11,
            amount: 17.00,
            percentage: null,
            paid: true,
            paidAt: new Date('2024-03-02T19:15:00').toISOString(),
        },
        {
            expenseId: 6,
            userId: 12,
            amount: 17.00,
            percentage: null,
            paid: false,
            paidAt: null,
        },

        // Expense 7: Weekend Getaway Cabin $890, PERCENTAGE split, 6 members (users 13,14,15,16,17,18)
        {
            expenseId: 7,
            userId: 13,
            amount: 222.50,
            percentage: 25.0,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 7,
            userId: 14,
            amount: 222.50,
            percentage: 25.0,
            paid: true,
            paidAt: new Date('2024-02-26T10:00:00').toISOString(),
        },
        {
            expenseId: 7,
            userId: 15,
            amount: 178.00,
            percentage: 20.0,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 7,
            userId: 16,
            amount: 133.50,
            percentage: 15.0,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 7,
            userId: 17,
            amount: 89.00,
            percentage: 10.0,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 7,
            userId: 18,
            amount: 44.50,
            percentage: 5.0,
            paid: true,
            paidAt: new Date('2024-02-27T15:30:00').toISOString(),
        },

        // Expense 8: Weekend Getaway Food $275, EXACT split, 6 members (users 13,14,15,16,17,18)
        {
            expenseId: 8,
            userId: 13,
            amount: 55.00,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 8,
            userId: 14,
            amount: 50.00,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 8,
            userId: 15,
            amount: 50.00,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 8,
            userId: 16,
            amount: 45.00,
            percentage: null,
            paid: true,
            paidAt: new Date('2024-02-21T12:45:00').toISOString(),
        },
        {
            expenseId: 8,
            userId: 17,
            amount: 40.00,
            percentage: null,
            paid: false,
            paidAt: null,
        },
        {
            expenseId: 8,
            userId: 18,
            amount: 35.00,
            percentage: null,
            paid: false,
            paidAt: null,
        },
    ];

    await db.insert(expenseSplits).values(sampleExpenseSplits);
    
    console.log('✅ Expense splits seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});