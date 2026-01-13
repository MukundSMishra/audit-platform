import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_KEY in .env")
    exit(1)

print(f"🔌 Connecting to Supabase: {url}")
supabase: Client = create_client(url, key)

# --- THE INSPECTOR ---
def inspect_database():
    print("\n🔍 INSPECTING DATABASE TABLES...")
    
    # List of likely table names to check
    potential_tables = [
        "audit_results", 
        "audit_submissions", 
        "audit_items", 
        "checklist_responses", 
        "audits"
    ]
    
    found_table = False

    for table in potential_tables:
        try:
            # Fetch 1 row to see the columns
            response = supabase.table(table).select("*").limit(1).execute()
            
            print(f"\n📄 Table Found: '{table}'")
            found_table = True
            
            if response.data and len(response.data) > 0:
                # Get keys from the first row
                columns = list(response.data[0].keys())
                print(f"   ✅ Columns: {columns}")
                
                # Check for critical columns
                has_session = any("session" in c or "batch" in c for c in columns)
                has_question = any("question" in c or "item" in c for c in columns)
                has_answer = any("status" in c or "verdict" in c or "answer" in c for c in columns)
                
                if has_session and has_question and has_answer:
                    print("   🌟 PERFECT MATCH: This table looks like it holds audit data.")
                else:
                    print("   ⚠️  Warning: Might be missing key columns.")
            else:
                print("   ⚠️  Table exists but is empty (cannot fetch columns).")
                
        except Exception:
            # Table doesn't exist, ignore
            pass

    if not found_table:
        print("\n❌ NO AUDIT TABLES FOUND.")
        print("   We need to create a table to store the audit results.")
        print("   Please check your Supabase Dashboard -> Table Editor.")

if __name__ == "__main__":
    inspect_database()