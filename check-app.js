import fetch from 'node-fetch';

async function checkApp() {
  try {
    const response = await fetch('http://localhost:5000');
    if (response.ok) {
      console.log('✅ SmartCRM app is running on port 5000');
      const text = await response.text();
      console.log('Response contains:', text.substring(0, 200) + '...');
    } else {
      console.log('❌ App responded with status:', response.status);
    }
  } catch (error) {
    console.log('❌ Could not connect to SmartCRM app:', error.message);
  }
}

checkApp();