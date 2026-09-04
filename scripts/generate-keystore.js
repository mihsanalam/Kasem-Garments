/**
 * generate-keystore.js
 * 
 * This script generates the keystore file from an environment variable.
 * Similar to google-services.json, the .keystore file should not be committed to git.
 * 
 * Environment variable: ANDROID_KEYSTORE_BASE64 (base64-encoded keystore content)
 */

const fs = require('fs');
const path = require('path');

const keystoreBase64 = process.env.ANDROID_KEYSTORE_BASE64;
const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD;
const keyAlias = process.env.ANDROID_KEY_ALIAS;
const keyPassword = process.env.ANDROID_KEY_PASSWORD;

if (!keystoreBase64) {
  console.log('⚠️  ANDROID_KEYSTORE_BASE64 environment variable is not set.');
  console.log('   Skipping keystore generation.');
  process.exit(0);
}

try {
  const outputPath = path.join(__dirname, '..', 'my-upload-key.keystore');
  const buffer = Buffer.from(keystoreBase64, 'base64');
  
  fs.writeFileSync(outputPath, buffer);
  console.log('✅  Keystore file generated successfully from environment variable.');
} catch (error) {
  console.error('❌  Failed to generate keystore file:', error.message);
  process.exit(1);
}
