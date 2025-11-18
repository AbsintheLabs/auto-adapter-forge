#!/usr/bin/env node

/**
 * Setup Verification Script for Absinthe Adapter Config Generator
 * Run this script to check if your environment is configured correctly
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying Absinthe Adapter Config Generator Setup...\n');

let allChecks = [];
let errors = [];
let warnings = [];

// Check 1: Node.js version
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  
  if (major >= 18) {
    allChecks.push('✅ Node.js version: ' + version + ' (>= 18)');
  } else {
    errors.push('❌ Node.js version: ' + version + ' (requires >= 18)');
  }
}

// Check 2: package.json exists
function checkPackageJson() {
  if (fs.existsSync('package.json')) {
    allChecks.push('✅ package.json found');
    
    // Check if dependencies are installed
    if (fs.existsSync('node_modules')) {
      allChecks.push('✅ node_modules found (dependencies installed)');
    } else {
      warnings.push('⚠️  node_modules not found - run: npm install');
    }
  } else {
    errors.push('❌ package.json not found');
  }
}

// Check 3: .env file
function checkEnvFile() {
  if (fs.existsSync('.env')) {
    allChecks.push('✅ .env file found');
    
    const envContent = fs.readFileSync('.env', 'utf8');
    
    if (envContent.includes('VITE_SUPABASE_URL') && envContent.includes('VITE_SUPABASE_PUBLISHABLE_KEY')) {
      allChecks.push('✅ Supabase configuration found in .env');
    } else {
      warnings.push('⚠️  Supabase configuration incomplete in .env');
      warnings.push('   Required: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY');
    }
  } else {
    warnings.push('⚠️  .env file not found');
    warnings.push('   Copy .env.local.example to .env and fill in your values');
  }
}

// Check 4: Required source files
function checkSourceFiles() {
  const requiredFiles = [
    'src/pages/Index.tsx',
    'src/lib/api.ts',
    'src/lib/schemas/index.ts',
    'src/components/AdapterForm.tsx',
    'src/components/ConfigOutput.tsx',
    'src/components/DeploymentDialog.tsx',
    'src/components/NaturalLanguageInput.tsx',
    'src/components/ProgressIndicator.tsx',
  ];
  
  let allFound = true;
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      errors.push(`❌ Missing required file: ${file}`);
      allFound = false;
    }
  });
  
  if (allFound) {
    allChecks.push('✅ All required source files found');
  }
}

// Check 5: Supabase functions
function checkSupabaseFunctions() {
  const functions = [
    'supabase/functions/classify-adapter/index.ts',
    'supabase/functions/generate-config/index.ts',
    'supabase/functions/deploy-railway/index.ts',
  ];
  
  let allFound = true;
  functions.forEach(func => {
    if (!fs.existsSync(func)) {
      errors.push(`❌ Missing Supabase function: ${func}`);
      allFound = false;
    }
  });
  
  if (allFound) {
    allChecks.push('✅ All Supabase edge functions found');
  }
}

// Check 6: Schemas
function checkSchemas() {
  const schemas = [
    'src/lib/schemas/univ2.ts',
    'src/lib/schemas/univ3.ts',
    'src/lib/schemas/morpho.ts',
    'src/lib/schemas/printr.ts',
    'src/lib/schemas/erc20.ts',
  ];
  
  let allFound = true;
  schemas.forEach(schema => {
    if (!fs.existsSync(schema)) {
      errors.push(`❌ Missing schema: ${schema}`);
      allFound = false;
    }
  });
  
  if (allFound) {
    allChecks.push('✅ All adapter schemas found');
  }
}

// Run all checks
checkNodeVersion();
checkPackageJson();
checkEnvFile();
checkSourceFiles();
checkSupabaseFunctions();
checkSchemas();

// Print results
console.log('✅ Successful Checks:');
allChecks.forEach(check => console.log('   ' + check));

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(warning => console.log('   ' + warning));
}

if (errors.length > 0) {
  console.log('\n❌ Errors:');
  errors.forEach(error => console.log('   ' + error));
  console.log('\n⚠️  Please fix the errors above before proceeding.\n');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));

if (warnings.length === 0) {
  console.log('🎉 All checks passed! Your setup looks good.');
  console.log('\n📋 Next steps:');
  console.log('   1. Make sure Supabase edge functions are deployed');
  console.log('   2. Run: npm run dev');
  console.log('   3. Visit: http://localhost:5173');
} else {
  console.log('⚠️  Setup is mostly complete, but some warnings need attention.');
  console.log('\n📋 Next steps:');
  console.log('   1. Address the warnings above');
  console.log('   2. Deploy Supabase edge functions');
  console.log('   3. Run: npm run dev');
}

console.log('='.repeat(60) + '\n');

