import { createRecorder } from './utils/recorder';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

async function recordDashboardDemo() {
  const recorder = await createRecorder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  try {
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    
    // Navigate to dashboard
    await recorder.navigate(`${baseUrl}/dashboard`);
    await recorder.wait(2000);

    // Start recording
    await recorder.startRecording('dashboard-overview');

    // Scroll through dashboard slowly
    console.log('📸 Capturing dashboard overview...');
    await recorder.scroll(300, 2000);
    await recorder.wait(1000);
    await recorder.scroll(-300, 2000);
    await recorder.wait(1000);

    // Hover over key stats
    await recorder.hover('[data-testid="stat-total-contacts"]', 800);
    await recorder.hover('[data-testid="stat-active-deals"]', 800);
    await recorder.hover('[data-testid="stat-revenue"]', 800);

    // Scroll to activity section
    await recorder.scroll(400, 2000);
    await recorder.wait(2000);

    // Stop recording
    await recorder.stopRecording();
    
    console.log('✅ Dashboard demo recorded successfully!');
  } catch (error) {
    console.error('❌ Error recording dashboard demo:', error);
    throw error;
  } finally {
    await recorder.close();
  }
}

export default recordDashboardDemo;

// Run if called directly (ESM-safe check)
const currentFilePath = fileURLToPath(import.meta.url);
const scriptPath = resolve(process.cwd(), process.argv[1]);

if (currentFilePath === scriptPath || process.argv[1]?.includes('dashboard-demo')) {
  recordDashboardDemo()
    .then(() => {
      console.log('✅ Demo generation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo generation failed:', error);
      process.exit(1);
    });
}
