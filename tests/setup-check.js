#!/usr/bin/env node
/**
 * Test Setup Validation
 * Run this before running tests to ensure everything is configured
 */

require('dotenv').config({ path: '.env' });

const requiredEnvVars = [
  'AWS_REGION',
  'API_URL',
  'COGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
  'TEST_ADMIN_EMAIL',
  'TEST_ADMIN_PASSWORD',
  'TEST_GROUPLEADER_EMAIL',
  'TEST_GROUPLEADER_PASSWORD',
  'TEST_PLAYER_EMAIL',
  'TEST_PLAYER_PASSWORD'
];

console.log('🔍 Checking test environment configuration...\n');

let hasErrors = false;

// Check if .env exists
const fs = require('fs');
if (!fs.existsSync('.env')) {
  console.error('❌ .env file not found!');
  console.log('   Create one by copying .env.example:');
  console.log('   cp .env.example .env\n');
  hasErrors = true;
} else {
  console.log('✅ .env file found\n');
}

// Check each required variable
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.includes('your-') || value.includes('XXXXXXXXX')) {
    console.error(`❌ ${varName} is not configured`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName} is set`);
  }
});

console.log('\n');

if (hasErrors) {
  console.error('❌ Configuration incomplete!\n');
  console.log('Before running tests, you need to:');
  console.log('1. Deploy infrastructure: cd ../terraform && terraform apply');
  console.log('2. Get outputs: terraform output');
  console.log('3. Update tests/.env with the values from terraform output');
  console.log('4. Run this check again: node setup-check.js\n');
  process.exit(1);
} else {
  console.log('✅ All configuration looks good!');
  console.log('You can now run: npm test\n');
  process.exit(0);
}
