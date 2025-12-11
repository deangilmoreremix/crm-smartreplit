import { createRecorder } from './utils/recorder';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

async function recordAIGoalsDemo() {
  const recorder = await createRecorder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  try {
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    
    // Navigate to AI Goals page
    await recorder.navigate(`${baseUrl}/ai-goals`);
    await recorder.wait(2000);

    // Start recording
    await recorder.startRecording('ai-goals-feature');

    console.log('📸 Capturing AI Goals overview...');
    
    // Hover over different goal categories
    await recorder.hover('[data-testid="category-sales"]', 1000);
    await recorder.hover('[data-testid="category-marketing"]', 1000);
    await recorder.hover('[data-testid="category-customer-service"]', 1000);

    // Scroll through goals list
    await recorder.scroll(400, 2000);
    await recorder.wait(1500);

    // Click on a goal to expand details
    const goalCard = '[data-testid^="goal-card"]';
    await recorder.click(goalCard, 1500);

    // Show agent activity
    await recorder.scroll(200, 1500);
    await recorder.wait(2000);

    // Close goal details
    await recorder.click('[data-testid="button-close-goal"]', 1000);

    // Scroll back to top
    await recorder.scroll(-600, 2000);
    await recorder.wait(1000);

    // Stop recording
    await recorder.stopRecording();
    
    console.log('✅ AI Goals demo recorded successfully!');
  } catch (error) {
    console.error('❌ Error recording AI Goals demo:', error);
    throw error;
  } finally {
    await recorder.close();
  }
}

export default recordAIGoalsDemo;

// Run if called directly (ESM-safe check)
const currentFilePath = fileURLToPath(import.meta.url);
const scriptPath = resolve(process.cwd(), process.argv[1]);

if (currentFilePath === scriptPath || process.argv[1]?.includes('ai-goals-demo')) {
  recordAIGoalsDemo()
    .then(() => {
      console.log('✅ Demo generation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo generation failed:', error);
      process.exit(1);
    });
}
