const { URL_MAPPING, updateUrlsInFile } = require('./update-urls');
const fs = require('fs');
const path = require('path');

describe('URL Update Script', () => {
  const testDir = path.join(__dirname, 'test-files');
  const testFile = path.join(testDir, 'test-config.js');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  beforeEach(() => {
    // Create test file with old URLs
    const testContent = `
const config = {
  pipelineUrl: 'https://cheery-syrniki-b5b6ca.netlify.app',
  contactsUrl: 'https://taupe-sprinkles-83c9ee.netlify.app',
  analyticsUrl: 'https://stupendous-twilight-64389a.netlify.app',
  researchUrl: 'https://clever-syrniki-4df87f.netlify.app',
  agencyUrl: 'https://serene-valkyrie-fec320.netlify.app',
  calendarUrl: 'https://capable-mermaid-3c73fa.netlify.app',
  whiteLabelUrl: 'https://moonlit-tarsier-239e70.netlify.app',
};
`;
    fs.writeFileSync(testFile, testContent);
  });

  test('URL_MAPPING contains expected mappings', () => {
    expect(URL_MAPPING).toHaveProperty('cheery-syrniki-b5b6ca.netlify.app');
    expect(URL_MAPPING).toHaveProperty('taupe-sprinkles-83c9ee.netlify.app');
    expect(URL_MAPPING['cheery-syrniki-b5b6ca.netlify.app']).toBe('pipeline.smartcrm.vip');
    expect(URL_MAPPING['taupe-sprinkles-83c9ee.netlify.app']).toBe('contacts.smartcrm.vip');
  });

  test('updateUrlsInFile replaces URLs correctly', () => {
    // Update the file
    updateUrlsInFile(testFile);

    // Read the updated content
    const updatedContent = fs.readFileSync(testFile, 'utf8');

    // Check that old URLs are replaced
    expect(updatedContent).not.toContain('cheery-syrniki-b5b6ca.netlify.app');
    expect(updatedContent).not.toContain('taupe-sprinkles-83c9ee.netlify.app');
    expect(updatedContent).not.toContain('stupendous-twilight-64389a.netlify.app');

    // Check that new URLs are present
    expect(updatedContent).toContain('pipeline.smartcrm.vip');
    expect(updatedContent).toContain('contacts.smartcrm.vip');
    expect(updatedContent).toContain('analytics.smartcrm.vip');
  });

  test('updateUrlsInFile handles files without URLs', () => {
    const noUrlFile = path.join(testDir, 'no-urls.js');
    const noUrlContent = 'const config = { someValue: 42 };';
    fs.writeFileSync(noUrlFile, noUrlContent);

    updateUrlsInFile(noUrlFile);

    const updatedContent = fs.readFileSync(noUrlFile, 'utf8');
    expect(updatedContent).toBe(noUrlContent);
  });

  test('updateUrlsInFile handles multiple occurrences', () => {
    const multiFile = path.join(testDir, 'multi-urls.js');
    const multiContent = `
const urls = [
  'https://cheery-syrniki-b5b6ca.netlify.app/api',
  'https://cheery-syrniki-b5b6ca.netlify.app/dashboard',
  'https://taupe-sprinkles-83c9ee.netlify.app/contacts',
];
`;
    fs.writeFileSync(multiFile, multiContent);

    updateUrlsInFile(multiFile);

    const updatedContent = fs.readFileSync(multiFile, 'utf8');
    expect(updatedContent).not.toContain('cheery-syrniki-b5b6ca.netlify.app');
    expect(updatedContent).not.toContain('taupe-sprinkles-83c9ee.netlify.app');
    expect(updatedContent).toContain('pipeline.smartcrm.vip');
    expect(updatedContent).toContain('contacts.smartcrm.vip');
  });
});