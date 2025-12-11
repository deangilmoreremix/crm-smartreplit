// Test Contact API Service integration with Supabase
const ContactAPIService = {
  baseURL: 'https://YOUR_PROJECT_REF.supabase.co/rest/v1',
  apiKey: 'YOUR_SUPABASE_ANON_KEY
  
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      'Prefer': 'return=representation'
    };
  },

  async testCreate() {
    console.log('\n=== Testing Contact Creation ===');
    const testContact = {
      first_name: 'API',
      last_name: 'Test',
      email: `apitest-${Date.now()}@example.com`,
      phone: '+1 555 111 2222',
      company: 'API Test Corp',
      position: 'Test Manager',
      status: 'lead',
      source: 'API Integration',
      tags: ['test', 'api'],
      notes: 'Created via Contact API service test'
    };
    
    try {
      const response = await fetch(`${this.baseURL}/contacts`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(testContact)
      });
      
      const result = await response.json();
      const contact = Array.isArray(result) ? result[0] : result;
      console.log('✓ Contact created:', { id: contact.id, name: `${contact.first_name} ${contact.last_name}`, email: contact.email });
      return contact;
    } catch (error) {
      console.error('✗ Create failed:', error);
    }
  },

  async testRead(contactId) {
    console.log('\n=== Testing Contact Read ===');
    try {
      const response = await fetch(`${this.baseURL}/contacts?id=eq.${contactId}`, {
        headers: this.getHeaders()
      });
      
      const result = await response.json();
      const contact = Array.isArray(result) ? result[0] : result;
      if (contact) {
        console.log('✓ Contact retrieved:', { id: contact.id, name: `${contact.first_name} ${contact.last_name}` });
        return contact;
      } else {
        console.log('✗ Contact not found');
      }
    } catch (error) {
      console.error('✗ Read failed:', error);
    }
  },

  async testUpdate(contactId) {
    console.log('\n=== Testing Contact Update ===');
    try {
      const updateData = {
        position: 'Senior Test Manager',
        notes: 'Updated via Contact API service test',
        updated_at: new Date().toISOString()
      };
      
      const response = await fetch(`${this.baseURL}/contacts?id=eq.${contactId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData)
      });
      
      const result = await response.json();
      const contact = Array.isArray(result) ? result[0] : result;
      if (contact) {
        console.log('✓ Contact updated:', { id: contact.id, position: contact.position });
        return contact;
      }
    } catch (error) {
      console.error('✗ Update failed:', error);
    }
  },

  async testList() {
    console.log('\n=== Testing Contact List ===');
    try {
      const response = await fetch(`${this.baseURL}/contacts?limit=3&order=created_at.desc`, {
        headers: this.getHeaders()
      });
      
      const contacts = await response.json();
      console.log(`✓ Retrieved ${contacts.length} contacts`);
      contacts.forEach((c, i) => {
        console.log(`  ${i+1}. ${c.first_name} ${c.last_name} (${c.email}) - ${c.company}`);
      });
      return contacts;
    } catch (error) {
      console.error('✗ List failed:', error);
    }
  }
};

async function runContactAPITests() {
  console.log('🧪 Starting Contact API Service Tests with Supabase...');
  
  // Test list first to see existing contacts
  await ContactAPIService.testList();
  
  // Test create
  const newContact = await ContactAPIService.testCreate();
  if (!newContact) return;
  
  // Test read
  await ContactAPIService.testRead(newContact.id);
  
  // Test update
  await ContactAPIService.testUpdate(newContact.id);
  
  // Test read again to verify update
  await ContactAPIService.testRead(newContact.id);
  
  console.log('\n✅ All Contact API tests completed!');
}

runContactAPITests();
