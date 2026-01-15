import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import Modal from '../shared/Modal';
import { 
  Users, Plus, Search, Edit2, Trash2, Eye, EyeOff,
  Mail, Phone, MapPin, Calendar, CheckCircle, XCircle,
  Loader2, ArrowLeft, Save, Shield, UserCircle
} from 'lucide-react';

const UserManagement = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    assigned_region: '',
    role: 'intern',
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to load users. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name
          }
        }
      });

      if (authError) throw authError;

      // Create user profile with selected role
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          assigned_region: formData.assigned_region,
          role: formData.role,
          is_active: formData.is_active
        }]);

      if (profileError) throw profileError;

      // Log activity
      await supabase.rpc('log_activity', {
        p_action: 'added_user',
        p_entity_type: 'user',
        p_entity_id: authData.user.id,
        p_details: { email: formData.email, name: formData.full_name, role: formData.role }
      });

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: `${formData.role === 'admin' ? 'Admin' : 'Intern'} created successfully!`
      });
      setShowForm(false);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        assigned_region: '',
        role: 'intern',
        is_active: true
      });
      fetchUsers();

    } catch (error) {
      console.error('Error creating user:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Creation Failed',
        message: error.message || 'Failed to create user. Please check if the email is already registered.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          assigned_region: formData.assigned_region,
          role: formData.role,
          is_active: formData.is_active
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_activity', {
        p_action: 'updated_user',
        p_entity_type: 'user',
        p_entity_id: editingUser.id,
        p_details: { email: editingUser.email, name: formData.full_name, role: formData.role }
      });

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Updated!',
        message: 'User profile updated successfully!'
      });
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();

    } catch (error) {
      console.error('Error updating user:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update user profile.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_activity', {
        p_action: user.is_active ? 'deactivated_user' : 'activated_user',
        p_entity_type: 'user',
        p_entity_id: user.id,
        p_details: { email: user.email }
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating status:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to update user status.'
      });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      phone: user.phone || '',
      assigned_region: user.assigned_region || '',
      role: user.role || 'intern',
      is_active: user.is_active,
      email: user.email,
      password: '' // Don't populate password for security
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      assigned_region: '',
      role: 'intern',
      is_active: true
    });
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery) ||
    user.assigned_region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={handleCancelForm}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to List
          </button>

          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>

            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  disabled={editingUser !== null}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="user@example.com"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              {/* Role Selection Dropdown */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-white"
                  required
                >
                  <option value="intern">Intern</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.role === 'admin' 
                    ? '🛡️ Admins can manage users, assign audits, and access all reports' 
                    : '👤 Interns can perform assigned audits and view their own reports'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Assigned Region</label>
                  <input
                    type="text"
                    value={formData.assigned_region}
                    onChange={(e) => setFormData({ ...formData, assigned_region: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mumbai, Maharashtra"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Account is active (user can login)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Save size={20} />
                      {editingUser ? 'Update' : 'Create'} User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <Users size={28} className="text-purple-600" />
              User Management
            </h1>
            <p className="text-gray-500 mt-1">
              {users.length} total users 
              ({users.filter(u => u.role === 'admin').length} admins, {users.filter(u => u.role === 'intern').length} interns)
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            Add User
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, phone, region, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-purple-600" size={40} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first user'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
              >
                Add First User
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl text-white ${
                      user.is_active 
                        ? user.role === 'admin' 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gray-400'
                    }`}>
                      {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{user.full_name || 'Unnamed'}</h3>
                        
                        {/* Role Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {user.role === 'admin' ? (
                            <>
                              <Shield size={12} />
                              Admin
                            </>
                          ) : (
                            <>
                              <UserCircle size={12} />
                              Intern
                            </>
                          )}
                        </span>
                        
                        {/* Active Status Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.is_active 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            {user.phone}
                          </div>
                        )}
                        {user.assigned_region && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-400" />
                            {user.assigned_region}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`p-2 rounded-lg transition-colors ${
                        user.is_active 
                          ? 'text-gray-600 hover:bg-gray-100' 
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {user.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
};

export default UserManagement;
