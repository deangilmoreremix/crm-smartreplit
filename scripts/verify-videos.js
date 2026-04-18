const fs = require('fs');
const path = require('path');

const videoDir = './public/videos/features';
const requiredVideos = [
    'contact-enrichment.mp4',
    'bulk-operations.mp4', 
    'lead-scoring.mp4'
];

console.log('=== Video Validation Report ===\n');

let allValid = true;

requiredVideos.forEach(video => {
    const videoPath = path.join(videoDir, video);
    const exists = fs.existsSync(videoPath);
    
    if (exists) {
        const stats = fs.statSync(videoPath);
        const sizeMB = stats.size / (1024 * 1024);
        const validSize = sizeMB < 5;
        
        console.log(`✓ ${video}`);
        console.log(`  Size: ${sizeMB.toFixed(2)} MB (${validSize ? '✓ Under 5MB' : '✗ Exceeds 5MB'})`);
        console.log(`  Modified: ${new Date(stats.mtime).toLocaleDateString()}`);
        
        if (!validSize) {
            allValid = false;
            console.log(`  WARNING: Video exceeds size limit!`);
        }
    } else {
        console.log(`✗ ${video} - NOT FOUND`);
        allValid = false;
    }
    console.log('');
});

if (allValid) {
    console.log('✅ All videos validated successfully!');
    console.log('   - All 3 videos recorded');
    console.log('   - All videos under 5MB');
    console.log('   - Videos ready for embedding');
    process.exit(0);
} else {
    console.log('❌ Validation failed!');
    process.exit(1);
}
