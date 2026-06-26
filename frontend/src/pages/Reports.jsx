import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Eye
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reports = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch all vehicles for client-side filtering
  const fetchAllVehicles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = `http://https://manvitha-vehicle-reminder-system-1.onrender.com/api/vehicles?limit=1000`; // Fetch all vehicles
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles for reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVehicles();
  }, []);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('All');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
  };

  // Filter logic
  const filteredVehicles = vehicles.filter(v => {
    // 1. Search
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      v.vehicle_number?.toLowerCase().includes(searchLower) ||
      v.vehicle_model?.toLowerCase().includes(searchLower) ||
      v.brand?.toLowerCase().includes(searchLower) ||
      v.owner_name?.toLowerCase().includes(searchLower) ||
      v.driver_name?.toLowerCase().includes(searchLower);

    // 2. Vehicle Type
    const matchesType = typeFilter === 'All' || v.vehicle_type === typeFilter;

    // 3. Status
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;

    // 4. Date Range filter (checks if ANY document expires within range)
    let matchesDate = true;
    if (startDate || endDate) {
      matchesDate = false;
      const docExpiries = [
        ...v.Documents?.map(d => d.expiry_date) || []
      ].filter(Boolean);

      for (const expStr of docExpiries) {
        const expDate = new Date(expStr);
        let inRange = true;
        if (startDate && expDate < new Date(startDate)) inRange = false;
        if (endDate && expDate > new Date(endDate)) inRange = false;
        if (inRange) {
          matchesDate = true;
          break;
        }
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  // Calculate statistics from filtered list
  const stats = {
    total: filteredVehicles.length,
    active: filteredVehicles.filter(v => v.status === 'Active').length,
    expiringSoon: filteredVehicles.filter(v => v.status === 'Expiring Soon').length,
    expired: filteredVehicles.filter(v => v.status === 'Expired').length,
  };

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (format === 'csv') {
        // Fetch generated CSV from backend directly
        const queryParams = new URLSearchParams();
        if (statusFilter !== 'All') queryParams.append('status', statusFilter);
        if (typeFilter !== 'All') queryParams.append('type', typeFilter);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);

        const url = `http://https://manvitha-vehicle-reminder-system-1.onrender.com/api/reports/export?${queryParams.toString()}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const blob = await res.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `fleet_compliance_report_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      } else if (format === 'excel') {
        // Client-side simulated Excel (using CSV formatted content download)
        let excelContent = 'Vehicle Number,Vehicle Type,Brand,Model,Owner Name,Driver Name,Contact,Status,Insurance Expiry,Permit Expiry,Fitness Expiry\n';
        filteredVehicles.forEach(v => {
          const ins = v.Documents?.find(d => d.document_type === 'Insurance')?.expiry_date || '';
          const per = v.Documents?.find(d => d.document_type === 'Permit')?.expiry_date || '';
          const fit = v.Documents?.find(d => d.document_type === 'Fitness')?.expiry_date || '';
          excelContent += `"${v.vehicle_number}","${v.vehicle_type}","${v.brand || ''}","${v.vehicle_model}","${v.owner_name}","${v.driver_name || ''}","${v.contact_number || ''}","${v.status}","${ins}","${per}","${fit}"\n`;
        });

        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `fleet_compliance_report_${new Date().toISOString().split('T')[0]}.xls`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else if (format === 'pdf') {
        const doc = new jsPDF('landscape', 'pt', 'a4');
        
        // Theme Colors
        const primaryColor = [14, 165, 168]; // Teal #0EA5A8
        const darkNavy = [30, 41, 59]; // Slate #1E293B

        // Document Dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;

        // Header & Corporate Branding on every page
        const addHeaderFooter = (pdfDoc, pageNum, totalPagesCount) => {
          // Header
          pdfDoc.setFillColor(248, 250, 252);
          pdfDoc.rect(0, 0, pageWidth, 60, 'F');
          pdfDoc.setDrawColor(226, 232, 240);
          pdfDoc.line(0, 60, pageWidth, 60);

          pdfDoc.setFont('helvetica', 'bold');
          pdfDoc.setFontSize(14);
          pdfDoc.setTextColor(...darkNavy);
          pdfDoc.text('MANIVTHA TOURS & TRAVELS', margin, 35);

          pdfDoc.setFont('helvetica', 'normal');
          pdfDoc.setFontSize(9);
          pdfDoc.setTextColor(100, 116, 139);
          pdfDoc.text('Vehicle Insurance & Permit Renewal Reminder System', margin, 48);

          pdfDoc.setFont('helvetica', 'bold');
          pdfDoc.setFontSize(10);
          pdfDoc.setTextColor(...primaryColor);
          pdfDoc.text('FLEET COMPLIANCE AUDIT REPORT', pageWidth - margin - 150, 35, { align: 'right' });

          pdfDoc.setFont('helvetica', 'normal');
          pdfDoc.setFontSize(8);
          pdfDoc.setTextColor(148, 163, 184);
          const generatedOn = `Generated: ${new Date().toLocaleString()}`;
          pdfDoc.text(generatedOn, pageWidth - margin, 48, { align: 'right' });

          // Footer
          pdfDoc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
          pdfDoc.setFontSize(8);
          pdfDoc.setTextColor(148, 163, 184);
          pdfDoc.text('CONFIDENTIAL - COMPLIANCE REGISTRY REPORT', margin, pageHeight - 25);
          
          const pageText = `Page ${pageNum} of ${totalPagesCount}`;
          pdfDoc.text(pageText, pageWidth - margin, pageHeight - 25, { align: 'right' });
        };

        // First Page Cover summary box
        doc.setFillColor(250, 251, 252);
        doc.roundedRect(margin, 80, pageWidth - (margin * 2), 100, 8, 8, 'F');
        doc.setDrawColor(230, 235, 240);
        doc.roundedRect(margin, 80, pageWidth - (margin * 2), 100, 8, 8, 'D');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...darkNavy);
        doc.text('FLEET AUDIT SUMMARY', margin + 20, 105);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);

        const userStr = localStorage.getItem('user');
        const uName = userStr ? JSON.parse(userStr).name : 'Administrator';

        doc.text(`Generated By: ${uName}`, margin + 20, 125);
        doc.text(`Total Records Queried: ${filteredVehicles.length}`, margin + 20, 142);
        doc.text(`Active Filters: Type = ${typeFilter}, Status = ${statusFilter}`, margin + 20, 159);

        const dateRangeText = (startDate || endDate) 
          ? `Expiry Range: ${startDate || 'Beginning'} to ${endDate || 'Present'}`
          : 'Expiry Range: All Expiries';
        doc.text(dateRangeText, pageWidth / 2, 125);
        doc.text(`Compliant: ${stats.active} | Warning: ${stats.expiringSoon} | Expired: ${stats.expired}`, pageWidth / 2, 142);

        // Prepare table data
        const tableColumns = [
          { header: 'Vehicle Number', dataKey: 'number' },
          { header: 'Model / Type', dataKey: 'model' },
          { header: 'Insurance Expiry', dataKey: 'insurance' },
          { header: 'Permit Expiry', dataKey: 'permit' },
          { header: 'Fitness Expiry', dataKey: 'fitness' },
          { header: 'Status', dataKey: 'status' }
        ];

        const tableRows = filteredVehicles.map(v => {
          const ins = v.Documents?.find(d => d.document_type === 'Insurance')?.expiry_date || '--';
          const per = v.Documents?.find(d => d.document_type === 'Permit')?.expiry_date || '--';
          const fit = v.Documents?.find(d => d.document_type === 'Fitness')?.expiry_date || '--';
          return {
            number: v.vehicle_number,
            model: `${v.brand || ''} ${v.vehicle_model} (${v.vehicle_type})`,
            insurance: ins,
            permit: per,
            fitness: fit,
            status: v.status
          };
        });

        doc.autoTable({
          columns: tableColumns,
          body: tableRows,
          startY: 200,
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
            number: { cellWidth: 90 },
            model: { cellWidth: 180 },
            insurance: { cellWidth: 120 },
            permit: { cellWidth: 120 },
            fitness: { cellWidth: 120 },
            status: { cellWidth: 70 }
          }
        });

        const totalPagesCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPagesCount; i++) {
          doc.setPage(i);
          addHeaderFooter(doc, i, totalPagesCount);
        }

        doc.save(`fleet_compliance_report_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (err) {
      console.error('Failed to export report', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Expired':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100 rounded-full inline-flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Expired</span>
          </span>
        );
      case 'Expiring Soon':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-100 rounded-full inline-flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Expiring Soon</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-teal-50 text-teal-600 border border-teal-100 rounded-full inline-flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            <span>Active</span>
          </span>
        );
    }
  };

  const getExpiryLabel = (dateStr) => {
    if (!dateStr) return <span className="text-slate-300">-</span>;
    const today = new Date('2026-06-22');
    const date = new Date(dateStr);
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    if (diff <= 0) {
      return <span className="text-rose-600 font-semibold">{dateStr} (Lapsed)</span>;
    } else if (diff <= 30) {
      return <span className="text-amber-600 font-semibold">{dateStr} ({diff}d left)</span>;
    }
    return <span className="text-slate-600">{dateStr}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 select-none">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-800 font-outfit leading-none">Compliance Reports & Audit</h1>
          <p className="text-[13px] text-slate-500 mt-1.5">Query compliance summaries, filter fleet documents and run compliance exports.</p>
        </div>
        
        {/* Export Actions */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[12px] rounded-xl flex items-center space-x-1.5 bg-white shadow-sm shrink-0 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-450" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Options Board */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-[14px] pb-1 border-b border-slate-50">
          <Filter className="w-4 h-4 text-teal-500" />
          <span>Report Filter Parameters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Search Fleet</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Number, brand, model..."
                className="w-full pl-10 pr-4 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white transition-colors text-slate-700"
            >
              <option value="All">All Types</option>
              <option value="SUV">SUV</option>
              <option value="Traveller">Traveller</option>
              <option value="Bus">Bus</option>
              <option value="Car">Car</option>
              <option value="Van">Van</option>
            </select>
          </div>

          {/* Compliance Status */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Compliance Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white transition-colors text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active / Compliant</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired / Non-Compliant</option>
            </select>
          </div>

          {/* Expiry Start Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expiry Range Start</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-600"
              />
            </div>
          </div>

          {/* Expiry End Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expiry Range End</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Clear Actions */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[12px] rounded-xl flex items-center space-x-1.5 bg-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Mini KPI Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filtered Assets</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Compliant Fleet</p>
            <p className="text-2xl font-bold text-teal-600">{stats.active}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-teal-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expiring Warning</p>
            <p className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Non-Compliant (Expired)</p>
            <p className="text-2xl font-bold text-rose-600">{stats.expired}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-rose-500" />
          </div>
        </div>
      </div>

      {/* Compliance Table Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-48 w-full flex items-center justify-center text-slate-400 text-[13px] font-medium">
            Fetching fleet compliance logs...
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="h-48 w-full flex flex-col items-center justify-center text-slate-400 space-y-2 p-6">
            <FileText className="w-8 h-8 text-slate-300" />
            <p className="text-[13px] font-medium">No vehicle compliance records match current filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Details</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type / Brand</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Insurance Expiry</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Permit Expiry</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fitness Expiry</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.map((v) => {
                  const insDoc = v.Documents?.find(d => d.document_type === 'Insurance');
                  const perDoc = v.Documents?.find(d => d.document_type === 'Permit');
                  const fitDoc = v.Documents?.find(d => d.document_type === 'Fitness');
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Vehicle Details */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5 max-w-[150px]">
                          <p className="font-bold text-[13px] text-slate-800 font-outfit uppercase truncate" title={v.vehicle_number}>{v.vehicle_number}</p>
                          <p className="text-[11px] text-slate-400 truncate" title={v.owner_name}>{v.owner_name}</p>
                        </div>
                      </td>
                      {/* Brand & Model */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5 max-w-[150px]">
                          <p className="font-medium text-[13px] text-slate-700 truncate" title={v.vehicle_model}>{v.vehicle_model}</p>
                          <p className="text-[11px] text-teal-650 font-semibold truncate" title={v.brand || v.vehicle_type}>{v.brand || v.vehicle_type}</p>
                        </div>
                      </td>
                      {/* Badge Status */}
                      <td className="px-5 py-3.5">
                        {getStatusBadge(v.status)}
                      </td>
                      {/* Expiries */}
                      <td className="px-5 py-3.5 text-[12.5px] whitespace-nowrap">
                        {getExpiryLabel(insDoc?.expiry_date)}
                      </td>
                      <td className="px-5 py-3.5 text-[12.5px] whitespace-nowrap">
                        {getExpiryLabel(perDoc?.expiry_date)}
                      </td>
                      <td className="px-5 py-3.5 text-[12.5px] whitespace-nowrap">
                        {getExpiryLabel(fitDoc?.expiry_date)}
                      </td>
                      {/* View Action */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => navigate(`/vehicles/${v.id}`)}
                          className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-teal-600 rounded-lg inline-flex items-center justify-center transition-colors"
                          title="View compliance timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
