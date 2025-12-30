import React, { useState, useEffect } from 'react';
import {
	Plus,
	FileText,
	Upload,
	X,
	Edit2,
	Trash2,
	CheckCircle,
	Clock,
	AlertCircle,
	ArrowLeft,
	File,
	Loader2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import Modal from './shared/Modal';

const ContractManagement = ({ client, firmName, location, onBack, onStartAudit }) => {
	// Use client object if available, fallback to direct props for backward compatibility
	const displayFirmName = client?.company_name || firmName;
	const displayLocation = client?.city ? `${client.city}, ${client.state}` : location;

	const [contracts, setContracts] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [editingIndex, setEditingIndex] = useState(null);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [feedbackModal, setFeedbackModal] = useState({
		open: false,
		title: '',
		message: '',
		type: 'info',
		confirmText: 'OK'
	});
	const [deleteModal, setDeleteModal] = useState({ open: false, index: null });
	const [formData, setFormData] = useState({
		contractTitle: '',
		contractType: 'msa',
		agreementFile: null,
		auditStatus: 'ready'
	});

	const contractTypes = [
		{ value: 'nda', label: 'Non-Disclosure Agreement (NDA)' },
		{ value: 'msa', label: 'Master Service Agreement (MSA)' },
		{ value: 'sow', label: 'Statement of Work (SOW)' },
		{ value: 'purchase', label: 'Purchase Agreement' },
		{ value: 'sales', label: 'Sales Contract' },
		{ value: 'service', label: 'Service Agreement' },
		{ value: 'lease', label: 'Lease Agreement' },
		{ value: 'employment', label: 'Employment Contract' },
		{ value: 'other', label: 'Other' }
	];

	// Fetch contracts from Supabase on mount
	useEffect(() => {
		fetchContracts();
	}, [client]);

	const fetchContracts = async () => {
		try {
			setLoading(true);
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				setContracts([]);
				return;
			}

			let query = supabase
				.from('business_audits')
				.select('*')
				.eq('user_id', user.id)
				.order('uploaded_at', { ascending: false });

			if (client?.id) {
				query = query.eq('client_id', client.id);
			}

			const { data, error } = await query;

			if (error) throw error;

			// Transform DB data to match component state structure
			const transformedContracts = (data || []).map(contract => ({
				id: contract.id,
				contractTitle: contract.contract_name,
				contractType: contract.contract_type,
				agreementFile: {
					name: contract.file_name,
					size: contract.file_size,
					path: contract.file_path
				},
				auditStatus: contract.status,
				uploadedAt: contract.uploaded_at
			}));

			setContracts(transformedContracts);
		} catch (error) {
			console.error('Error fetching contracts:', error);
			openFeedback({
				title: 'Load Failed',
				message: 'Failed to load contracts. Please refresh the page.',
				type: 'error'
			});
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setFormData({
			contractTitle: '',
			contractType: 'msa',
			agreementFile: null,
			auditStatus: 'ready'
		});
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const openFeedback = ({ title, message, type = 'info', confirmText = 'OK' }) => {
		setFeedbackModal({ open: true, title, message, type, confirmText });
	};

	const handleFileChange = (e, fieldName) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const allowedTypes = [
			'application/pdf',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/msword'
		];
		if (!allowedTypes.includes(file.type)) {
			openFeedback({
				title: 'Invalid File Type',
				message: 'Please upload only PDF or DOCX files.',
				type: 'warning'
			});
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			openFeedback({
				title: 'File Too Large',
				message: 'File size should not exceed 10MB.',
				type: 'warning'
			});
			return;
		}

		setFormData((prev) => ({
			...prev,
			[fieldName]: {
				name: file.name,
				size: file.size,
				type: file.type,
				uploadedAt: new Date().toISOString()
			}
		}));
	};

	const handleRemoveFile = (fieldName) => {
		setFormData((prev) => ({ ...prev, [fieldName]: null }));
	};

	const handleAddContract = async () => {
		if (!formData.contractTitle.trim()) {
			openFeedback({
				title: 'Missing Contract Title',
				message: 'Please provide a Contract Title to continue.',
				type: 'warning'
			});
			return;
		}
		if (!formData.contractType) {
			openFeedback({
				title: 'Select Contract Type',
				message: 'Please choose a Contract Type.',
				type: 'warning'
			});
			return;
		}
		if (!formData.agreementFile) {
			openFeedback({
				title: 'Agreement Required',
				message: 'Please upload the executed agreement to proceed.',
				type: 'warning'
			});
			return;
		}

		try {
			setUploading(true);
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				openFeedback({
					title: 'Login Required',
					message: 'You must be logged in to upload contracts.',
					type: 'warning'
				});
				return;
			}

			if (editingIndex !== null) {
				// Update existing contract
				const existingContract = contracts[editingIndex];
				const { error } = await supabase
					.from('business_audits')
					.update({
						contract_name: formData.contractTitle,
						contract_type: formData.contractType
					})
					.eq('id', existingContract.id);

				if (error) throw error;
				setEditingIndex(null);
			} else {
				// Upload new contract
				const fileExt = formData.agreementFile.name.split('.').pop();
				const fileName = `${user.id}/${Date.now()}_${formData.contractTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;

				// Upload file to storage
				const { error: uploadError } = await supabase.storage
					.from('audit-docs')
					.upload(fileName, formData.agreementFile, {
						cacheControl: '3600',
						upsert: false
					});

				if (uploadError) throw uploadError;

				// Insert record into database
				const { error: dbError } = await supabase
					.from('business_audits')
					.insert({
						contract_name: formData.contractTitle,
						contract_type: formData.contractType,
						file_path: fileName,
						file_name: formData.agreementFile.name,
						file_size: formData.agreementFile.size,
						status: 'ready',
						user_id: user.id,
						client_id: client?.id || null
					});

				if (dbError) throw dbError;
			}

			// Refresh the contracts list
			await fetchContracts();
			resetForm();
			setShowModal(false);
			setShowSuccessModal(true);
		} catch (error) {
			console.error('Error uploading contract:', error);
			openFeedback({
				title: 'Upload Failed',
				message: 'Failed to upload contract: ' + error.message,
				type: 'error'
			});
		} finally {
			setUploading(false);
		}
	};

	const handleEditContract = (index) => {
		setEditingIndex(index);
		setFormData(contracts[index]);
		setShowModal(true);
	};

	const handleDeleteContract = (index) => {
		setDeleteModal({ open: true, index });
	};

	const confirmDeleteContract = async () => {
		const index = deleteModal.index;
		if (index === null || index === undefined) return;

		try {
			const contract = contracts[index];

			const { error: storageError } = await supabase.storage
				.from('audit-docs')
				.remove([contract.agreementFile.path]);

			if (storageError) console.warn('Storage deletion warning:', storageError);

			const { error: dbError } = await supabase
				.from('business_audits')
				.delete()
				.eq('id', contract.id);

			if (dbError) throw dbError;

			await fetchContracts();
			setDeleteModal({ open: false, index: null });
			openFeedback({
				title: 'Contract Deleted',
				message: 'The contract and its audit data have been removed.',
				type: 'success'
			});
		} catch (error) {
			console.error('Error deleting contract:', error);
			openFeedback({
				title: 'Delete Failed',
				message: 'Failed to delete contract: ' + error.message,
				type: 'error'
			});
		} finally {
			setDeleteModal({ open: false, index: null });
		}
	};

	const handleStartAuditForContract = (contract, index) => {
		setContracts((prev) => prev.map((c, i) => (i === index ? { ...c, auditStatus: 'in-progress' } : c)));
		onStartAudit?.(contract);
	};

	const getStatusBadge = (status) => {
		switch (status) {
			case 'completed':
				return (
					<span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
						<CheckCircle size={14} />
						Audit Completed
					</span>
				);
			case 'in-progress':
				return (
					<span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
						<Clock size={14} />
						In Progress
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
						<CheckCircle size={14} />
						Ready to Audit
					</span>
				);
		}
	};

	const getContractTypeLabel = (type) => contractTypes.find((t) => t.value === type)?.label || type;

	const formatFileSize = (bytes) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const formatDate = (isoString) => {
		const date = new Date(isoString);
		return date.toLocaleDateString('en-IN', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b px-6 py-4">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-3">
						<button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
							<ArrowLeft size={20} className="text-gray-600" />
						</button>
						<div>
							<h1 className="font-bold text-2xl text-gray-900">Contract Management</h1>
							<p className="text-sm text-gray-600 mt-1">
								{displayFirmName} • {displayLocation}
							</p>
						</div>
					</div>
					<div className="text-right">
						<div className="text-sm text-gray-600">Total Contracts</div>
						<div className="text-2xl font-bold text-gray-900">{contracts.length}</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto p-8">
				{/* Add Contract Button - visible when list exists */}
				{contracts.length > 0 && (
					<div className="mb-6">
						<button
							onClick={() => {
								resetForm();
								setEditingIndex(null);
								setShowModal(true);
							}}
							className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
						>
							<Plus size={20} />
							Add New Contract
						</button>
					</div>
				)}

				{/* Success Modal */}
				{showSuccessModal && (
					<Modal
						isOpen={showSuccessModal}
						onClose={() => setShowSuccessModal(false)}
						title="Audit Initiated Successfully"
						message="The contract has been uploaded. Our AI is now processing the document for risk auditing. You will see the status update in the dashboard shortly."
						type="success"
						confirmText="Back to Dashboard"
						onConfirm={() => {
							setShowSuccessModal(false);
							fetchContracts();
						}}
						showCancel={false}
					/>
				)}

				{/* Feedback Modal (warnings/errors/info) */}
				{feedbackModal.open && (
					<Modal
						isOpen={feedbackModal.open}
						onClose={() => setFeedbackModal((prev) => ({ ...prev, open: false }))}
						title={feedbackModal.title}
						message={feedbackModal.message}
						type={feedbackModal.type || 'info'}
						confirmText={feedbackModal.confirmText || 'OK'}
						showCancel={false}
					/>
				)}

				{/* Delete Confirmation Modal */}
				{deleteModal.open && (
					<Modal
						isOpen={deleteModal.open}
						onClose={() => setDeleteModal({ open: false, index: null })}
						title="Delete Contract?"
						message="Are you sure you want to delete this contract and its audit data? This action cannot be undone."
						type="warning"
						confirmText="Delete"
						cancelText="Cancel"
						showCancel={true}
						onConfirm={confirmDeleteContract}
					/>
				)}

				{showSuccessModal && (
					<Modal
						isOpen={showSuccessModal}
						onClose={() => setShowSuccessModal(false)}
						title="Audit Initiated Successfully"
						message="The contract has been uploaded. Our AI is now processing the document for risk auditing. You will see the status update in the dashboard shortly."
						type="success"
						confirmText="Back to Dashboard"
						onConfirm={() => {
							setShowSuccessModal(false);
							fetchContracts();
						}}
						showCancel={false}
					/>
				)}

				{/* Modal */}
				{showModal && (
					<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
						<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
							<div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
								<h2 className="text-2xl font-bold text-gray-900">
									{editingIndex !== null ? 'Edit Contract' : 'Upload New Contract'}
								</h2>
								<button
									onClick={() => {
										setShowModal(false);
										setEditingIndex(null);
										resetForm();
									}}
									className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
								>
									<X size={20} className="text-gray-600" />
								</button>
							</div>

							<div className="p-6">
								<div className="grid md:grid-cols-2 gap-6">
									<div className="space-y-6">
										<div>
											<label className="block text-sm font-bold text-gray-700 mb-2">
												Contract Title <span className="text-red-500">*</span>
											</label>
											<input
												type="text"
												name="contractTitle"
												value={formData.contractTitle}
												onChange={handleInputChange}
												placeholder="e.g., MSA - Vendor X, NDA - Client ABC"
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
											/>
										</div>

										<div>
											<label className="block text-sm font-bold text-gray-700 mb-2">
												Contract Type <span className="text-red-500">*</span>
											</label>
											<select
												name="contractType"
												value={formData.contractType}
												onChange={handleInputChange}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
											>
												{contractTypes.map((type) => (
													<option key={type.value} value={type.value}>
														{type.label}
													</option>
												))}
											</select>
										</div>

										<div>
											<label className="block text-sm font-bold text-gray-700 mb-2">
												Upload Executed Agreement <span className="text-red-500">*</span>
											</label>
											{formData.agreementFile ? (
												<div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
													<div className="flex items-start justify-between">
														<div className="flex items-start gap-3">
															<File size={20} className="text-green-600 mt-0.5" />
															<div>
																<p className="text-sm font-medium text-gray-900">{formData.agreementFile.name}</p>
																<p className="text-xs text-gray-500 mt-1">
																	{formatFileSize(formData.agreementFile.size)} • Uploaded {formatDate(formData.agreementFile.uploadedAt)}
																</p>
															</div>
														</div>
														<button
															onClick={() => handleRemoveFile('agreementFile')}
															className="p-1 hover:bg-red-100 rounded transition-colors"
														>
															<X size={16} className="text-red-600" />
														</button>
													</div>
												</div>
											) : (
												<label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer">
													<input
														type="file"
														accept=".pdf,.doc,.docx"
														onChange={(e) => handleFileChange(e, 'agreementFile')}
														className="hidden"
													/>
													<div className="text-center">
														<Upload size={32} className="mx-auto text-gray-400 mb-2" />
														<p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
														<p className="text-xs text-gray-500 mt-1">PDF or DOCX (Max 10MB)</p>
													</div>
												</label>
											)}
										</div>
									</div>

									<div>
										<div className="h-full border rounded-xl p-5 bg-yellow-50 border-yellow-200">
											<div className="flex items-center gap-2 mb-3">
												<span className="text-lg">⚠️</span>
												<h3 className="text-base font-bold text-yellow-900">Intern Audit Guidelines</h3>
											</div>
											<ul className="list-disc pl-5 space-y-2 text-sm text-yellow-900">
												<li><span className="font-semibold">Validity:</span> Upload ONLY fully executed copies (signed by both parties). No drafts.</li>
												<li><span className="font-semibold">Completeness:</span> Ensure all Annexures (Scope, SLA, Pricing) are included in the PDF.</li>
												<li><span className="font-semibold">Amendments:</span> If renewed or changed, upload the latest Amendment/Addendum.</li>
												<li><span className="font-semibold">Data Check:</span> Verify “Effective Date” and “Contract Value” are legible.</li>
												<li><span className="font-semibold">Compliance:</span> Flag if the party is a Foreign Entity (requires FEMA check).</li>
											</ul>
										</div>
									</div>
								</div>
							</div>

							<div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-4">
								<button
									onClick={() => {
										setShowModal(false);
										setEditingIndex(null);
										resetForm();
									}}
									className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition-all"
								>
									Cancel
								</button>
								<button
									onClick={handleAddContract}
									className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold transition-all shadow-md hover:shadow-lg"
								>
									{editingIndex !== null ? 'Update Contract' : 'Upload & Initialize Audit'}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Empty State */}
				{loading ? (
					<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
						<Loader2 size={48} className="mx-auto text-purple-600 animate-spin mb-4" />
						<p className="text-gray-600">Loading contracts...</p>
					</div>
				) : contracts.length === 0 ? (
					<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
						<div className="max-w-md mx-auto">
							<div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
								<FileText size={48} className="text-purple-600" />
							</div>
							<h3 className="text-2xl font-bold text-gray-900 mb-3">No Business Audits Initiated</h3>
							<p className="text-gray-600 mb-8 leading-relaxed">
								Upload a contract and its accompanying guidelines to generate a risk assessment report.
							</p>
							<button
								onClick={() => {
									resetForm();
									setEditingIndex(null);
									setShowModal(true);
								}}
								className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
							>
								<Plus size={22} />
								Add Your First Contract
							</button>
						</div>
					</div>
								) : (
									<div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
										<div className="overflow-x-auto">
											<table className="min-w-full text-sm">
												<thead className="bg-gray-50 text-gray-600 uppercase text-xs">
													<tr>
														<th className="px-4 py-3 text-left">Contract Details</th>
														<th className="px-4 py-3 text-left">Type</th>
														<th className="px-4 py-3 text-left">Uploaded Date</th>
														<th className="px-4 py-3 text-left">Status</th>
														<th className="px-4 py-3 text-right">Actions</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-gray-100">
													{contracts.map((contract, index) => (
														<tr key={contract.id} className="hover:bg-gray-50">
															<td className="px-4 py-3 align-middle">
																<div className="font-semibold text-gray-900">{contract.contractTitle}</div>
																<div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
																	<File size={14} className="text-gray-400" />
																	<span>{contract.agreementFile?.name}</span>
																</div>
															</td>
															<td className="px-4 py-3 align-middle">
																<span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
																	{getContractTypeLabel(contract.contractType)}
																</span>
															</td>
															<td className="px-4 py-3 align-middle text-gray-700">
																{formatDate(contract.uploadedAt)}
															</td>
															<td className="px-4 py-3 align-middle">
																{getStatusBadge(contract.auditStatus)}
															</td>
															<td className="px-4 py-3 align-middle">
																<div className="flex items-center gap-3 justify-end">
																	<button
																		onClick={() => handleEditContract(index)}
																		className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
																		title="Edit Contract"
																	>
																		<Edit2 size={16} />
																	</button>
																	<button
																		onClick={() => handleDeleteContract(index)}
																		className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
																		title="Delete Contract"
																	>
																		<Trash2 size={16} />
																	</button>
																</div>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								)}
			</div>
		</div>
		  );
		};

		export default ContractManagement;

