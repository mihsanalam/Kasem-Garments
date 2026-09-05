/**
 * generate-google-services.js
 * 
 * This script generates the google-services.json file from an environment variable.
 * It runs before the build process (via npm prebuild script) to ensure the file
 * exists for EAS Build without committing it to git.
 * 
 * Supports two modes:
 * 1. File mode (--type file): GOOGLE_SERVICES_JSON contains path to the uploaded file
 * 2. String mode (--type string): GOOGLE_SERVICES_JSON contains raw JSON content
 * 
 * Also runs via eas-build-pre-install hook for maximum compatibility.
 */

const fs = require('fs');
const path = require('path');

const googleServicesEnv = process.env.GOOGLE_SERVICES_JSON;

if (!googleServicesEnv) {
  console.log('⚠️  GOOGLE_SERVICES_JSON environment variable is not set.');
  console.log('   Skipping google-services.json generation.');
  console.log('   If you need Firebase services, set this variable in your EAS environment.');
  process.exit(0);
}

const outputPath = path.join(__dirname, '..', 'google-services.json');

try {
  // Check if env var is a file path (--type file mode)
  if (fs.existsSync(googleServicesEnv)) {
    // File mode: copy from the uploaded file path
    fs.copyFileSync(googleServicesEnv, outputPath);
    console.log('✅  google-services.json copied from EAS file upload');
  } else {
    // String mode: parse and write JSON content
    const parsed = JSON.parse(googleServicesEnv);
    fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
    console.log('✅  google-services.json generated from GOOGLE_SERVICES_JSON env var');
  }
} catch (error) {
  console.error('❌  Failed to generate google-services.json:', error.message);
  console.error('   Env value (first 100 chars):', googleServicesEnv.substring(0, 100));
  process.exit(1);
}
