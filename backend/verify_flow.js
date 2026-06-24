import { User, Vehicle, VehicleDocument, Alert, Setting } from './database.js';
import bcrypt from 'bcryptjs';

const runTests = async () => {
  console.log('--- STARTING RBAC & ALERTS INTEGRATION TESTS ---');

  try {
    // 1. Check if database has users
    const adminUser = await User.findOne({ where: { email: 'admin@manivtha.com' } });
    const staffUser = await User.findOne({ where: { email: 'staff@manivtha.com' } });
    const managementUser = await User.findOne({ where: { email: 'manager@manivtha.com' } });

    if (!adminUser || !staffUser || !managementUser) {
      throw new Error('Seed users not found in database. Make sure DB is synced and seeded.');
    }
    console.log('✔ Default users verified in DB.');

    // 2. Test status check (deactivating a user)
    console.log('Testing User Deactivation...');
    staffUser.status = 'Inactive';
    await staffUser.save();

    // Verify status is Inactive in DB
    const updatedStaff = await User.findOne({ where: { email: 'staff@manivtha.com' } });
    if (updatedStaff.status !== 'Inactive') {
      throw new Error('Failed to set user status to Inactive');
    }
    console.log('✔ User status deactivated successfully.');

    // Re-activate user
    staffUser.status = 'Active';
    await staffUser.save();
    console.log('✔ User status re-activated successfully.');

    // 3. Verify roles assignments
    if (adminUser.role !== 'ADMIN' || staffUser.role !== 'STAFF' || managementUser.role !== 'MANAGEMENT') {
      throw new Error('Incorrect roles seeded. Admin, Staff, and Management must have ADMIN, STAFF, and MANAGEMENT uppercase roles.');
    }
    console.log('✔ User roles validated (ADMIN, STAFF, MANAGEMENT).');

    // 4. Verify Alert column extension mapping
    console.log('Testing Alert Model properties...');
    const testAlert = await Alert.findOne();
    if (testAlert) {
      // Validate that virtuals are properly mapped
      if (testAlert.alert_type !== testAlert.document_type) {
        throw new Error('Virtual attribute mapping for alert_type failed');
      }
      if (testAlert.days_left !== testAlert.days_remaining) {
        throw new Error('Virtual attribute mapping for days_left failed');
      }
      console.log('✔ Alert columns and virtual fields validated.');
    } else {
      console.log('⚠ No alerts in DB to test virtual properties.');
    }

    console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ Integration tests failed:', error);
    process.exit(1);
  }
};

runTests();
