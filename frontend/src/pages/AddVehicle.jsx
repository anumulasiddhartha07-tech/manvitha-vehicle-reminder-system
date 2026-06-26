import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Keyboard, 
  User, 
  X, 
  Calendar, 
  Info, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Wand2,
  ShieldAlert,
  ChevronRight,
  Phone,
  FileText,
  FileUp,
  Tag,
  Shield
} from 'lucide-react';
import VehicleSVG from '../components/VehicleSVG';

const AddVehicle = () => {
  const { id } = useParams(); // For edit mode
  const isEditMode = !!id;
  const navigate = useNavigate();

  // Form Fields
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleType, setVehicleType] = useState('SUV');
  const [ownerName, setOwnerName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  
  // Expiries & Details
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [insurancePolicy, setInsurancePolicy] = useState('');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  
  const [permitExpiry, setPermitExpiry] = useState('');
  const [permitNumber, setPermitNumber] = useState('');
  
  const [fitnessExpiry, setFitnessExpiry] = useState('');
  const [fitnessCertificate, setFitnessCertificate] = useState('');
  


  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserEmail(u.email || 'admin@manivtha.com');
    }
  }, []);

  // Real-time duplicate vehicle number check
  useEffect(() => {
    if (!vehicleNumber || isEditMode) {
      setDuplicateWarning('');
      return;
    }

    const checkDuplicate = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://https://manvitha-vehicle-reminder-system-1.onrender.com/api/vehicles?search=${vehicleNumber}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const match = data.vehicles?.find(v => v.vehicle_number.toUpperCase() === vehicleNumber.toUpperCase());
          if (match) {
            setDuplicateWarning('Warning: This vehicle number is already registered in the system.');
          } else {
            setDuplicateWarning('');
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    const timer = setTimeout(checkDuplicate, 400); // debounce check
    return () => clearTimeout(timer);
  }, [vehicleNumber, isEditMode]);

  // Auto-calculated fields
  const [previewStatus, setPreviewStatus] = useState('Active');
  const [previewStatusDesc, setPreviewStatusDesc] = useState('All documents are valid');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // If edit mode, load existing data
  useEffect(() => {
    if (!isEditMode) return;

    const fetchVehicleData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://https://manvitha-vehicle-reminder-system-1.onrender.com/api/vehicles/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setVehicleNumber(data.vehicle_number);
          setBrand(data.brand || '');
          setVehicleModel(data.vehicle_model);
          setVehicleType(data.vehicle_type);
          setOwnerName(data.owner_name);
          setDriverName(data.driver_name || '');
          setContactNumber(data.contact_number || '');
          setRemarks(data.remarks || '');

          setInsurancePolicy(data.insurance_policy || '');
          setInsuranceCompany(data.insurance_company || '');
          setPermitNumber(data.permit_number || '');
          setFitnessCertificate(data.fitness_certificate || '');

          // Populate dates
          const insDoc = data.Documents?.find(d => d.document_type === 'Insurance');
          const perDoc = data.Documents?.find(d => d.document_type === 'Permit');
          const fitDoc = data.Documents?.find(d => d.document_type === 'Fitness');

          if (insDoc) setInsuranceExpiry(insDoc.expiry_date);
          if (perDoc) setPermitExpiry(perDoc.expiry_date);
          if (fitDoc) setFitnessExpiry(fitDoc.expiry_date);
        }
      } catch (err) {
        console.error('Failed to load vehicle details for editing:', err);
      }
    };
    fetchVehicleData();
  }, [id, isEditMode]);

  // Recalculate preview status whenever dates change
  useEffect(() => {
    const today = new Date('2026-06-22'); // Anchored system date
    const dates = [insuranceExpiry, permitExpiry, fitnessExpiry].filter(Boolean);

    if (dates.length === 0) {
      setPreviewStatus('Active');
      setPreviewStatusDesc('All documents are valid');
      return;
    }

    let nearestDays = Infinity;
    let isExpired = false;

    for (const d of dates) {
      const expDate = new Date(d);
      const diffTime = expDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        isExpired = true;
      }
      if (diffDays < nearestDays) {
        nearestDays = diffDays;
      }
    }

    if (isExpired) {
      setPreviewStatus('Expired');
      setPreviewStatusDesc('Immediate action required');
    } else if (nearestDays <= 30) {
      setPreviewStatus('Expiring Soon');
      setPreviewStatusDesc(`Nearest document expires in ${nearestDays} days`);
    } else {
      setPreviewStatus('Active');
      setPreviewStatusDesc('All documents are valid');
    }
  }, [insuranceExpiry, permitExpiry, fitnessExpiry]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (duplicateWarning) {
      setError('Please resolve the duplicate vehicle number warning before submitting.');
      return;
    }
    if (contactNumber && contactNumber.length !== 10) {
      setError('Contact Phone Number must be exactly 10 digits.');
      return;
    }
    setError('');
    executeSubmit();
  };

  const executeSubmit = async () => {
    setLoading(true);
    setShowOtpModal(false);

    const vehicleData = {
      vehicle_number: vehicleNumber,
      brand: brand || null,
      vehicle_model: vehicleModel || (vehicleType + ' Vehicle'),
      vehicle_type: vehicleType,
      owner_name: ownerName,
      driver_name: driverName || null,
      contact_number: contactNumber || null,
      insurance_expiry: insuranceExpiry,
      insurance_policy: insurancePolicy || null,
      insurance_company: insuranceCompany || null,
      permit_expiry: permitExpiry,
      permit_number: permitNumber || null,
      fitness_expiry: fitnessExpiry,
      fitness_certificate: fitnessCertificate || null,


      remarks: remarks
    };

    try {
      const token = localStorage.getItem('token');
      const url = isEditMode 
        ? `http://https://manvitha-vehicle-reminder-system-1.onrender.com/api/vehicles/${id}`
        : 'http://https://manvitha-vehicle-reminder-system-1.onrender.com/api/vehicles';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(vehicleData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save vehicle.');
      }

      setShowSuccessModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to print date preview in standard 15 Jul 2026 format
  const formatPreviewDate = (dateStr) => {
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return 'Not Specified';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Not Specified';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-[12px] font-semibold text-slate-400 select-none">
        <span className="hover:text-slate-650 cursor-pointer" onClick={() => navigate('/vehicles')}>Vehicles</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-600">{isEditMode ? 'Edit Vehicle' : 'Add Vehicle'}</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-[26px] font-bold text-slate-800 font-outfit leading-none">
          {isEditMode ? 'Edit Vehicle Profile' : 'Add New Fleet Vehicle'}
        </h1>
        <p className="text-[13px] text-slate-500 mt-1.5">
          {isEditMode ? 'Update vehicle records and active certifications' : 'Register a new asset and store its compliance document parameters'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Section */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-650 rounded-xl p-4 flex items-start space-x-2.5 text-[12px]">
              <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Vehicle Information */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-50 pb-3">
              <span className="p-1 bg-teal-50 text-teal-650 rounded-lg">
                <VehicleSVG type={vehicleType} className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-[14px] text-teal-900">1. Vehicle & Driver Specifications</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500">
                  Vehicle Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Keyboard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="TS09AB1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl text-[13px] text-slate-700 placeholder-slate-400 uppercase"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 font-medium mt-1 select-none">
                  Example format: TS09AB1234
                </p>
                {duplicateWarning && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{duplicateWarning}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500">
                  Vehicle Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl text-[13px] text-slate-700 font-medium cursor-pointer bg-white"
                >
                  <option value="SUV">SUV</option>
                  <option value="Traveller">Traveller</option>
                  <option value="Bus">Bus</option>
                  <option value="Car">Car</option>
                  <option value="Van">Van</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500">
                  Brand Name (e.g. Toyota, Force)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Toyota"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl text-[13px] text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500">
                  Vehicle Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Toyota Innova Crysta"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl text-[13px] text-slate-700 placeholder-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500">
                  Owner Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ramesh Kumar"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl text-[13px] text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500">
                  Driver Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Suresh Yadav"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl text-[13px] text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[12px] font-bold text-slate-500">
                  Contact Phone Number (For Expiry Alerts Notifications)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl text-[13px] text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Document Compliance Details */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-slate-50 pb-3">
              <span className="p-1 bg-violet-50 text-violet-600 rounded-lg">
                <Calendar className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-[14px] text-violet-800">2. Document Expiries & Certificates</h3>
            </div>

            {/* Insurance Policy Block */}
            <div className="space-y-3.5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <h4 className="text-[13px] font-extrabold text-slate-700">Insurance Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</label>
                  <input
                    type="date"
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] text-slate-700 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Policy Number</label>
                  <input
                    type="text"
                    placeholder="POL-12345"
                    value={insurancePolicy}
                    onChange={(e) => setInsurancePolicy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] text-slate-700 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Insurance Provider</label>
                  <input
                    type="text"
                    placeholder="HDFC ERGO"
                    value={insuranceCompany}
                    onChange={(e) => setInsuranceCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] text-slate-700 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* National Permit Block */}
            <div className="space-y-3.5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <h4 className="text-[13px] font-extrabold text-slate-700">Permit Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</label>
                  <input
                    type="date"
                    value={permitExpiry}
                    onChange={(e) => setPermitExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] text-slate-700 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Permit Number</label>
                  <input
                    type="text"
                    placeholder="PERM-9876"
                    value={permitNumber}
                    onChange={(e) => setPermitNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] text-slate-700 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Fitness Certificate Block */}
            <div className="space-y-3.5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <h4 className="text-[13px] font-extrabold text-slate-700">Fitness Certificate Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</label>
                  <input
                    type="date"
                    value={fitnessExpiry}
                    onChange={(e) => setFitnessExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] text-slate-700 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fitness Certificate No</label>
                  <input
                    type="text"
                    placeholder="FITC-6543"
                    value={fitnessCertificate}
                    onChange={(e) => setFitnessCertificate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] text-slate-700 bg-white"
                  />
                </div>
              </div>
            </div>



            {/* Blue Alert Notice */}
            <div className="bg-sky-50 border border-sky-100 text-sky-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-[12.5px] font-semibold select-none">
              <Info className="w-4 h-4 shrink-0 text-sky-500" />
              <span>We monitor exspiries automatically and send warnings at 30, 15, 7, 1 days to compliance teams.</span>
            </div>
          </div>

          {/* Section 3: Additional Notes */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-50 pb-3">
              <span className="p-1 bg-amber-50 text-amber-600 rounded-lg">
                <Info className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-[14px] text-amber-800">3. Additional Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500">Remarks (Optional)</label>
                <textarea
                  placeholder="Regular fleet transport vehicle"
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl text-[13px] text-slate-700 placeholder-slate-400 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500">Status (Auto Calculated)</label>
                <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2.5 select-none">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    previewStatus === 'Active'
                      ? 'bg-emerald-500'
                      : previewStatus === 'Expiring Soon'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}></span>
                  <div className="text-[12.5px] font-bold text-slate-700">
                    {previewStatus}
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{previewStatusDesc}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/vehicles')}
              className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[13.5px] font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-teal-brand hover:bg-teal-brandHover text-white text-[13.5px] font-bold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-md shadow-teal-700/10 active:scale-[0.99] cursor-pointer"
            >
              <Save className="w-4.5 h-4.5" />
              <span>{isEditMode ? 'Save Changes' : 'Save Vehicle'}</span>
            </button>
          </div>
        </form>

        {/* Right Column: Live Preview Panel */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1 text-[13px] select-none">
            <div className="flex items-center space-x-1.5 text-slate-600 font-bold">
              <Wand2 className="w-4 h-4 text-teal-brand" />
              <span>Compliance Card Live Preview</span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-500 font-bold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Update</span>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center border border-teal-100/50 shadow-inner text-teal-brand mx-auto">
                <Shield className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-[19px] font-extrabold text-slate-800 leading-none uppercase">
                  {vehicleNumber || 'TS09AB1234'}
                </h4>
                <p className="text-[12px] text-slate-400 font-semibold mt-1">
                  {brand || 'Brand'} {vehicleModel || 'Vehicle Model'}
                </p>
                <div className="mt-2.5">
                  <span className="text-[10px] font-bold text-teal-brand bg-teal-50 border border-teal-100/50 px-3 py-0.5 rounded-full uppercase tracking-wider">
                    {vehicleType}
                  </span>
                </div>
              </div>
            </div>

            {/* Preview Spec Details */}
            <div className="space-y-3.5 border-t border-slate-50 pt-4 text-[12px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Owner Name</span>
                <span className="text-slate-800 font-bold">{ownerName || 'Ramesh Kumar'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Driver / Contact</span>
                <span className="text-slate-800 font-bold">{driverName || 'Suresh'} {contactNumber ? `(${contactNumber})` : ''}</span>
              </div>

              <div className="w-full border-t border-dashed border-slate-100 my-1"></div>

              {/* Expiry Dates */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Insurance Expiry</span>
                <div className="text-right">
                  <p className="text-slate-700 font-bold leading-none">{formatPreviewDate(insuranceExpiry)}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{insurancePolicy || 'No policy'}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Permit Expiry</span>
                <div className="text-right">
                  <p className="text-slate-700 font-bold leading-none">{formatPreviewDate(permitExpiry)}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{permitNumber || 'No permit'}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Fitness Expiry</span>
                <div className="text-right">
                  <p className="text-slate-700 font-bold leading-none">{formatPreviewDate(fitnessExpiry)}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{fitnessCertificate || 'No fitness'}</p>
                </div>
              </div>



            </div>

            {/* Bottom Status Block */}
            <div className="border-t border-slate-50 pt-4 space-y-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Compliance Status</div>

              {previewStatus === 'Active' ? (
                <div className="bg-emerald-50 border border-emerald-100/50 rounded-xl p-3 flex items-start space-x-2.5 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-[13px] leading-none">Compliant</p>
                    <p className="text-[10px] text-emerald-600/90 font-medium mt-1">All certificates are valid</p>
                  </div>
                </div>
              ) : previewStatus === 'Expiring Soon' ? (
                <div className="bg-amber-50 border border-amber-100/50 rounded-xl p-3 flex items-start space-x-2.5 text-amber-700">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-[13px] leading-none">Warning Alert</p>
                    <p className="text-[10px] text-amber-600/90 font-medium mt-1">Approaching warning thresholds</p>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-100/50 rounded-xl p-3 flex items-start space-x-2.5 text-rose-700">
                  <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-[13px] leading-none">Non-Compliant</p>
                    <p className="text-[10px] text-rose-650/90 font-medium mt-1">Expired certificates detected</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300 select-none">
          <div className="bg-white rounded-[32px] p-8 max-w-[360px] w-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
            {/* Top gradient accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600"></div>

            {/* Glowing checkmark badge */}
            <div className="relative mt-2">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl scale-125 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/80 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                <CheckCircle2 className="w-11 h-11 drop-shadow-sm stroke-[2.25]" />
              </div>
            </div>

            <h3 className="text-[20px] font-black text-slate-800 font-outfit mt-6 leading-none tracking-tight">
              {isEditMode ? 'Vehicle Updated!' : 'Vehicle Registered!'}
            </h3>
            
            <p className="text-[13px] text-slate-500 font-medium mt-3 leading-relaxed px-1">
              {isEditMode 
                ? `Vehicle ${vehicleNumber} details have been successfully updated.`
                : `Vehicle ${vehicleNumber} has been successfully added to your fleet registry.`
              }
            </p>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/vehicles');
              }}
              className="w-full mt-7 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-[13.5px] tracking-wide rounded-2xl shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/35 active:scale-[0.98] transition-all duration-200 cursor-pointer border-0"
            >
              Back to Fleet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddVehicle;
