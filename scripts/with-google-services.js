/**
 * with-google-services.js
 * 
 * Custom Expo config plugin that generates google-services.json from
 * the GOOGLE_SERVICES_JSON environment variable during `expo prebuild`.
 * 
 * This allows you to keep google-services.json out of git while still
 * making it available for EAS Build.
 */

const fs = require('fs');
const path = require('path');

function withGoogleServices(config) {
  // This plugin runs during `expo prebuild` config resolution
  // Generate the file if the environment variable is set
  if (process.env.GOOGLE_SERVICES_JSON) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICES_JSON);
      
      // Write to project root (where app.config.js expects it)
      const projectRoot = config.modRequest 
        ? config.modRequest.projectRoot 
        : process.cwd();
      
      const filePath = path.join(projectRoot, 'google-services.json');
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2));
      console.log('✅  google-services.json generated from GOOGLE_SERVICES_JSON env var');
    } catch (e) {
      console.error('❌  Error generating google-services.json:', e.message);
      // Don't throw - allow build to proceed (will fail later with a clearer error)
    }
  } else {
    console.log('ℹ️  GOOGLE_SERVICES_JSON not set - using existing google-services.json if present');
  }

  return config;
}

module.exports = withGoogleServices;
