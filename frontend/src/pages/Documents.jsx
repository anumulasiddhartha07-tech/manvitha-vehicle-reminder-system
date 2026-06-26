import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  Shield, 
  Calendar,
  AlertCircle,
  FileDown,
  RefreshCw,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import jsPDF from 'jspdf';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Insurance', 'Permit', 'Fitness'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Expiring Soon', 'Expired'
  const [userRole, setUserRole] = useState('ADMIN');



  // Replace Modal State
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [replaceDocId, setReplaceDocId] = useState(null);
  const [replaceDocType, setReplaceDocType] = useState('');
  
  // Delete Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  // Custom alert popup state
  const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error', title: '' });
  const showCustomAlert = (message, type = 'error', title = '') => {
    setCustomAlert({ show: true, message, type, title });
  };
  const [formData, setFormData] = useState({
    issue_date: '',
    expiry_date: '',
    document_number: '',
    document_company: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserRole(u.role || 'ADMIN');
    }
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://manvitha-vehicle-reminder-system-1.onrender.com/api/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        console.error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleReplaceClick = (doc) => {
    setReplaceDocId(doc.id);
    setReplaceDocType(doc.document_type);
    setFormData({
      issue_date: doc.issue_date || '',
      expiry_date: doc.expiry_date || '',
      document_number: doc.document_number || '',
      document_company: doc.document_company || ''
    });
    setIsReplaceOpen(true);
  };

  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!formData.expiry_date) {
      showCustomAlert('Expiry date is required.', 'error', 'Missing Information');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://manvitha-vehicle-reminder-system-1.onrender.com/api/documents/${replaceDocId}/replace`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          document_type: replaceDocType,
          ...formData
        })
      });

      if (res.ok) {
        setIsReplaceOpen(false);
        fetchDocuments();
        showCustomAlert('Document replaced successfully!', 'success', 'Success');
      } else {
        const errorData = await res.json();
        showCustomAlert(errorData.error || 'Failed to replace document.', 'error', 'Error');
      }
    } catch (error) {
      console.error('Error replacing document:', error);
      showCustomAlert('Error updating document.', 'error', 'Connection Error');
    }
  };

  const handleDeleteClick = (doc) => {
    setDocToDelete(doc);
    setShowDeleteConfirm(true);
  };

  const executeDeleteDoc = async () => {
    if (!docToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://manvitha-vehicle-reminder-system-1.onrender.com/api/documents/${docToDelete.id}?document_type=${docToDelete.document_type}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setShowDeleteConfirm(false);
        setDocToDelete(null);
        fetchDocuments();
        showCustomAlert('Document data cleared successfully!', 'success', 'Success');
      } else {
        const errorData = await res.json();
        showCustomAlert(errorData.error || 'Failed to clear document.', 'error', 'Error');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      showCustomAlert('Error clearing document.', 'error', 'Connection Error');
    }
  };

  // Filtered documents list
  const filteredDocs = documents.filter(doc => {
    // Category tab filter
    if (activeTab !== 'All' && doc.document_type !== activeTab) return false;

    // Status filter
    if (statusFilter !== 'All' && doc.status !== statusFilter) return false;

    // Text search filter
    if (search) {
      const term = search.toLowerCase();
      const matchSearch = 
        doc.vehicle_number.toLowerCase().includes(term) || 
        doc.document_number.toLowerCase().includes(term) || 
        (doc.document_company && doc.document_company.toLowerCase().includes(term));
      if (!matchSearch) return false;
    }

    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return 'Not Mentioned';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Not Mentioned';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-50 pb-4 select-none">
        <div>
          <h1 className="text-[30px] font-extrabold text-slate-800 tracking-tight font-outfit leading-none">
            Document Management
          </h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            Monitor, preview, and replace compliance documents for the active fleet.
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          className="h-10.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12.5px] font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" />
          <span>Refresh Workspace</span>
        </button>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 select-none">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Certificates</span>
          <span className="text-[26px] font-black text-slate-800 mt-1 block font-outfit">{documents.length}</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active & Valid</span>
          <span className="text-[26px] font-black text-emerald-600 mt-1 block font-outfit">
            {documents.filter(d => d.status === 'Active').length}
          </span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expiring Soon</span>
          <span className="text-[26px] font-black text-amber-500 mt-1 block font-outfit">
            {documents.filter(d => d.status === 'Expiring Soon').length}
          </span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expired Records</span>
          <span className="text-[26px] font-black text-red-500 mt-1 block font-outfit">
            {documents.filter(d => d.status === 'Expired').length}
          </span>
        </div>
      </div>

      {/* Filters Bar & Category Tabs */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-4">
        {/* Category Tabs */}
        <div className="flex border-b border-slate-100 select-none overflow-x-auto gap-3.5">
          {['All', 'Insurance', 'Permit', 'Fitness'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3.5 px-5 font-bold text-[13.5px] border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-teal-brand text-teal-brand font-extrabold border-b-[3px]' 
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab === 'All' ? 'All Documents' : tab}
            </button>
          ))}
        </div>

        {/* Inputs row */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vehicle number, policy no, or company name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-150 hover:bg-slate-100/50 focus:bg-white focus:border-slate-350 focus:ring-2 focus:ring-slate-100 rounded-xl text-[12.5px] font-medium outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-[12px] font-semibold text-slate-400 whitespace-nowrap select-none">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-4.5 bg-slate-50 border border-slate-150 rounded-xl text-[12.5px] font-bold text-slate-700 outline-none hover:bg-slate-100/50 transition-colors cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Critical">Critical</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid: Document Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium text-[13px] animate-pulse">
          Retrieving digitized compliance logs...
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
          {filteredDocs.map((doc) => {
            // Icon mapping
            let Icon = FileText;
            let iconColorClass = 'text-slate-650';
            let iconBgClass = 'bg-slate-50 border-slate-100';
            let gradientBg = 'from-slate-50/20 to-white';
            let highlightBarColor = 'bg-slate-400';

            if (doc.document_type === 'Insurance') {
              Icon = Shield;
              iconColorClass = 'text-blue-600';
              iconBgClass = 'bg-blue-50/80 border-blue-100';
              gradientBg = 'from-blue-50/20 via-white to-white';
              highlightBarColor = 'bg-blue-500';
            } else if (doc.document_type === 'Permit') {
              Icon = FileText;
              iconColorClass = 'text-indigo-650';
              iconBgClass = 'bg-indigo-50/80 border-indigo-100';
              gradientBg = 'from-indigo-50/20 via-white to-white';
              highlightBarColor = 'bg-indigo-500';
            } else if (doc.document_type === 'Fitness') {
              Icon = CheckCircle2;
              iconColorClass = 'text-purple-605';
              iconBgClass = 'bg-purple-50/80 border-purple-100';
              gradientBg = 'from-purple-50/20 via-white to-white';
              highlightBarColor = 'bg-purple-500';
            }

            // Status badge styling mapping
            const isExpired = doc.status === 'Expired';
            const isWarning = doc.status === 'Expiring Soon' || doc.status === 'Critical';
            
            let statusBadgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-150';
            let dotColor = 'bg-emerald-500';
            
            if (isExpired) {
              statusBadgeBg = 'bg-red-50 text-red-750 border-red-150';
              dotColor = 'bg-red-500';
            } else if (isWarning) {
              statusBadgeBg = 'bg-amber-50 text-amber-700 border-amber-150';
              dotColor = 'bg-amber-500';
            }

            return (
              <div 
                key={doc.id} 
                className={`bg-gradient-to-br ${gradientBg} border border-slate-150/60 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-3 h-fit`}
              >
                {/* Accent Highlight strip indicator */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${highlightBarColor}`}></div>

                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-sm ${iconBgClass}`}>
                        <Icon className={`w-4.5 h-4.5 ${iconColorClass}`} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-extrabold text-slate-800 font-outfit leading-none">
                          {doc.document_type}
                        </h3>
                        <p className="text-[9.5px] font-bold text-slate-400 tracking-wider uppercase mt-1">
                          Vehicle: {doc.vehicle_number}
                        </p>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border uppercase select-none ${statusBadgeBg}`}>
                      <span className={`w-1 h-1 rounded-full animate-pulse ${dotColor}`}></span>
                      <span>{doc.status === 'Active' ? 'Valid' : doc.status}</span>
                    </span>
                  </div>

                  {/* Metadata items */}
                  <div className="space-y-1.5 text-[11.5px] pt-1">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                      <span className="text-slate-400 font-medium">Policy/Doc No</span>
                      <span className="font-bold text-slate-700 truncate max-w-[110px] font-mono text-[11px]" title={doc.document_number}>
                        {doc.document_number || '--'}
                      </span>
                    </div>
                    {doc.document_company && (
                      <div className="flex justify-between items-center border-b border-slate-100/50 pb-1.5">
                        <span className="text-slate-400 font-medium">Provider</span>
                        <span className="font-bold text-slate-700 truncate max-w-[110px]">{doc.document_company}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-b border-slate-100/50 pb-1.5">
                      <span className="text-slate-400 font-medium">Issue Date</span>
                      <span className="font-bold text-slate-700">{formatDate(doc.issue_date)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-0.5">
                      <span className="text-slate-400 font-medium">Expiry Date</span>
                      <span className={`font-extrabold text-[12px] tracking-tight ${
                        isExpired ? 'text-red-500 font-black' : isWarning ? 'text-amber-600' : 'text-slate-750'
                      }`}>
                        {formatDate(doc.expiry_date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="border-t border-slate-100/50 pt-2 flex justify-end items-center space-x-1.5 select-none print:hidden">
                  {userRole !== 'MANAGEMENT' && (
                    <button
                      onClick={() => handleReplaceClick(doc)}
                      className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-650 rounded-lg transition-colors cursor-pointer border border-teal-100/60 shadow-sm"
                      title="Replace / Update Document"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {userRole === 'ADMIN' && (
                    <button
                      onClick={() => handleDeleteClick(doc)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors cursor-pointer border border-red-100/60 shadow-sm"
                      title="Delete / Clear Certificate Parameters"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-medium select-none shadow-sm">
          No compliance documents match your filters.
        </div>
      )}



      {/* Replace Document Upload Modal */}
      {isReplaceOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-[440px] w-full p-6 space-y-5 shadow-2xl scale-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3 select-none">
              <div>
                <h4 className="text-[15.5px] font-bold text-slate-800 font-outfit">Replace {replaceDocType}</h4>
                <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Vehicle compliance update</p>
              </div>
              <button 
                onClick={() => setIsReplaceOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleReplaceSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-bold text-slate-450 uppercase block">Document / Policy Number</label>
                <input
                  type="text"
                  value={formData.document_number}
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                  placeholder={`Enter ${replaceDocType} Number`}
                  className="w-full h-10.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-semibold outline-none focus:bg-white focus:border-slate-350 focus:ring-2 focus:ring-slate-100 transition-all text-slate-800"
                />
              </div>

              {replaceDocType === 'Insurance' && (
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-slate-450 uppercase block">Insurance Company</label>
                  <input
                    type="text"
                    value={formData.document_company}
                    onChange={(e) => setFormData({ ...formData, document_company: e.target.value })}
                    placeholder="Enter Insurance Provider"
                    className="w-full h-10.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-semibold outline-none focus:bg-white focus:border-slate-350 focus:ring-2 focus:ring-slate-100 transition-all text-slate-800"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-slate-450 uppercase block">Issue Date</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full h-10.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-semibold outline-none focus:bg-white focus:border-slate-350 focus:ring-2 focus:ring-slate-100 transition-all text-slate-850 cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-slate-450 uppercase block">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    required
                    className="w-full h-10.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-semibold outline-none focus:bg-white focus:border-slate-350 focus:ring-2 focus:ring-slate-100 transition-all text-slate-850 cursor-pointer"
                  />
                </div>
              </div>



              <div className="flex space-x-3 pt-3.5 select-none">
                <button
                  type="button"
                  onClick={() => setIsReplaceOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 text-[13px] font-bold rounded-xl transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-brand hover:bg-teal-600 text-white text-[13px] font-bold rounded-xl transition-colors shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  Save Compliance Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Delete Confirmation Modal */}
      {showDeleteConfirm && docToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-[380px] w-full p-6 space-y-4 shadow-2xl scale-in duration-200">
            <h4 className="text-[16px] font-bold text-slate-800">Delete Document Metadata</h4>
            <p className="text-[13px] text-slate-500 leading-normal">
              Are you sure you want to delete the metadata for the <span className="font-extrabold text-slate-700">{docToDelete.document_type}</span> document of vehicle <span className="font-extrabold text-slate-700">{docToDelete.vehicle_number}</span>? This will permanently clear its policy number and expiration dates.
            </p>
            <div className="flex space-x-2.5 pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDocToDelete(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-655 text-[13px] font-bold rounded-xl transition-colors cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteDoc}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-650 text-white text-[13px] font-bold rounded-xl transition-colors shadow-md shadow-red-500/10 cursor-pointer border-0"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {customAlert.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300 select-none">
          <div className="bg-white rounded-[32px] p-8 max-w-[360px] w-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
            {/* Top gradient accent line based on alert type */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
              customAlert.type === 'success' 
                ? 'from-teal-500 via-emerald-500 to-teal-650' 
                : 'from-rose-500 via-red-500 to-orange-500'
            }`}></div>

            {/* Glowing badge */}
            <div className="relative mt-2">
              <div className={`absolute inset-0 rounded-full blur-xl scale-125 animate-pulse ${
                customAlert.type === 'success' ? 'bg-emerald-400/20' : 'bg-red-400/20'
              }`}></div>
              <div className={`relative w-20 h-20 border rounded-full flex items-center justify-center shadow-inner ${
                customAlert.type === 'success' 
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100/80 text-emerald-500' 
                  : 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-100/80 text-red-500'
              }`}>
                {customAlert.type === 'success' ? (
                  <CheckCircle2 className="w-11 h-11 drop-shadow-sm stroke-[2.25]" />
                ) : (
                  <AlertTriangle className="w-11 h-11 drop-shadow-sm stroke-[2.25]" />
                )}
              </div>
            </div>

            <h3 className="text-[20px] font-black text-slate-800 font-outfit mt-6 leading-none tracking-tight">
              {customAlert.title || (customAlert.type === 'success' ? 'Success' : 'Alert')}
            </h3>
            
            <p className="text-[13px] text-slate-500 font-medium mt-3 leading-relaxed px-1">
              {customAlert.message}
            </p>

            <button
              onClick={() => setCustomAlert({ ...customAlert, show: false })}
              className={`w-full mt-7 py-3.5 text-white font-extrabold text-[13.5px] tracking-wide rounded-2xl shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer border-0 ${
                customAlert.type === 'success' 
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/35' 
                  : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-650 hover:to-rose-700 shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/35'
              }`}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
