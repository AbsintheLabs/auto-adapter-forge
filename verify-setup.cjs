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

// Check 3: Frontend .env file
function checkEnvFile() {
  try {
    if (fs.existsSync('.env')) {
      allChecks.push('✅ Frontend .env file found');
      
      try {
        const envContent = fs.readFileSync('.env', 'utf8');
        
        if (envContent.includes('VITE_API_BASE_URL')) {
          allChecks.push('✅ API Base URL configured in .env');
        } else {
          warnings.push('⚠️  VITE_API_BASE_URL not found in .env');
          warnings.push('   Add: VITE_API_BASE_URL=http://localhost:3001');
        }
      } catch (readError) {
        warnings.push('⚠️  .env file exists but cannot be read');
        warnings.push('   Make sure it contains: VITE_API_BASE_URL');
      }
    } else {
      warnings.push('⚠️  Frontend .env file not found');
      warnings.push('   Create .env with: VITE_API_BASE_URL=http://localhost:3001');
    }
  } catch (error) {
    warnings.push('⚠️  Could not check frontend .env file');
  }
}

// Check API directory and configuration
function checkApiSetup() {
  if (!fs.existsSync('api')) {
    errors.push('❌ api/ directory not found');
    return;
  }
  
  allChecks.push('✅ API directory found');
  
  // Check API package.json
  if (!fs.existsSync('api/package.json')) {
    errors.push('❌ api/package.json not found');
    return;
  }
  
  allChecks.push('✅ API package.json found');
  
  // Check API node_modules
  if (fs.existsSync('api/node_modules')) {
    allChecks.push('✅ API dependencies installed');
  } else {
    warnings.push('⚠️  API dependencies not installed');
    warnings.push('   Run: cd api && npm install');
  }
  
  // Check API .env
  if (fs.existsSync('api/.env')) {
    allChecks.push('✅ API .env file found');
    
    try {
      const envContent = fs.readFileSync('api/.env', 'utf8');
      
      if (envContent.includes('OPENAI_API_KEY') || envContent.includes('LOVABLE_API_KEY')) {
        allChecks.push('✅ AI API key configured');
      } else {
        warnings.push('⚠️  AI API key not found in api/.env');
        warnings.push('   Add: OPENAI_API_KEY=your-key');
      }
    } catch (readError) {
      warnings.push('⚠️  api/.env exists but cannot be read');
    }
  } else {
    warnings.push('⚠️  api/.env file not found');
    warnings.push('   Create api/.env with your OpenAI API key');
  }
  
  // Check API server file
  if (!fs.existsSync('api/server.js')) {
    errors.push('❌ api/server.js not found');
  } else {
    allChecks.push('✅ API server file found');
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

// Removed: Supabase functions check (no longer using Supabase)

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
checkApiSetup();
checkSourceFiles();
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
  console.log('   1. Terminal 1: cd api && npm run dev');
  console.log('   2. Terminal 2: npm run dev');
  console.log('   3. Visit: http://localhost:5173');
} else {
  console.log('⚠️  Setup is mostly complete, but some warnings need attention.');
  console.log('\n📋 Next steps:');
  console.log('   1. Address the warnings above');
  console.log('   2. Terminal 1: cd api && npm run dev');
  console.log('   3. Terminal 2: npm run dev');
  console.log('   4. Visit: http://localhost:5173');
}

console.log('='.repeat(60) + '\n');

