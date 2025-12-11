// Test Contact API Service with Supabase Edge Functions
const baseURL = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/contacts';
const apiKey = 'YOUR_SUPABASE_ANON_KEY

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`
};

async function testEdgeFunction(action, payload) {
  try {
    console.log(`\n=== Testing ${action.toUpperCase()} ===`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(baseURL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.log(`✗ ${action} failed:`, response.status, response.statusText);
      console.log('Error response:', result);
      return null;
    }
    
    console.log(`✓ ${action} successful:`, result);
    return result;
  } catch (error) {
    console.error(`✗ ${action} error:`, error.message);
    return null;
  }
}

async function runEdgeFunctionTests() {
  console.log('🧪 Testing Contact API Service with Supabase Edge Functions...');
  
  // Test 1: List contacts
  const listResult = await testEdgeFunction('list', {
    action: 'list',
    limit: 5
  });
  
  // Test 2: Create contact
  const createResult = await testEdgeFunction('create', {
    action: 'create',
    contact: {
      firstName: 'Edge',
      lastName: 'Function',
      email: `edge-test-${Date.now()}@example.com`,
      phone: '+1 555 333 4444',
      company: 'Edge Function Co',
      title: 'Test Manager',
      status: 'lead',
      sources: ['API Test'],
      tags: ['test', 'edge-function']
    }
  });
  
  if (createResult && createResult.contact) {
    const contactId = createResult.contact.id;
    
    // Test 3: Get specific contact
    await testEdgeFunction('get', {
      action: 'get',
      contactId: contactId
    });
    
    // Test 4: Update contact
    await testEdgeFunction('update', {
      action: 'update',
      contactId: contactId,
      updates: {
        title: 'Senior Test Manager',
        company: 'Updated Edge Function Co'
      }
    });
    
    // Test 5: Delete contact
    await testEdgeFunction('delete', {
      action: 'delete',
      contactId: contactId
    });
  }
  
  console.log('\n🏁 Edge Function tests completed!');
}

runEdgeFunctionTests();
