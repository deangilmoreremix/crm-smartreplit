import { createRecorder } from './utils/recorder';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

async function recordContactsDemo() {
  const recorder = await createRecorder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  try {
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    
    // Navigate to Contacts page
    await recorder.navigate(`${baseUrl}/contacts`);
    await recorder.wait(2000);

    // Start recording
    await recorder.startRecording('contacts-management');

    console.log('📸 Capturing Contacts overview...');
    
    // Scroll through contacts list
    await recorder.scroll(400, 2000);
    await recorder.wait(1000);

    // Hover over filter options
    await recorder.hover('[data-testid="filter-all-contacts"]', 800);
    await recorder.hover('[data-testid="filter-leads"]', 800);
    await recorder.hover('[data-testid="filter-customers"]', 800);

    // Search functionality
    await recorder.click('[data-testid="input-search-contacts"]', 500);
    await recorder.type('[data-testid="input-search-contacts"]', 'John', 1000);
    await recorder.wait(1500);

    // Clear search
    await recorder.click('[data-testid="button-clear-search"]', 1000);

    // Click on a contact to view details
    await recorder.click('[data-testid^="contact-card"]', 1500);
    await recorder.wait(2000);

    // Scroll through contact details
    await recorder.scroll(300, 1500);
    await recorder.wait(1500);

    // Close contact details
    await recorder.click('[data-testid="button-close-contact"]', 1000);

    // Scroll back to top
    await recorder.scroll(-700, 2000);
    await recorder.wait(1000);

    // Stop recording
    await recorder.stopRecording();
    
    console.log('✅ Contacts demo recorded successfully!');
  } catch (error) {
    console.error('❌ Error recording Contacts demo:', error);
    throw error;
  } finally {
    await recorder.close();
  }
}

export default recordContactsDemo;

// Run if called directly (ESM-safe check)
const currentFilePath = fileURLToPath(import.meta.url);
const scriptPath = resolve(process.cwd(), process.argv[1]);

if (currentFilePath === scriptPath || process.argv[1]?.includes('contacts-demo')) {
  recordContactsDemo()
    .then(() => {
      console.log('✅ Demo generation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo generation failed:', error);
      process.exit(1);
    });
}
