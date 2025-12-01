import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing API Keys in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the JSON file
const rawData = fs.readFileSync('./src/data/factoriesAct.json', 'utf-8');
const auditData = JSON.parse(rawData);

async function upload() {
  console.log(`🚀 Starting upload for ${auditData.length} items...`);

  // MAP THE NEW FLATTENED STRUCTURE
  const rows = auditData.map(item => ({
    id: item.audit_item_id,
    section_reference: item.meta_data.section_reference,
    category: item.meta_data.category,
    
    // UPDATED: Direct access (removed .audit_content)
    question_text: item.question_text,
    simplified_guidance: item.simplified_guidance,
    
    // UPDATED: New columns we added
    applicability_criteria: item.applicability_criteria, 
    legal_text: item.legal_text,

    risk_level: item.risk_profile.severity_level,
    penalty_details: item.risk_profile.penalty_details,
    evidence_required: item.evidence_requirements
  }));

  const { data, error } = await supabase
    .from('factories_act_checklist')
    .upsert(rows);

  if (error) {
    console.error('❌ Upload Failed:', error.message);
  } else {
    console.log('✅ SUCCESS! All questions uploaded with new schema.');
  }
}

upload();