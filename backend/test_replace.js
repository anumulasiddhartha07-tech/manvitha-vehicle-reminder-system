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

async function testDelete() {
  try {
    const adminToken = await login('admin@manivtha.com', 'adminpassword');
    const docsRes = await fetch(`${BASE_URL}/documents`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const documents = await docsRes.json();
    const sampleDoc = documents[0];
    const docId = sampleDoc.id;

    console.log(`Testing delete for doc ID: ${docId}, type: ${sampleDoc.document_type}`);

    const res = await fetch(`${BASE_URL}/documents/${docId}?document_type=${sampleDoc.document_type}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response body: ${text}`);
  } catch (err) {
    console.error(err);
  }
}

testDelete();
