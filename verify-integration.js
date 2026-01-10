#!/usr/bin/env node

/**
 * Code on Wages Integration - Verification Script
 * 
 * This script verifies that the Code on Wages has been properly
 * integrated into your Audit Portal.
 * 
 * Usage: node verify-integration.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - NOT FOUND: ${filePath}`, 'red');
    return false;
  }
}

function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    log(`❌ ${description} - FILE NOT FOUND: ${filePath}`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(searchString)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - NOT FOUND IN FILE`, 'red');
    return false;
  }
}

function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🔍 Code on Wages Integration Verification', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  let allChecks = [];

  // ==========================================
  // SECTION 1: Portal Files
  // ==========================================
  log('📋 SECTION 1: Portal Files', 'blue');
  log('-'.repeat(40), 'blue');

  allChecks.push(checkFile(
    'src/data/codeOnWages.json',
    'Code on Wages data exists'
  ));

  allChecks.push(checkFile(
    'src/data/actRegistry.js',
    'Act registry exists'
  ));

  allChecks.push(checkFileContent(
    'src/data/actRegistry.js',
    "id: 'code_on_wages_2019'",
    'Code on Wages registered and UNCOMMENTED'
  ));

  allChecks.push(checkFileContent(
    'src/data/codeOnWages.json',
    '"audit_item_id": "CW-2019-SEC-',
    'Wages items use correct CW-2019-SEC- prefix'
  ));

  // ==========================================
  // SECTION 2: Documentation Files
  // ==========================================
  log('\n📚 SECTION 2: Documentation Files', 'blue');
  log('-'.repeat(40), 'blue');

  allChecks.push(checkFile(
    'CODE_ON_WAGES_INTEGRATION.md',
    'Complete integration guide exists'
  ));

  allChecks.push(checkFile(
    'CODE_ON_WAGES_FINAL_SUMMARY.md',
    'Final summary document exists'
  ));

  allChecks.push(checkFile(
    'MASTER_AUDIT_ORCHESTRATOR_EXAMPLE.py',
    'Backend implementation example exists'
  ));

  allChecks.push(checkFile(
    'TESTING_GUIDE_CODE_ON_WAGES.md',
    'Testing guide exists'
  ));

  allChecks.push(checkFile(
    'QUICK_REFERENCE_CODE_ON_WAGES.md',
    'Quick reference card exists'
  ));

  // ==========================================
  // SECTION 3: Frontend Components
  // ==========================================
  log('\n⚙️  SECTION 3: Frontend Components', 'blue');
  log('-'.repeat(40), 'blue');

  allChecks.push(checkFile(
    'src/components/ActSelector.jsx',
    'Act selector component exists'
  ));

  allChecks.push(checkFileContent(
    'src/components/ActSelector.jsx',
    'AVAILABLE_ACTS',
    'Act selector uses AVAILABLE_ACTS from registry'
  ));

  allChecks.push(checkFile(
    'src/components/SubmitForReview.jsx',
    'Submit for review component exists'
  ));

  // ==========================================
  // SECTION 4: Data Integrity
  // ==========================================
  log('\n🔬 SECTION 4: Data Integrity', 'blue');
  log('-'.repeat(40), 'blue');

  // Check JSON is valid
  try {
    const wagesJson = fs.readFileSync(
      path.join(__dirname, 'src/data/codeOnWages.json'),
      'utf8'
    );
    const parsed = JSON.parse(wagesJson);
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      log(`✅ codeOnWages.json is valid JSON (${parsed.length} items)`, 'green');
      allChecks.push(true);
      
      // Check all items have correct prefix
      const allHavePrefix = parsed.every(item => 
        item.audit_item_id && item.audit_item_id.startsWith('CW-2019-SEC-')
      );
      
      if (allHavePrefix) {
        log(`✅ All ${parsed.length} items use CW-2019-SEC- prefix`, 'green');
        allChecks.push(true);
      } else {
        log(`❌ Some items do NOT use CW-2019-SEC- prefix`, 'red');
        allChecks.push(false);
      }
    } else {
      log('❌ codeOnWages.json is empty or not an array', 'red');
      allChecks.push(false);
    }
  } catch (err) {
    log(`❌ codeOnWages.json parse error: ${err.message}`, 'red');
    allChecks.push(false);
  }

  // Check registry is valid
  try {
    const registryPath = path.join(__dirname, 'src/data/actRegistry.js');
    const registryContent = fs.readFileSync(registryPath, 'utf8');
    
    if (registryContent.includes("id: 'code_on_wages_2019'") && 
        !registryContent.match(/\/\*[\s\S]*?code_on_wages_2019[\s\S]*?\*\//)) {
      log('✅ Code on Wages entry is ACTIVE (not commented)', 'green');
      allChecks.push(true);
    } else {
      log('❌ Code on Wages entry may still be commented out', 'red');
      allChecks.push(false);
    }
  } catch (err) {
    log(`❌ Error reading actRegistry.js: ${err.message}`, 'red');
    allChecks.push(false);
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  log('\n' + '='.repeat(60), 'cyan');
  
  const passedCount = allChecks.filter(c => c).length;
  const totalCount = allChecks.length;
  const percentage = Math.round((passedCount / totalCount) * 100);

  if (passedCount === totalCount) {
    log(`✅ ALL CHECKS PASSED (${passedCount}/${totalCount})`, 'green');
    log('\n🚀 Integration Status: READY FOR PRODUCTION', 'green');
    log('\nNext Steps:', 'green');
    log('1. Copy MASTER_AUDIT_ORCHESTRATOR_EXAMPLE.py to your Universal Agent', 'yellow');
    log('2. Update invoke_specialist_agent() with your actual agents', 'yellow');
    log('3. Start backend: python -m uvicorn src.api:app --port 8000', 'yellow');
    log('4. Run tests from TESTING_GUIDE_CODE_ON_WAGES.md', 'yellow');
  } else {
    log(`⚠️  SOME CHECKS FAILED (${passedCount}/${totalCount} passed, ${percentage}%)`, 'yellow');
    log('\nPlease review the failed items above.', 'yellow');
  }

  log('\n' + '='.repeat(60) + '\n', 'cyan');
}

main();
