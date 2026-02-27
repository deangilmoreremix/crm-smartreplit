// Script to resend confirmation emails to admin accounts
const fetch = require('node-fetch');

const adminAccounts = [
  { email: 'dean@videoremix.io', name: 'Dean' },
  { email: 'samuel@videoremix.io', name: 'Samuel' },
  { email: 'victor@videoremix.io', name: 'Victor' },
];

async function resendConfirmationEmails() {
  console.log('🔄 Checking admin accounts and resending confirmation emails...\n');

  for (const admin of adminAccounts) {
    try {
      console.log(`📧 Processing ${admin.email}...`);

      // Try to generate password reset link (acts as confirmation)
      const response = await fetch('http://localhost:5000/api/bulk-import/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: admin.email,
          first_name: admin.name,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ ${admin.email}: Confirmation email sent successfully`);
      } else {
        console.log(`❌ ${admin.email}: ${result.error || 'Failed to send'}`);
      }
    } catch (error) {
      console.log(`❌ ${admin.email}: ${error.message}`);
    }

    console.log(''); // Add spacing
  }
}

// Run the script
resendConfirmationEmails()
  .then(() => {
    console.log('🎯 Admin confirmation email process completed');
  })
  .catch((error) => {
    console.error('Error:', error);
  });
