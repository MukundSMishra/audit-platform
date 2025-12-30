import { createClient } from '@supabase/supabase-js'

const supabase = createClient('YOUR_URL', 'YOUR_ANON_KEY')

// Function triggered when Intern selects a file
const handleFileUpload = async (file, auditItem) => {
  try {
    // 1. Upload to Supabase Storage
    const fileName = `${auditItem.audit_item_id}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audit-evidence')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // 2. Get Public URL (Vision AI needs a URL to read)
    const { data: { publicUrl } } = supabase.storage
      .from('audit-evidence')
      .getPublicUrl(fileName)

    // 3. Call the Gatekeeper (Async - Non-blocking UI)
    // Update UI state to "Scanning..." here
    setUploadStatus(auditItem.id, 'scanning');

    const { data: gatekeeperResult, error: funcError } = await supabase.functions
      .invoke('gatekeeper-check', {
        body: {
          fileUrl: publicUrl,
          documentType: auditItem.capture_instructions.document_name, // e.g., "Registration Certificate"
          checkInstruction: auditItem.ai_logic.gatekeeper_check,      // e.g., "Check if document is Form A"
          evidenceId: '...' // if you created a DB record
        }
      })

    // 4. Handle Verdict
    if (gatekeeperResult.status === 'REJECTED') {
      // Show Red Error Toast
      toast.error(`Upload Rejected: ${gatekeeperResult.reason}`)
      setUploadStatus(auditItem.id, 'error'); // Mark card red
    } else {
      // Show Green Success
      toast.success("Document Verified!")
      setUploadStatus(auditItem.id, 'success'); // Mark card green
    }

  } catch (error) {
    console.error("Upload failed:", error)
    toast.error("Upload failed")
  }
}