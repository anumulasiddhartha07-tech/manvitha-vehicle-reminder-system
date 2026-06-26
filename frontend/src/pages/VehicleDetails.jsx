import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Edit2, 
  Trash2, 
  Calendar, 
  Shield, 
  FileText, 
  CheckCircle,
  FileSpreadsheet,
  Plus,
  Clock,
  Bell,
  CheckCircle2,
  ChevronRight,
  Info,
  Phone,
  FileDown,
  Tag,
  RefreshCw,
  X,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';



const VehicleDetails = () => {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('ADMIN');
  const [userName, setUserName] = useState('Admin');
  const navigate = useNavigate();

  // Tabs state: Overview, Documents, Alerts, Logs
  const [activeTab, setActiveTab] = useState('Overview');

  // Preview & Replacement state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [replaceDocType, setReplaceDocType] = useState('');
  const [replaceForm, setReplaceForm] = useState({
    issue_date: '',
    expiry_date: '',
    document_number: '',
    document_company: ''
  });

  // Alert resolution state
  const [resolvingAlertId, setResolvingAlertId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // Custom alert popup state
  const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error', title: '' });
  const showCustomAlert = (message, type = 'error', title = '') => {
    setCustomAlert({ show: true, message, type, title });
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserEmail(u.email || 'admin@manivtha.com');
      setUserRole(u.role || 'ADMIN');
      setUserName(u.name || 'Admin');
    }
  }, []);

  const fetchVehicleDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://manvitha-vehicle-reminder-system-1.onrender.com/api/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setVehicle(data);
      } else {
        console.error('Failed to load vehicle details');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  const handleDelete = () => {
    setShowDeleteModal(false);
    executeDelete();
  };

  const executeDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://manvitha-vehicle-reminder-system-1.onrender.com/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowOtpModal(false);
        navigate('/vehicles');
      }
    } catch (err) {
      console.error(err);
    }
  };



  const handleOpenReplace = (docType, currentDoc) => {
    setReplaceDocType(docType);
    setReplaceForm({
      issue_date: currentDoc?.issue_date || '',
      expiry_date: currentDoc?.expiry_date || '',
      document_number: currentDoc?.document_number || '',
      document_company: currentDoc?.document_company || ''
    });
    setIsReplaceOpen(true);
  };

  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!replaceForm.expiry_date) {
      showCustomAlert('Expiry date is required.', 'error', 'Missing Information');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://manvitha-vehicle-reminder-system-1.onrender.com/api/documents/${vehicle.id}/replace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          document_type: replaceDocType,
          ...replaceForm
        })
      });

      if (res.ok) {
        setIsReplaceOpen(false);
        fetchVehicleDetails();
        showCustomAlert('Document replaced successfully!', 'success', 'Success');
      } else {
        const errorData = await res.json();
        showCustomAlert(errorData.error || 'Failed to replace document.', 'error', 'Error');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      showCustomAlert('Error updating document.', 'error', 'Connection Error');
    }
  };

  const handleResolveAlert = async (e) => {
    e.preventDefault();
    if (!resolvingAlertId) return;
    setSubmittingResolution(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://manvitha-vehicle-reminder-system-1.onrender.com/api/alerts/${resolvingAlertId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: resolutionNotes })
      });

      if (res.ok) {
        setResolvingAlertId(null);
        setResolutionNotes('');
        fetchVehicleDetails();
        showCustomAlert('Alert resolved successfully!', 'success', 'Success');
      } else {
        const errData = await res.json();
        showCustomAlert(errData.error || 'Failed to resolve alert.', 'error', 'Error');
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
      showCustomAlert('Error resolving alert.', 'error', 'Connection Error');
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('portrait', 'pt', 'a4');
    
    // Theme Colors
    const primaryColor = [0, 128, 128]; // Brand Teal #008080
    const darkNavy = [30, 41, 59]; // Slate #1E293B

    // Document Dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;

    // Header & Corporate Branding on every page
    const addHeaderFooter = (pdfDoc, pageNum, totalPagesCount) => {
      // Header background
      pdfDoc.setFillColor(248, 250, 252);
      pdfDoc.rect(0, 0, pageWidth, 60, 'F');
      pdfDoc.setDrawColor(226, 232, 240);
      pdfDoc.line(0, 60, pageWidth, 60);

      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setFontSize(13);
      pdfDoc.setTextColor(...darkNavy);
      pdfDoc.text('MANIVTHA TOURS & TRAVELS', margin, 35);

      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(8.5);
      pdfDoc.setTextColor(100, 116, 139);
      pdfDoc.text('Vehicle Insurance & Permit Renewal Reminder System', margin, 48);

      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setFontSize(9);
      pdfDoc.setTextColor(...primaryColor);
      pdfDoc.text('VEHICLE REGISTRY DETAILS PROFILE', pageWidth - margin - 150, 35, { align: 'right' });

      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(148, 163, 184);
      const generatedOn = `Generated: ${new Date().toLocaleString('en-GB')}`;
      pdfDoc.text(generatedOn, pageWidth - margin, 48, { align: 'right' });

      // Footer
      pdfDoc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(148, 163, 184);
      pdfDoc.text('CONFIDENTIAL - VEHICLE REGISTRY RECORD', margin, pageHeight - 25);
      
      const pageText = `Page ${pageNum} of ${totalPagesCount}`;
      pdfDoc.text(pageText, pageWidth - margin, pageHeight - 25, { align: 'right' });
    };

    // First Page Cover summary box
    doc.setFillColor(250, 251, 252);
    doc.roundedRect(margin, 80, pageWidth - (margin * 2), 110, 8, 8, 'F');
    doc.setDrawColor(230, 235, 240);
    doc.roundedRect(margin, 80, pageWidth - (margin * 2), 110, 8, 8, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...darkNavy);
    doc.text(`VEHICLE PROFILE: ${vehicle.vehicle_number}`, margin + 20, 105);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    
    doc.text(`Brand / Model: ${vehicle.brand || ''} ${vehicle.vehicle_model}`, margin + 20, 125);
    doc.text(`Vehicle Type: ${vehicle.vehicle_type}`, margin + 20, 140);
    doc.text(`Compliance Status: ${vehicle.status.toUpperCase()}`, margin + 20, 155);
    doc.text(`Owner: ${vehicle.owner_name}`, margin + 20, 170);

    doc.text(`Driver: ${vehicle.driver_name || '--'}`, pageWidth / 2 + 20, 125);
    doc.text(`Contact: ${vehicle.contact_number || '--'}`, pageWidth / 2 + 20, 140);
    doc.text(`Registration Date: ${formatDateString(vehicle.registration_date)}`, pageWidth / 2 + 20, 155);
    doc.text(`Generated By: ${userName}`, pageWidth / 2 + 20, 170);

    // Prepare table data for compliance documents
    const tableColumns = [
      { header: 'Document Type', dataKey: 'type' },
      { header: 'Document / Policy No', dataKey: 'number' },
      { header: 'Issue Date', dataKey: 'issue' },
      { header: 'Expiry Date', dataKey: 'expiry' },
      { header: 'Days Remaining', dataKey: 'days' },
      { header: 'Status', dataKey: 'status' }
    ];

    const tableRows = vehicle.Documents?.map(d => {
      const days = getDaysLeft(d.expiry_date);
      return {
        type: d.document_type,
        number: d.document_type === 'Insurance' ? vehicle.insurance_policy : 
                d.document_type === 'Permit' ? vehicle.permit_number :
                d.document_type === 'Fitness' ? vehicle.fitness_certificate : '--',
        issue: formatDateString(d.issue_date),
        expiry: formatDateString(d.expiry_date),
        days: days > 0 ? `${days} Days` : 'Expired',
        status: d.status
      };
    }) || [];

    autoTable(doc, {
      columns: tableColumns,
      body: tableRows,
      startY: 210,
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85],
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        type: { cellWidth: 80 },
        number: { cellWidth: 100 },
        issue: { cellWidth: 80 },
        expiry: { cellWidth: 80 },
        days: { cellWidth: 95 },
        status: { cellWidth: 80 }
      }
    });

    // Add headers and footers to all pages
    const totalPagesCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesCount; i++) {
      doc.setPage(i);
      addHeaderFooter(doc, i, totalPagesCount);
    }

    doc.save(`vehicle_details_profile_${vehicle.vehicle_number}.pdf`);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 font-medium text-[13px] animate-pulse select-none">
        Loading vehicle details profile...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-4">
        <p className="font-bold text-[14px]">Vehicle not found</p>
        <button onClick={() => navigate('/vehicles')} className="text-teal-brand font-bold text-[12px] underline">
          Back to Vehicles List
        </button>
      </div>
    );
  }

  const insuranceDoc = vehicle.Documents?.find(d => d.document_type === 'Insurance');
  const permitDoc = vehicle.Documents?.find(d => d.document_type === 'Permit');
  const fitnessDoc = vehicle.Documents?.find(d => d.document_type === 'Fitness');

  const getDaysLeft = (dateStr) => {
    if (!dateStr) return 0;
    const expDate = new Date(dateStr);
    const today = new Date('2026-06-22');
    const diffTime = expDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const insDays = getDaysLeft(insuranceDoc?.expiry_date);
  const perDays = getDaysLeft(permitDoc?.expiry_date);
  const fitDays = getDaysLeft(fitnessDoc?.expiry_date);

  const getBadgeStyle = (days) => {
    if (days === null || days === undefined) return 'bg-slate-50 text-slate-400 border-slate-100';
    if (days < 0) return 'bg-red-50 text-red-500 border-red-100';
    if (days <= 15) return 'bg-orange-50 text-orange-600 border-orange-100';
    if (days <= 30) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  };

  const getStatusText = (days) => {
    if (days === null || days === undefined) return '--';
    if (days < 0) return 'Expired';
    if (days <= 15) return 'Critical';
    if (days <= 30) return 'Expiring Soon';
    return 'Active';
  };

  const getDotStyle = (days) => {
    if (days === null || days === undefined) return 'bg-slate-350';
    if (days < 0) return 'bg-red-500';
    if (days <= 15) return 'bg-orange-500';
    if (days <= 30) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const formatDateString = (dateStr) => {
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
    <div className="space-y-6 animate-in fade-in duration-300 print:bg-white print:p-0 print:space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-[12px] font-semibold text-slate-400 select-none print:hidden">
        <span className="hover:text-slate-650 cursor-pointer" onClick={() => navigate('/vehicles')}>Vehicles</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-600">Vehicle Details Workspace</span>
      </div>

      {/* Header Info */}
      <div className="flex justify-between items-start print:items-center border-b border-slate-50 pb-4">
        <div>
          <div className="flex items-center space-x-3.5">
            <h1 className="text-[30px] font-extrabold text-slate-800 tracking-tight font-outfit leading-none uppercase">
              {vehicle.vehicle_number}
            </h1>
            <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center space-x-1.5 ${
              vehicle.status === 'Active'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : vehicle.status === 'Expiring Soon'
                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                : 'bg-red-50 text-red-500 border border-red-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                vehicle.status === 'Active' ? 'bg-emerald-500' : vehicle.status === 'Expiring Soon' ? 'bg-amber-500' : 'bg-red-500'
              }`}></span>
              <span>{vehicle.status}</span>
            </span>
          </div>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            {vehicle.brand ? `${vehicle.brand} ` : ''}{vehicle.vehicle_model}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={handleExportPDF}
            className="h-11 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-750 font-bold text-[12.5px] rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="whitespace-nowrap">Export Details PDF</span>
          </button>
          {userRole !== 'MANAGEMENT' && (
            <button
              onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}
              className="h-11 px-5 bg-teal-brand hover:bg-teal-brandHover text-white font-bold text-[12.5px] rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer border-0 shrink-0"
            >
              <Edit2 className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Edit Specs</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex border-b border-slate-100 select-none overflow-x-auto gap-3 print:hidden bg-white px-5 rounded-2xl border border-slate-100 shadow-sm">
        {['Overview', 'Documents', 'Alerts'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-6 font-bold text-[13.5px] border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab 
                ? 'border-teal-brand text-teal-brand font-extrabold border-b-[3px]' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* WORKSPACE TAB CONTENT PANELS */}
      <div className="space-y-6">
        
        {/* PANEL 1: OVERVIEW */}
        {activeTab === 'Overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Spec Details Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-stretch gap-6">
              <div className="w-[110px] h-[110px] bg-teal-50 border border-teal-100/50 rounded-full flex items-center justify-center shrink-0 shadow-inner text-teal-brand">
                <Shield className="w-12 h-12" />
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-[12.5px] border-l border-slate-50 md:pl-6 pt-1">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Vehicle Number</span>
                  <span className="text-slate-800 font-bold mt-1.5 block uppercase">{vehicle.vehicle_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Brand / Manufacturer</span>
                  <span className="text-slate-800 font-bold mt-1.5 block">{vehicle.brand || '--'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Vehicle Model</span>
                  <span className="text-slate-800 font-bold mt-1.5 block">{vehicle.vehicle_model}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Owner Name</span>
                  <span className="text-slate-800 font-bold mt-1.5 block">{vehicle.owner_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Driver Name</span>
                  <span className="text-slate-850 font-bold mt-1.5 block">{vehicle.driver_name || '--'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Contact Phone</span>
                  <span className="text-slate-850 font-bold mt-1.5 block">{vehicle.contact_number || '--'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Vehicle Type</span>
                  <span className="text-slate-800 font-bold mt-1.5 block uppercase">{vehicle.vehicle_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Registration Date</span>
                  <span className="text-slate-850 font-bold mt-1.5 block">{formatDateString(vehicle.registration_date)}</span>
                </div>
              </div>
            </div>

            {/* Timelines compliance status bar */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-50 pb-3 select-none">
                <h3 className="font-bold text-[14px] text-slate-800 font-outfit">Certificates Warning Thresholds</h3>
              </div>

              <div className="space-y-4 pt-1">
                {/* Insurance progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[12px] font-bold">
                    <span className="text-slate-650">Insurance Renewal Timeline</span>
                    <span className="text-slate-800">{insDays > 0 ? `${insDays} / 90 days` : 'Expired'}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(Math.max((insDays / 90) * 100, 0), 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Permit progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[12px] font-bold">
                    <span className="text-slate-650">National Permit Timeline</span>
                    <span className="text-slate-800">{perDays > 0 ? `${perDays} / 90 days` : 'Expired'}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(Math.max((perDays / 90) * 100, 0), 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Fitness progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[12px] font-bold">
                    <span className="text-slate-650">Fitness Inspection Timeline</span>
                    <span className="text-slate-800">{fitDays > 0 ? `${fitDays} / 90 days` : 'Expired'}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(Math.max((fitDays / 90) * 100, 0), 100)}%` }}
                    ></div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: DOCUMENTS */}
        {activeTab === 'Documents' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center select-none">
              <h2 className="text-[14.5px] font-extrabold text-slate-800">Compliance Document Cards</h2>
              <span className="text-[11.5px] font-bold text-slate-400">3 Monitored Documents</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card: Insurance */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-blue-600 shrink-0" />
                      <span className="font-extrabold text-[13.5px] text-slate-800">Insurance</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-450 truncate">No: {vehicle.insurance_policy || '--'}</p>
                  <p className="text-[9px] text-slate-400 font-medium leading-none truncate">Co: {vehicle.insurance_company || '--'}</p>
                </div>
                
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</span>
                  <h3 className="text-[17px] font-extrabold text-blue-600 mt-1 font-outfit">{formatDateString(insuranceDoc?.expiry_date)}</h3>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-3 select-none">
                  <span className="text-[11.5px] font-extrabold text-slate-700">{insDays > 0 ? `${insDays} Days Left` : insDays === 0 ? 'Expires Today' : `Expired (${Math.abs(insDays)} Days Ago)`}</span>
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(insDays)}`}>
                    ● {getStatusText(insDays)}
                  </span>
                </div>

                <div className="border-t border-slate-50 pt-2.5 flex justify-end space-x-1.5">
                  {userRole !== 'MANAGEMENT' && (
                    <button
                      onClick={() => handleOpenReplace('Insurance', insuranceDoc)}
                      className="p-1.5 text-teal-650 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                      title="Update/Replace Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card: Permit */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-indigo-650 shrink-0" />
                      <span className="font-extrabold text-[13.5px] text-slate-800">Permit</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-450 truncate">No: {vehicle.permit_number || '--'}</p>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</span>
                  <h3 className="text-[17px] font-extrabold text-indigo-650 mt-1 font-outfit">{formatDateString(permitDoc?.expiry_date)}</h3>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-3 select-none">
                  <span className="text-[11.5px] font-extrabold text-slate-700">{perDays > 0 ? `${perDays} Days Left` : perDays === 0 ? 'Expires Today' : `Expired (${Math.abs(perDays)} Days Ago)`}</span>
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(perDays)}`}>
                    ● {getStatusText(perDays)}
                  </span>
                </div>

                <div className="border-t border-slate-50 pt-2.5 flex justify-end space-x-1.5">
                  {userRole !== 'MANAGEMENT' && (
                    <button
                      onClick={() => handleOpenReplace('Permit', permitDoc)}
                      className="p-1.5 text-teal-650 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                      title="Update/Replace Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card: Fitness */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-purple-600 shrink-0" />
                      <span className="font-extrabold text-[13.5px] text-slate-800">Fitness</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-450 truncate">No: {vehicle.fitness_certificate || '--'}</p>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</span>
                  <h3 className="text-[17px] font-extrabold text-purple-600 mt-1 font-outfit">{formatDateString(fitnessDoc?.expiry_date)}</h3>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-3 select-none">
                  <span className="text-[11.5px] font-extrabold text-slate-700">{fitDays > 0 ? `${fitDays} Days Left` : fitDays === 0 ? 'Expires Today' : `Expired (${Math.abs(fitDays)} Days Ago)`}</span>
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(fitDays)}`}>
                    ● {getStatusText(fitDays)}
                  </span>
                </div>

                <div className="border-t border-slate-50 pt-2.5 flex justify-end space-x-1.5">
                  {userRole !== 'MANAGEMENT' && (
                    <button
                      onClick={() => handleOpenReplace('Fitness', fitnessDoc)}
                      className="p-1.5 text-teal-650 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                      title="Update/Replace Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>


            </div>
          </div>
        )}

        {/* PANEL 3: ALERTS */}
        {activeTab === 'Alerts' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="border-b border-slate-50 pb-3 flex justify-between items-center select-none">
              <h3 className="font-bold text-[14px] text-slate-850 font-outfit">Active Compliance Warnings</h3>
              <span className="text-[11px] font-bold text-slate-400">Scan Timeline Alerts</span>
            </div>

            <div className="space-y-3">
              {vehicle.Alerts && vehicle.Alerts.length > 0 ? (
                vehicle.Alerts.map((a) => (
                  <div key={a.id} className="bg-white border border-slate-100 rounded-xl p-4.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        a.status === 'Expired' ? 'bg-red-50 text-red-500' : a.status === 'Resolved' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
                      }`}>
                        <Bell className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="text-[13px] font-bold text-slate-800 leading-snug">
                            {a.document_type} is {a.status}
                          </h5>
                        </div>
                        <p className="text-[11.5px] text-slate-500 mt-1">{a.message}</p>

                        {/* If resolved, show metadata */}
                        {a.status === 'Resolved' && (
                          <div className="mt-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                            <p className="font-bold flex items-center space-x-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Resolved by {a.resolved_by || 'System'} at {formatDateString(a.resolved_at)}</span>
                            </p>
                            {a.resolution_history && (
                              <div className="text-[10.5px] font-medium text-slate-500">
                                {(() => {
                                  try {
                                    const parsed = JSON.parse(a.resolution_history);
                                    return parsed.map((h, idx) => (
                                      <p key={idx} className="italic mt-1 border-t border-slate-100/50 pt-1">
                                        Notes: "{h.notes}" - {h.resolved_by}
                                      </p>
                                    ));
                                  } catch (e) {
                                    return null;
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resolution Trigger */}
                    {a.status !== 'Resolved' && userRole !== 'MANAGEMENT' && (
                      <div className="shrink-0">
                        {resolvingAlertId === a.id ? (
                          <form onSubmit={handleResolveAlert} className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                            <input
                              type="text"
                              value={resolutionNotes}
                              onChange={(e) => setResolutionNotes(e.target.value)}
                              placeholder="Enter resolution notes..."
                              required
                              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-medium focus:bg-white focus:border-slate-350 outline-none w-52"
                            />
                            <div className="flex space-x-1">
                              <button
                                type="submit"
                                disabled={submittingResolution}
                                className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setResolvingAlertId(null)}
                                className="h-9 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setResolvingAlertId(a.id)}
                            className="h-9 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11.5px] rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer border-0"
                          >
                            <CheckSquare className="w-4 h-4" />
                            <span>Resolve Warn</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center bg-white rounded-xl border border-slate-100 text-slate-400 text-[12px] select-none shadow-sm">
                  No alerts logged for this vehicle.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Quick Actions Panel */}
      {userRole === 'ADMIN' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 print:hidden select-none">
          <h3 className="font-bold text-[14px] text-slate-850">Fleet Management Controls</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="h-11 px-5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-650 font-bold text-[12.5px] rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
              <span className="whitespace-nowrap">Delete Vehicle Record</span>
            </button>
          </div>
        </div>
      )}

      {/* Back to Vehicles list footer link */}
      <div className="pt-2 print:hidden select-none">
        <button
          onClick={() => navigate('/vehicles')}
          className="flex items-center space-x-1.5 text-slate-450 hover:text-slate-800 font-bold text-[13px] transition-colors cursor-pointer bg-transparent border-0 outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vehicles List</span>
        </button>
      </div>

      {/* Replace Document Details form modal */}
      {isReplaceOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-[420px] w-full p-6 space-y-5 shadow-2xl scale-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3 select-none">
              <div>
                <h4 className="text-[15px] font-bold text-slate-800 font-outfit">Replace {replaceDocType} Details</h4>
                <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Digitize compliance copy</p>
              </div>
              <button 
                onClick={() => setIsReplaceOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleReplaceSubmit} className="space-y-4">
              <div className="space-y-1.5 text-[12.5px]">
                <label className="font-bold text-slate-500 block">Certificate / Policy Number</label>
                <input
                  type="text"
                  value={replaceForm.document_number}
                  onChange={(e) => setReplaceForm({ ...replaceForm, document_number: e.target.value })}
                  placeholder={`Enter ${replaceDocType} reference no`}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:bg-white focus:border-slate-350 transition-all text-slate-800"
                />
              </div>

              {replaceDocType === 'Insurance' && (
                <div className="space-y-1.5 text-[12.5px]">
                  <label className="font-bold text-slate-500 block">Insurance Provider Company</label>
                  <input
                    type="text"
                    value={replaceForm.document_company}
                    onChange={(e) => setReplaceForm({ ...replaceForm, document_company: e.target.value })}
                    placeholder="Enter insurance company name"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:bg-white focus:border-slate-350 transition-all text-slate-800"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-[12.5px]">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 block">Issue Date</label>
                  <input
                    type="date"
                    value={replaceForm.issue_date}
                    onChange={(e) => setReplaceForm({ ...replaceForm, issue_date: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer outline-none text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 block">Expiry Date</label>
                  <input
                    type="date"
                    value={replaceForm.expiry_date}
                    onChange={(e) => setReplaceForm({ ...replaceForm, expiry_date: e.target.value })}
                    required
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer outline-none text-slate-800"
                  />
                </div>
                </div>

              <div className="flex space-x-2.5 pt-2 select-none">
                <button
                  type="button"
                  onClick={() => setIsReplaceOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 text-[12.5px] font-bold rounded-xl transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-brand hover:bg-teal-650 text-white text-[12.5px] font-bold rounded-xl transition-colors shadow-md shadow-teal-500/10 cursor-pointer border-0"
                >
                  Update Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-[380px] w-full p-6 space-y-4 shadow-2xl scale-in duration-200">
            <h4 className="text-[16px] font-bold text-slate-800">Confirm Deletion</h4>
            <p className="text-[13px] text-slate-500 leading-normal">
              Are you sure you want to delete this vehicle? All document information, alerts, and activity logs will be permanently removed.
            </p>
            <div className="flex space-x-2.5 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 text-[13px] font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-650 text-white text-[13px] font-bold rounded-xl transition-colors shadow-md shadow-red-500/10 cursor-pointer border-0"
              >
                Delete Vehicle
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

export default VehicleDetails;
