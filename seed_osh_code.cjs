const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// 1. READ THE JSON FILE
// Since we are in a .cjs file, __dirname works natively
const jsonPath = path.join(__dirname, 'src', 'data', 'codeONOccupationalSafety.json');

try {
  // Check if file exists before reading
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File not found at: ${jsonPath}`);
  }
} catch (err) {
  console.error("❌ Error locating file:", err.message);
  process.exit(1);
}

const rawData = fs.readFileSync(jsonPath, 'utf-8');
const oshData = JSON.parse(rawData);

// 2. INITIALIZE SUPABASE
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Supabase URL or Key is missing.");
  console.log("Looking for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log(`🚀 Starting Seed for ${oshData.length} items...`);

  const rowsToInsert = oshData.map(item => ({
    audit_item_id: item.audit_item_id,
    question_text: item.question_text,
    
    // New Schema Fields
    workflow_type: item.workflow_type || 'manual_observation',
    capture_instructions: item.capture_instructions || {},
    ui_config: item.ui_config || {},
    ai_logic: item.ai_logic || {},
    
    // Metadata
    risk_level: item.risk_level,
    category: item.meta_data?.category || 'General'
  }));

  const { data, error } = await supabase
    .from('code_on_occupational_safety_checklist')
    .upsert(rowsToInsert, { onConflict: 'audit_item_id' });

  if (error) {
    console.error("❌ Error seeding data:", error);
    if (error.code === '42501') {
      console.log("\n💡 TIP: Permission denied. Your 'VITE_SUPABASE_ANON_KEY' may restrict writing.");
      console.log("   Try adding 'SUPABASE_SERVICE_ROLE_KEY' to your .env and using that instead.");
    }
  } else {
    console.log("✅ Successfully populated the OSH Code Checklist table!");
  }
}

seedDatabase();