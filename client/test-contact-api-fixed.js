// Test Contact API Service with Supabase REST API
const baseURL = 'https://YOUR_PROJECT_REF.supabase.co/rest/v1';
const apiKey = 'YOUR_SUPABASE_ANON_KEY

const headers = {
  'Content-Type': 'application/json',
  'apikey': apiKey,
  'Authorization': `Bearer ${apiKey}`,
  'Prefer': 'return=representation'
};

async function testRestAPI() {
  console.log('🧪 Testing Contact API Service with Supabase REST API...');
  
  try {
    // Test 1: Create contact
    console.log('\n=== Testing CREATE ===');
    const createData = {
      first_name: 'REST',
      last_name: 'Test',
      email: `rest-test-${Date.now()}@example.com`,
      phone: '+1 555 REST',
      company: 'REST API Co',
      position: 'Test Manager',
      status: 'lead',
      source: 'API Test',
      tags: ['test', 'rest-api'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const createResponse = await fetch(`${baseURL}/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createData)
    });
    
    if (createResponse.ok) {
      const created = await createResponse.json();
      console.log('✓ Create successful:', created);
      
      if (created.length > 0) {
        const contactId = created[0].id;
        
        // Test 2: Get contact
        console.log('\n=== Testing GET ===');
        const getResponse = await fetch(`${baseURL}/contacts?id=eq.${contactId}`, {
          method: 'GET',
          headers
        });
        
        if (getResponse.ok) {
          const contact = await getResponse.json();
          console.log('✓ Get successful:', contact);
        } else {
          console.log('✗ Get failed:', getResponse.status);
        }
        
        // Test 3: Update contact
        console.log('\n=== Testing UPDATE ===');
        const updateResponse = await fetch(`${baseURL}/contacts?id=eq.${contactId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            position: 'Senior Test Manager',
            updated_at: new Date().toISOString()
          })
        });
        
        if (updateResponse.ok) {
          const updated = await updateResponse.json();
          console.log('✓ Update successful:', updated);
        } else {
          console.log('✗ Update failed:', updateResponse.status);
        }
        
        // Test 4: Delete contact
        console.log('\n=== Testing DELETE ===');
        const deleteResponse = await fetch(`${baseURL}/contacts?id=eq.${contactId}`, {
          method: 'DELETE',
          headers
        });
        
        if (deleteResponse.ok) {
          console.log('✓ Delete successful');
        } else {
          console.log('✗ Delete failed:', deleteResponse.status);
        }
      }
    } else {
      console.log('✗ Create failed:', createResponse.status, await createResponse.text());
    }
    
  } catch (error) {
    console.error('✗ Test error:', error.message);
  }
  
  console.log('\n🏁 Contact REST API tests completed!');
}

testRestAPI();
