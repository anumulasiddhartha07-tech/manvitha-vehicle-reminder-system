const BASE_URL = 'http://https://manvitha-vehicle-reminder-system-1.onrender.com/api';

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}`);
  }
  const data = await res.json();
  return data.token;
}

async function runTests() {
  console.log('--- STARTING RBAC & ENDPOINTS INTEGRATION TEST ---');
  try {
    // 1. Authenticate as different roles
    const adminToken = await login('admin@manivtha.com', 'adminpassword');
    const staffToken = await login('staff@manivtha.com', 'staffpassword');
    const managerToken = await login('manager@manivtha.com', 'managerpassword');
    console.log('✅ Authentication successful for Admin, Staff, and Management');

    // 2. Fetch documents list (Admin and Staff access)
    const docsRes = await fetch(`${BASE_URL}/documents`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!docsRes.ok) throw new Error('Failed to fetch documents list');
    const documents = await docsRes.json();
    console.log(`✅ Documents list fetched successfully: returned ${documents.length} records`);

    // Get a sample document to test replace/delete
    if (documents.length === 0) {
      throw new Error('No documents found in seed to perform integration tests');
    }
    const sampleDoc = documents[0];
    const docId = sampleDoc.id; // e.g. "1-insurance"

    // 3. Test Replace Document - Management Role (Should get 403)
    const replaceMgmtRes = await fetch(`${BASE_URL}/documents/${docId}/replace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        document_type: sampleDoc.document_type,
        expiry_date: '2027-01-01',
        document_number: 'TEST-MGMT-REPLACE'
      })
    });
    if (replaceMgmtRes.status === 403) {
      console.log('✅ RBAC check: Management role is blocked from replacing document (403 Forbidden)');
    } else {
      throw new Error(`RBAC check failed: Management role received status ${replaceMgmtRes.status} on replace document`);
    }

    // 4. Test Replace Document - Staff Role (Should succeed 200)
    const replaceStaffRes = await fetch(`${BASE_URL}/documents/${docId}/replace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        document_type: sampleDoc.document_type,
        expiry_date: '2027-01-01',
        document_number: 'TEST-STAFF-REPLACE'
      })
    });
    if (replaceStaffRes.ok) {
      console.log('✅ RBAC check: Staff role successfully replaced document (200 OK)');
    } else {
      throw new Error(`Replace document failed for Staff role: status ${replaceStaffRes.status}`);
    }

    // 5. Test Delete Document - Staff Role (Should get 403)
    const deleteStaffRes = await fetch(`${BASE_URL}/documents/${docId}?document_type=${sampleDoc.document_type}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    if (deleteStaffRes.status === 403) {
      console.log('✅ RBAC check: Staff role is blocked from deleting document (403 Forbidden)');
    } else {
      throw new Error(`RBAC check failed: Staff role received status ${deleteStaffRes.status} on delete document`);
    }

    // 6. Test Delete Document - Admin Role (Should succeed 200)
    const deleteAdminRes = await fetch(`${BASE_URL}/documents/${docId}?document_type=${sampleDoc.document_type}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (deleteAdminRes.ok) {
      console.log('✅ RBAC check: Admin role successfully cleared/deleted document metadata (200 OK)');
    } else {
      throw new Error(`Delete document failed for Admin: status ${deleteAdminRes.status}`);
    }

    // 7. Verify Alert Resolution - Resolve via Admin Role (Should succeed 200)
    // Find an active alert first
    const alertsRes = await fetch(`${BASE_URL}/alerts?status=Expiring Soon`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!alertsRes.ok) throw new Error('Failed to fetch alerts stats');
    const alertsData = await alertsRes.json();
    const activeAlerts = alertsData.alerts || [];

    if (activeAlerts.length > 0) {
      const targetAlert = activeAlerts[0];
      const resolveRes = await fetch(`${BASE_URL}/alerts/${targetAlert.id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ notes: 'Resolved manually during integration tests' })
      });
      if (resolveRes.ok) {
        console.log(`✅ Alert Resolution: Alert ID ${targetAlert.id} successfully marked as Resolved`);
      } else {
        throw new Error(`Resolve alert failed: status ${resolveRes.status}`);
      }
    } else {
      console.log('ℹ️ Alert Resolution: Skipping resolution check (no active seed alerts found)');
    }

    // 8. Verify Email Settings & Logs
    const settingsRes = await fetch(`${BASE_URL}/email-settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (settingsRes.ok) {
      const emailConfig = await settingsRes.json();
      console.log('✅ Email Settings: Retrieved active alert configuration', emailConfig);
    } else {
      throw new Error(`Fetch email settings failed: status ${settingsRes.status}`);
    }

    const testEmailRes = await fetch(`${BASE_URL}/send-test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ recipient_email: 'test_audit@manivtha.com' })
    });
    if (testEmailRes.ok) {
      console.log('✅ Verification Dispatch: Simulated test email sent successfully');
    } else {
      throw new Error(`Send test email failed: status ${testEmailRes.status}`);
    }

    const emailLogsRes = await fetch(`${BASE_URL}/email-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (emailLogsRes.ok) {
      const logs = await emailLogsRes.json();
      console.log(`✅ Email Alert Logs: Fetched ${logs.length} logged email dispatches successfully`);
    } else {
      throw new Error(`Fetch email logs failed: status ${emailLogsRes.status}`);
    }

    console.log('\n🎉 ALL RBAC AND NEW REST ENDPOINTS TESTED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('\n❌ INTEGRATION TESTS ENCOUNTERED ERROR:', error.message);
    process.exit(1);
  }
}

runTests();
