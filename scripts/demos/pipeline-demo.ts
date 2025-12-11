import { createRecorder } from './utils/recorder';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

async function recordPipelineDemo() {
  const recorder = await createRecorder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  try {
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    
    // Navigate to Pipeline page
    await recorder.navigate(`${baseUrl}/pipeline`);
    await recorder.wait(2000);

    // Start recording
    await recorder.startRecording('pipeline-management');

    console.log('📸 Capturing Pipeline overview...');
    
    // Pan across pipeline stages
    await recorder.scroll(300, 2000);
    await recorder.wait(1000);

    // Hover over deal cards in different stages
    await recorder.hover('[data-testid="deal-card-prospecting"]', 1000);
    await recorder.hover('[data-testid="deal-card-qualification"]', 1000);
    await recorder.hover('[data-testid="deal-card-proposal"]', 1000);

    // Simulate drag interaction (hover to show drag handle)
    await recorder.hover('[data-testid^="drag-handle"]', 800);
    await recorder.wait(1000);

    // Click on a deal to view details
    await recorder.click('[data-testid^="deal-card"]', 1500);
    await recorder.wait(2000);

    // Close deal details
    await recorder.click('[data-testid="button-close-deal"]', 1000);

    // Scroll back
    await recorder.scroll(-300, 2000);
    await recorder.wait(1000);

    // Stop recording
    await recorder.stopRecording();
    
    console.log('✅ Pipeline demo recorded successfully!');
  } catch (error) {
    console.error('❌ Error recording Pipeline demo:', error);
    throw error;
  } finally {
    await recorder.close();
  }
}

export default recordPipelineDemo;

// Run if called directly (ESM-safe check)
const currentFilePath = fileURLToPath(import.meta.url);
const scriptPath = resolve(process.cwd(), process.argv[1]);

if (currentFilePath === scriptPath || process.argv[1]?.includes('pipeline-demo')) {
  recordPipelineDemo()
    .then(() => {
      console.log('✅ Demo generation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo generation failed:', error);
      process.exit(1);
    });
}
