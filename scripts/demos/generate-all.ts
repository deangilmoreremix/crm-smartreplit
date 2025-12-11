import dashboardDemo from './dashboard-demo';
import aiGoalsDemo from './ai-goals-demo';
import pipelineDemo from './pipeline-demo';
import contactsDemo from './contacts-demo';

async function generateAllDemos() {
  console.log('🎬 Starting demo generation for SmartCRM...\n');

  const demos = [
    { name: 'Dashboard Overview', fn: dashboardDemo },
    { name: 'AI Goals', fn: aiGoalsDemo },
    { name: 'Pipeline Management', fn: pipelineDemo },
    { name: 'Contacts', fn: contactsDemo },
  ];

  for (const demo of demos) {
    try {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🎥 Recording: ${demo.name}`);
      console.log('='.repeat(50));
      
      await demo.fn();
      
      console.log(`✅ ${demo.name} completed\n`);
    } catch (error) {
      console.error(`❌ Failed to record ${demo.name}:`, error);
      // Continue with other demos even if one fails
    }
  }

  console.log('\n🎉 All demos generated!');
  console.log('📁 Check the demos/output folder for MP4 files');
}

generateAllDemos()
  .then(() => {
    console.log('\n✅ Demo generation pipeline completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Demo generation pipeline failed:', error);
    process.exit(1);
  });
