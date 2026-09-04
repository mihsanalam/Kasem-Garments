/**
 * generate-google-services.js
 * 
 * This script generates the google-services.json file from an environment variable.
 * It runs before the build process (via npm prebuild script) to ensure the file
 * exists for EAS Build without committing it to git.
 * 
 * Environment variable: GOOGLE_SERVICES_JSON (contains the full JSON content)
 */

const fs = require('fs');
const path = require('path');

const googleServicesContent = process.env.GOOGLE_SERVICES_JSON;

if (!googleServicesContent) {
  console.log('⚠️  GOOGLE_SERVICES_JSON environment variable is not set.');
  console.log('   Skipping google-services.json generation.');
  console.log('   If you need Firebase services, set this variable in your EAS environment.');
  process.exit(0);
}

try {
  // Parse to validate JSON, then write to file
  const parsed = JSON.parse(googleServicesContent);
  const outputPath = path.join(__dirname, '..', 'google-services.json');
  
  fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
  console.log('✅  google-services.json generated successfully from environment variable.');
} catch (error) {
  console.error('❌  Failed to generate google-services.json:', error.message);
  process.exit(1);
}
