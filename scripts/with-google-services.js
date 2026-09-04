/**
 * with-google-services.js
 * 
 * Custom Expo config plugin that generates google-services.json from
 * the GOOGLE_SERVICES_JSON environment variable during `expo prebuild`.
 * 
 * Supports two modes:
 * 1. File mode (--type file): Env var contains path to the file uploaded via EAS
 * 2. String mode (--type string): Env var contains the raw JSON content
 * 
 * This allows you to keep google-services.json out of git while still
 * making it available for EAS Build.
 */

const fs = require('fs');
const path = require('path');

function withGoogleServices(config) {
  const googleServicesEnv = process.env.GOOGLE_SERVICES_JSON;
  
  if (!googleServicesEnv) {
    console.log('ℹ️  GOOGLE_SERVICES_JSON not set - using existing google-services.json if present');
    return config;
  }

  // Write to project root (where app.config.js expects it)
  const projectRoot = config.modRequest 
    ? config.modRequest.projectRoot 
    : process.cwd();
  
  const outputPath = path.join(projectRoot, 'google-services.json');

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
  } catch (e) {
    console.error('❌  Error generating google-services.json:', e.message);
    console.error('   Env value (first 100 chars):', googleServicesEnv.substring(0, 100));
    // Don't throw - allow build to proceed (will fail later with a clearer error)
  }

  return config;
}

module.exports = withGoogleServices;
