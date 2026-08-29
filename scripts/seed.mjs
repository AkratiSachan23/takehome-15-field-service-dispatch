import { seedDatabase } from '../src/lib/seed.js';

async function main() {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

main();
