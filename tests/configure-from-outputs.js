#!/usr/bin/env node
/**
 * Auto-populate .env file from Terraform outputs
 * Usage: node configure-from-outputs.js [path-to-outputs-file]
 */

const fs = require('fs');
const path = require('path');

// Default paths
const outputsFile = process.argv[2] || '../deployment-outputs.txt';
const envExampleFile = '.env.example';
const envFile = '.env';

console.log('🔧 Configuring tests from Terraform outputs...\n');

// Check if outputs file exists
if (!fs.existsSync(outputsFile)) {
  console.error(`❌ Terraform outputs file not found: ${outputsFile}`);
  console.log('\nPlease run:');
  console.log('  cd terraform');
  console.log('  terraform output > ../deployment-outputs.txt');
  console.log('  cd ../tests');
  console.log('  node configure-from-outputs.js\n');
  process.exit(1);
}

// Read the outputs file
const outputsContent = fs.readFileSync(outputsFile, 'utf8');
console.log('✅ Found terraform outputs file\n');

// Parse terraform outputs
const outputs = {};
const lines = outputsContent.split('\n');

lines.forEach(line => {
  // Match pattern: key = "value" or key = value
  const match = line.match(/^(\w+)\s*=\s*"?([^"]+)"?$/);
  if (match) {
    const [, key, value] = match;
    outputs[key] = value.trim();
  }
});

// Map terraform outputs to env variables
const envVars = {
  AWS_REGION: outputs.region || 'us-east-1',
  API_URL: outputs.api_gateway_url,
  COGNITO_USER_POOL_ID: outputs.cognito_user_pool_id,
  COGNITO_CLIENT_ID: outputs.cognito_user_pool_client_id,
};

// Read .env.example as template
if (!fs.existsSync(envExampleFile)) {
  console.error(`❌ ${envExampleFile} not found`);
  process.exit(1);
}

let envContent = fs.readFileSync(envExampleFile, 'utf8');

// Replace placeholders with actual values
Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    // Replace the line with the key
    const regex = new RegExp(`^${key}=.*$`, 'm');
    envContent = envContent.replace(regex, `${key}=${value}`);
    console.log(`✅ Set ${key}`);
  } else {
    console.log(`⚠️  Warning: ${key} not found in outputs`);
  }
});

// Write to .env
fs.writeFileSync(envFile, envContent);
console.log(`\n✅ Created ${envFile}`);

console.log('\n📋 Configuration summary:');
console.log('  Region:', envVars.AWS_REGION);
console.log('  API URL:', envVars.API_URL);
console.log('  User Pool ID:', envVars.COGNITO_USER_POOL_ID);
console.log('  Client ID:', envVars.COGNITO_CLIENT_ID);

console.log('\n✅ Configuration complete!');
console.log('\nNext steps:');
console.log('  1. Review .env file (optional)');
console.log('  2. Run: npm run check');
console.log('  3. Run: npm test\n');
