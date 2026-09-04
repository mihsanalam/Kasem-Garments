#!/bin/bash
# setup-eas-secret.sh
# Helper script to set up the GOOGLE_SERVICES_JSON environment variable in EAS
# Run this script after installing EAS CLI: npm install -g eas-cli

echo ""
echo "=== Setting up EAS Secret for google-services.json ==="
echo ""

# Read the google-services.json file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GOOGLE_SERVICES_PATH="$SCRIPT_DIR/../google-services.json"

if [ ! -f "$GOOGLE_SERVICES_PATH" ]; then
    echo "ERROR: google-services.json not found at $GOOGLE_SERVICES_PATH"
    exit 1
fi

CONTENT=$(cat "$GOOGLE_SERVICES_PATH")

echo "Found google-services.json. Setting as EAS environment variable..."
echo ""

# Set the environment variable in EAS
eas env:create --scope project --name GOOGLE_SERVICES_JSON --value "$CONTENT" --type string --visibility sensitive

echo ""
echo "=== Done! ==="
echo "The GOOGLE_SERVICES_JSON secret has been set in your EAS project."
echo "It will be available during EAS Build to generate the google-services.json file."
