// Test Deal Service with Supabase REST API
const baseURL = 'https://YOUR_PROJECT_REF.supabase.co/rest/v1';
const apiKey = 'YOUR_SUPABASE_ANON_KEY

const headers = {
  'Content-Type': 'application/json',
  'apikey': apiKey,
  'Authorization': `Bearer ${apiKey}`,
  'Prefer': 'return=representation'
};

async function testDealAPI() {
  console.log('🧪 Testing Deal Service with Supabase REST API...');
  
  try {
    // Test 1: Create deal
    console.log('\n=== Testing CREATE DEAL ===');
    const createData = {
      title: 'Test Enterprise Deal',
      description: 'Testing deal creation via REST API',
      value: 50000,
      stage: 'discovery',
      status: 'active',
      priority: 'high',
      contact_id: 'test-contact-123',
      contact_name: 'Test Contact',
      company: 'Test Company Inc',
      assignee_id: 'test-user-456',
      assignee_name: 'Test Assignee',
      expected_close_date: '2025-03-15',
      probability: 60,
      ai_score: 75,
      tags: ['test', 'enterprise'],
      activities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const createResponse = await fetch(`${baseURL}/deals`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createData)
    });
    
    if (createResponse.ok) {
      const created = await createResponse.json();
      console.log('✓ Create successful:', created);
      
      if (created.length > 0) {
        const dealId = created[0].id;
        
        // Test 2: Get deal
        console.log('\n=== Testing GET DEAL ===');
        const getResponse = await fetch(`${baseURL}/deals?id=eq.${dealId}`, {
          method: 'GET',
          headers
        });
        
        if (getResponse.ok) {
          const deal = await getResponse.json();
          console.log('✓ Get successful:', deal);
        } else {
          console.log('✗ Get failed:', getResponse.status);
        }
        
        // Test 3: Update deal
        console.log('\n=== Testing UPDATE DEAL ===');
        const updateResponse = await fetch(`${baseURL}/deals?id=eq.${dealId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            value: 75000,
            stage: 'proposal',
            updated_at: new Date().toISOString()
          })
        });
        
        if (updateResponse.ok) {
          const updated = await updateResponse.json();
          console.log('✓ Update successful:', updated);
        } else {
          console.log('✗ Update failed:', updateResponse.status);
        }
        
        // Test 4: Delete deal
        console.log('\n=== Testing DELETE DEAL ===');
        const deleteResponse = await fetch(`${baseURL}/deals?id=eq.${dealId}`, {
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
  
  console.log('\n🏁 Deal REST API tests completed!');
}

testDealAPI();
