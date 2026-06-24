import { User } from './database.js';

async function verifyAllUsers() {
  try {
    const updatedCount = await User.update(
      { email_verified: true },
      { where: {} }
    );
    console.log(`Successfully verified ${updatedCount[0]} user accounts.`);
    process.exit(0);
  } catch (error) {
    console.error('Error verifying user accounts:', error);
    process.exit(1);
  }
}

verifyAllUsers();
