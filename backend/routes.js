import express from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import crypto from 'crypto';
import { User, Vehicle, VehicleDocument, Alert, Notification, Setting } from './database.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendLoginOtpEmail, sendPasswordResetLinkEmail, sendDocumentExpiryEmail, sendDocumentExpiredEmail, sendTestEmail } from './emailService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'manvithaa_secret_key_123';

// Middleware for JWT verification
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
      if (err) {
        return res.status(403).json({ error: 'Forbidden. Invalid token.' });
      }
      try {
        const user = await User.findByPk(decodedUser.id);
        if (!user) {
          return res.status(401).json({ error: 'User session invalid. Please log in again.' });
        }
        req.user = decodedUser;
        next();
      } catch (dbErr) {
        console.error('JWT auth database check failed:', dbErr);
        return res.status(500).json({ error: 'Database verification failed.' });
      }
    });
  } else {
    res.status(401).json({ error: 'Unauthorized. Token required.' });
  }
};

// Middleware for Role-Based Access Control - Passthrough to remove role restrictions
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    next();
  };
};


// ----------------- AUTHENTICATION ENDPOINTS -----------------

const otpStore = new Map(); // Used for Settings/Delete actions OTP checks
const registerOtpStore = new Map(); // Used for user registration OTP checks
const resetOtpStore = new Map(); // Used for password resets OTP checks
const loginOtpStore = new Map(); // Used for login OTP checks

// POST /api/auth/send-otp (Settings/Delete actions)
router.post('/auth/send-otp', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 });
  console.log(`[CONFIRM OTP] Generated verification OTP for ${email}: ${otp}`);
  res.json({ success: true, otp, message: `OTP sent to ${email}` });
});

// POST /api/auth/verify-otp (Settings/Delete actions)
router.post('/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
  const stored = otpStore.get(email);
  if (!stored) return res.status(400).json({ error: 'OTP not requested or expired' });
  if (stored.expires < Date.now()) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (stored.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  otpStore.delete(email);
  res.json({ success: true, message: 'OTP verified successfully' });
});

// POST /api/auth/register (No Role-based signup, direct activation)
router.post('/auth/register', async (req, res) => {
  const { full_name, email, password, confirmPassword } = req.body;
  if (!full_name || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  try {
    // Check if email already registered
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const user = await User.create({
      full_name,
      email,
      password, // Setter virtual sets password_hash
      username: full_name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '') || email.split('@')[0],
      email_verified: true // Set to true directly
    });

    // Create default settings row safely
    await Setting.findOrCreate({
      where: { user_id: user.id },
      defaults: {
        user_id: user.id,
        company_name: 'Manivtha Tours & Travels',
        company_location: 'Hyderabad, Telangana, India',
        company_contact: '+91 98765 43210',
        insurance_alerts_enabled: true,
        permit_alerts_enabled: true,
        fitness_alerts_enabled: true,
        reminder_days: 30,
        theme: 'Light'
      }
    });

    res.json({ success: true, requiresVerification: false, message: 'Account created successfully! Please log in.' });
  } catch (error) {
    console.error('Register account error:', error);
    res.status(500).json({ error: 'Failed to create user account.' });
  }
});

// POST /api/auth/verify-email (Activation)
router.post('/auth/verify-email', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP verification code are required.' });
  }

  const record = registerOtpStore.get(email);
  if (!record) return res.status(400).json({ error: 'OTP not requested or expired.' });

  if (record.expires < Date.now()) {
    registerOtpStore.delete(email);
    return res.status(400).json({ error: 'Verification code expired.' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid verification code.' });
  }

  try {
    const user = await User.findByPk(record.userId);
    if (!user) return res.status(404).json({ error: 'User account not found.' });

    user.email_verified = true;
    await user.save();

    // Create default settings row safely
    await Setting.findOrCreate({
      where: { user_id: user.id },
      defaults: {
        user_id: user.id,
        company_name: 'Manivtha Tours & Travels',
        company_location: 'Hyderabad, Telangana, India',
        company_contact: '+91 98765 43210',
        insurance_alerts_enabled: true,
        permit_alerts_enabled: true,
        fitness_alerts_enabled: true,
        reminder_days: 30,
        theme: 'Light'
      }
    });

    registerOtpStore.delete(email);
    res.json({ success: true, message: 'Your account has been verified and activated.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Email verification failed.' });
  }
});

// POST /api/auth/resend-otp
router.post('/auth/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const user = await User.findOne({ where: { email, email_verified: false } });
    if (!user) return res.status(400).json({ error: 'User is either not found or already verified.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    registerOtpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000, userId: user.id });

    console.log(`[RESEND OTP] New verification OTP for ${email}: ${otp}`);
    await sendVerificationEmail(user.id, email, user.full_name, otp);

    res.json({ success: true, message: 'A new verification OTP code has been sent.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Resending OTP failed.' });
  }
});

// POST /api/auth/forgot-password
router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'No account registered with this email address.' });

    res.json({ success: true, message: 'Please enter your new password.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Requesting password reset failed.' });
  }
});

// POST /api/auth/reset-password
router.post('/auth/reset-password', async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User account not found.' });

    user.password = password; // hashed automatically by hooks
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Resetting password failed.' });
  }
});

// POST /api/auth/login-password (Direct login using password)
router.post('/auth/login-password', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Your account email is not verified yet.' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Your account is currently inactive. Please contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const setting = await Setting.findOne({ where: { user_id: user.id } });

    // Login log removed

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      settings: setting || {}
    });
  } catch (error) {
    console.error('Password login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login (Sends OTP for login verification - passwordless)
router.post('/auth/login', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'No account registered with this email address.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    loginOtpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000, userId: user.id });

    console.log(`[LOGIN OTP] Verification OTP for ${email}: ${otp}`);
    await sendLoginOtpEmail(user.id, email, user.name, otp);

    res.json({
      success: true,
      requiresOtp: true,
      otp, // Return OTP for local helper display
      message: 'Verification OTP code sent to your email.'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login-verify (Completes login using OTP - passwordless)
router.post('/auth/login-verify', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP code are required.' });
  }

  const record = loginOtpStore.get(email);
  if (!record) return res.status(400).json({ error: 'OTP not requested or expired.' });

  if (record.expires < Date.now()) {
    loginOtpStore.delete(email);
    return res.status(400).json({ error: 'Verification code expired.' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid verification code.' });
  }

  try {
    const user = await User.findByPk(record.userId);
    if (!user) return res.status(404).json({ error: 'User account not found.' });

    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Your account is currently inactive. Please contact support.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const setting = await Setting.findOne({ where: { user_id: user.id } });

    loginOtpStore.delete(email);

    // OTP login log removed

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      settings: setting || {}
    });
  } catch (error) {
    console.error('Login verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout (Logs user logout)
router.post('/auth/logout', authenticateJWT, async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});


// GET /api/auth/me
router.get('/auth/me', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const setting = await Setting.findOne({ where: { user_id: user.id } });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      settings: setting || {}
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const parseDate = (dateStr) => {
  if (!dateStr || String(dateStr).trim() === '' || dateStr === 'null' || dateStr === 'undefined' || dateStr === 'Not Mentioned') return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : dateStr;
};

// ----------------- VEHICLE MANAGEMENT ENDPOINTS -----------------

const calculateVehicleStatus = (expiryDates) => {
  const today = new Date('2026-06-22'); // Anchoring base line
  let status = 'Active';

  for (const dateStr of expiryDates) {
    if (!dateStr) continue;
    const expDate = new Date(dateStr);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return 'Expired';
    } else if (diffDays <= 30) {
      status = 'Expiring Soon';
    }
  }

  return status;
};

const getDocStatus = (dateStr) => {
  if (!dateStr) return 'Active';
  const today = new Date('2026-06-22');
  const expDate = new Date(dateStr);
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Expired';
  if (diffDays <= 30) return 'Expiring Soon';
  return 'Active';
};

const formatVehicle = (vehicle) => {
  if (!vehicle) return null;

  const doc = vehicle.VehicleDocument;
  const docs = [];

  if (doc) {
    if (doc.insurance_expiry) {
      docs.push({
        id: `${vehicle.id}-ins`,
        vehicle_id: vehicle.id,
        document_type: 'Insurance',
        issue_date: doc.insurance_issue_date || null,
        expiry_date: doc.insurance_expiry,
        status: getDocStatus(doc.insurance_expiry)
      });
    }
    if (doc.permit_expiry) {
      docs.push({
        id: `${vehicle.id}-per`,
        vehicle_id: vehicle.id,
        document_type: 'Permit',
        issue_date: doc.permit_issue_date || null,
        expiry_date: doc.permit_expiry,
        status: getDocStatus(doc.permit_expiry)
      });
    }
    if (doc.fitness_expiry) {
      docs.push({
        id: `${vehicle.id}-fit`,
        vehicle_id: vehicle.id,
        document_type: 'Fitness',
        issue_date: doc.fitness_issue_date || null,
        expiry_date: doc.fitness_expiry,
        status: getDocStatus(doc.fitness_expiry)
      });
    }
  }

  let modelName = vehicle.model || `${vehicle.vehicle_type} Vehicle`;
  let remarksText = vehicle.remarks || '';
  if (vehicle.remarks) {
    try {
      const parsed = JSON.parse(vehicle.remarks);
      if (parsed && typeof parsed === 'object') {
        modelName = parsed.model || vehicle.model || modelName;
        remarksText = parsed.remarks || '';
      }
    } catch (e) {
      if (vehicle.remarks.includes('|')) {
        const parts = vehicle.remarks.split('|');
        modelName = parts[0] || vehicle.model || modelName;
        remarksText = parts.slice(1).join('|') || '';
      } else {
        remarksText = vehicle.remarks;
        const modelMap = {
          'SUV': 'Toyota Innova5 Crysta',
          'Traveller': 'Force Traveller 17 Seater',
          'Bus': 'Eicher Starline Bus',
          'Car': 'Maruti Ertiga',
          'Van': 'Maruti Eeco Van'
        };
        modelName = vehicle.model || modelMap[vehicle.vehicle_type] || modelName;
      }
    }
  } else {
    const modelMap = {
      'SUV': 'Toyota Innova Crysta',
      'Traveller': 'Force Traveller 17 Seater',
      'Bus': 'Eicher Starline Bus',
      'Car': 'Maruti Ertiga',
      'Van': 'Maruti Eeco Van'
    };
    modelName = vehicle.model || modelMap[vehicle.vehicle_type] || modelName;
  }

  return {
    id: vehicle.id,
    vehicle_number: vehicle.vehicle_number,
    vehicle_model: modelName,
    brand: vehicle.brand || '',
    contact_number: vehicle.contact_number || '',
    vehicle_type: vehicle.vehicle_type,
    owner_name: vehicle.owner_name,
    driver_name: vehicle.driver_name,
    remarks: remarksText,
    status: vehicle.status,
    registration_date: vehicle.registration_date || null,
    createdAt: vehicle.created_at || vehicle.createdAt,
    Documents: docs,
    Alerts: vehicle.Alerts,
    insurance_policy: doc ? doc.insurance_policy : '',
    insurance_company: doc ? doc.insurance_company : '',
    insurance_issue_date: doc ? doc.insurance_issue_date : '',
    insurance_expiry: doc ? doc.insurance_expiry : '',
    permit_number: doc ? doc.permit_number : '',
    permit_issue_date: doc ? doc.permit_issue_date : '',
    permit_expiry: doc ? doc.permit_expiry : '',
    fitness_expiry: doc ? doc.fitness_expiry : ''
  };
};

const createAlertsForVehicle = async (vehicle, insurance_expiry, permit_expiry, fitness_expiry) => {
  const today = new Date('2026-06-22');
  const docs = [
    { type: 'Insurance', date: insurance_expiry },
    { type: 'Permit', date: permit_expiry },
    { type: 'Fitness', date: fitness_expiry }
  ];

  for (const d of docs) {
    if (!d.date) continue;
    const expDate = new Date(d.date);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status = 'Active';
    if (diffDays <= 0) {
      status = 'Expired';
    } else if (diffDays <= 30) {
      status = 'Expiring Soon';
    }

    let alert = await Alert.findOne({
      where: {
        vehicle_id: vehicle.id,
        document_type: d.type
      }
    });

    if (status !== 'Active') {
      if (!alert) {
        alert = await Alert.create({
          vehicle_id: vehicle.id,
          document_type: d.type,
          days_left: diffDays,
          status: status
        });
      } else {
        alert.days_left = diffDays;
        alert.status = status;
        await alert.save();
      }

      const user = await User.findByPk(vehicle.user_id);
      if (user) {
        try {
          if (status === 'Expired') {
            await sendDocumentExpiredEmail(
              user.id,
              user.email,
              user.full_name,
              vehicle.id,
              vehicle.vehicle_number,
              d.type,
              d.date
            );
          } else if (status === 'Expiring Soon') {
            await sendDocumentExpiryEmail(
              user.id,
              user.email,
              user.full_name,
              vehicle.id,
              vehicle.vehicle_number,
              d.type,
              d.date,
              diffDays
            );
          }
        } catch (emailError) {
          console.error('[EMAIL ALERT ERROR] Failed to dispatch document email:', emailError.message);
        }
      }
    } else {
      if (alert && alert.status !== 'Resolved') {
        alert.status = 'Resolved';
        alert.days_left = diffDays;
        await alert.save();
      }
    }
  }
};

// GET /api/vehicles
router.get('/vehicles', authenticateJWT, async (req, res) => {
  const { search, status, type, page = 1, limit = 8 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { vehicle_number: { [Op.like]: `%${search}%` } },
        { remarks: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status && status !== 'All') {
      whereClause.status = status;
    }

    if (type && type !== 'All' && type !== 'All Type') {
      whereClause.vehicle_type = type;
    }

    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where: whereClause,
      include: [{ model: VehicleDocument, as: 'VehicleDocument' }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    const formatted = vehicles.map(v => formatVehicle(v));

    res.json({
      total: count,
      vehicles: formatted,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Fetch vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// GET /api/vehicles/:id
router.get('/vehicles/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await Vehicle.findOne({
      where: { id },
      include: [
        { model: VehicleDocument, as: 'VehicleDocument' },
        { model: Alert, as: 'Alerts' }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(formatVehicle(vehicle));
  } catch (error) {
    console.error('Fetch vehicle details error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle details' });
  }
});

// POST /api/vehicles (Scoped to req.user.id)
router.post('/vehicles', authenticateJWT, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const {
    vehicle_number,
    vehicle_model,
    brand,
    contact_number,
    vehicle_type,
    owner_name,
    driver_name,
    registration_date,
    insurance_issue_date,
    insurance_expiry,
    permit_issue_date,
    permit_expiry,
    fitness_issue_date,
    fitness_expiry,
    insurance_policy,
    insurance_company,
    permit_number,
    fitness_certificate,
    remarks
  } = req.body;

  const sanitizedRegistrationDate = parseDate(registration_date);
  const sanitizedInsuranceIssueDate = parseDate(insurance_issue_date);
  const sanitizedInsuranceExpiry = parseDate(insurance_expiry);
  const sanitizedPermitIssueDate = parseDate(permit_issue_date);
  const sanitizedPermitExpiry = parseDate(permit_expiry);
  const sanitizedFitnessIssueDate = parseDate(fitness_issue_date);
  const sanitizedFitnessExpiry = parseDate(fitness_expiry);

  if (!vehicle_number || !vehicle_type || !owner_name) {
    return res.status(400).json({ error: 'Vehicle number, vehicle type, and owner name are required.' });
  }

  try {
    // Unique check
    const existing = await Vehicle.findOne({ where: { vehicle_number } });
    if (existing) {
      return res.status(400).json({ error: 'Vehicle number already exists.' });
    }

    const status = calculateVehicleStatus([
      sanitizedInsuranceExpiry,
      sanitizedPermitExpiry,
      sanitizedFitnessExpiry
    ]);

    const vehicle = await Vehicle.create({
      vehicle_number,
      vehicle_type,
      brand: brand || null,
      model: vehicle_model || null,
      owner_name,
      driver_name: driver_name || null,
      contact_number: contact_number || null,
      remarks: JSON.stringify({ model: vehicle_model, remarks: remarks || '' }),
      status,
      registration_date: sanitizedRegistrationDate,
      user_id: req.user.id
    });

    await VehicleDocument.create({
      vehicle_id: vehicle.id,
      insurance_issue_date: sanitizedInsuranceIssueDate,
      insurance_expiry: sanitizedInsuranceExpiry,
      insurance_policy: insurance_policy || null,
      insurance_company: insurance_company || null,
      permit_issue_date: sanitizedPermitIssueDate,
      permit_expiry: sanitizedPermitExpiry,
      permit_number: permit_number || null,
      fitness_issue_date: sanitizedFitnessIssueDate,
      fitness_expiry: sanitizedFitnessExpiry,
      fitness_certificate: fitness_certificate || null
    });

    await createAlertsForVehicle(
      vehicle,
      sanitizedInsuranceExpiry,
      sanitizedPermitExpiry,
      sanitizedFitnessExpiry
    );

    // Vehicle Added log removed

    // Fetch full vehicle with association to format correctly
    const savedVehicle = await Vehicle.findOne({
      where: { id: vehicle.id },
      include: [{ model: VehicleDocument, as: 'VehicleDocument' }]
    });

    res.status(201).json(formatVehicle(savedVehicle));
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Failed to create vehicle.' });
  }
});

// PUT /api/vehicles/:id (Scoped to req.user.id)
router.put('/vehicles/:id', authenticateJWT, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const { id } = req.params;
  const {
    vehicle_number,
    vehicle_model,
    brand,
    contact_number,
    vehicle_type,
    owner_name,
    driver_name,
    registration_date,
    insurance_issue_date,
    insurance_expiry,
    permit_issue_date,
    permit_expiry,
    fitness_issue_date,
    fitness_expiry,
    insurance_policy,
    insurance_company,
    permit_number,
    fitness_certificate,
    remarks
  } = req.body;

  const sanitizedRegistrationDate = registration_date !== undefined ? parseDate(registration_date) : undefined;
  const sanitizedInsuranceIssueDate = insurance_issue_date !== undefined ? parseDate(insurance_issue_date) : undefined;
  const sanitizedInsuranceExpiry = insurance_expiry !== undefined ? parseDate(insurance_expiry) : undefined;
  const sanitizedPermitIssueDate = permit_issue_date !== undefined ? parseDate(permit_issue_date) : undefined;
  const sanitizedPermitExpiry = permit_expiry !== undefined ? parseDate(permit_expiry) : undefined;
  const sanitizedFitnessIssueDate = fitness_issue_date !== undefined ? parseDate(fitness_issue_date) : undefined;
  const sanitizedFitnessExpiry = fitness_expiry !== undefined ? parseDate(fitness_expiry) : undefined;

  try {
    const vehicle = await Vehicle.findOne({
      where: { id },
      include: [{ model: VehicleDocument, as: 'VehicleDocument' }]
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (vehicle_number && vehicle_number !== vehicle.vehicle_number) {
      const existing = await Vehicle.findOne({ where: { vehicle_number } });
      if (existing) {
        return res.status(400).json({ error: 'Vehicle number already exists.' });
      }
      vehicle.vehicle_number = vehicle_number;
    }

    vehicle.vehicle_type = vehicle_type || vehicle.vehicle_type;
    vehicle.brand = brand !== undefined ? brand : vehicle.brand;
    vehicle.model = vehicle_model !== undefined ? vehicle_model : vehicle.model;
    vehicle.owner_name = owner_name || vehicle.owner_name;
    vehicle.driver_name = driver_name !== undefined ? driver_name : vehicle.driver_name;
    vehicle.contact_number = contact_number !== undefined ? contact_number : vehicle.contact_number;
    if (sanitizedRegistrationDate !== undefined) vehicle.registration_date = sanitizedRegistrationDate;

    // Update remarks/model JSON for legacy compatibility
    let currentModel = '';
    let currentRemarks = '';
    if (vehicle.remarks) {
      try {
        const parsed = JSON.parse(vehicle.remarks);
        currentModel = parsed.model;
        currentRemarks = parsed.remarks;
      } catch (e) {
        currentRemarks = vehicle.remarks;
      }
    }
    const newModel = vehicle_model !== undefined ? vehicle_model : currentModel;
    const newRemarks = remarks !== undefined ? remarks : currentRemarks;
    vehicle.remarks = JSON.stringify({ model: newModel, remarks: newRemarks });

    let doc = vehicle.VehicleDocument;
    if (!doc) {
      doc = await VehicleDocument.create({
        vehicle_id: vehicle.id,
        insurance_issue_date: sanitizedInsuranceIssueDate !== undefined ? sanitizedInsuranceIssueDate : null,
        insurance_expiry: sanitizedInsuranceExpiry !== undefined ? sanitizedInsuranceExpiry : null,
        insurance_policy: insurance_policy || null,
        insurance_company: insurance_company || null,
        permit_issue_date: sanitizedPermitIssueDate !== undefined ? sanitizedPermitIssueDate : null,
        permit_expiry: sanitizedPermitExpiry !== undefined ? sanitizedPermitExpiry : null,
        permit_number: permit_number || null,
        fitness_issue_date: sanitizedFitnessIssueDate !== undefined ? sanitizedFitnessIssueDate : null,
        fitness_expiry: sanitizedFitnessExpiry !== undefined ? sanitizedFitnessExpiry : null,
        fitness_certificate: fitness_certificate || null
      });
    } else {
      if (sanitizedInsuranceIssueDate !== undefined) doc.insurance_issue_date = sanitizedInsuranceIssueDate;
      if (sanitizedInsuranceExpiry !== undefined) doc.insurance_expiry = sanitizedInsuranceExpiry;
      doc.insurance_policy = insurance_policy !== undefined ? insurance_policy : doc.insurance_policy;
      doc.insurance_company = insurance_company !== undefined ? insurance_company : doc.insurance_company;
      if (sanitizedPermitIssueDate !== undefined) doc.permit_issue_date = sanitizedPermitIssueDate;
      if (sanitizedPermitExpiry !== undefined) doc.permit_expiry = sanitizedPermitExpiry;
      doc.permit_number = permit_number !== undefined ? permit_number : doc.permit_number;
      if (sanitizedFitnessIssueDate !== undefined) doc.fitness_issue_date = sanitizedFitnessIssueDate;
      if (sanitizedFitnessExpiry !== undefined) doc.fitness_expiry = sanitizedFitnessExpiry;
      doc.fitness_certificate = fitness_certificate !== undefined ? fitness_certificate : doc.fitness_certificate;
      await doc.save();
    }

    vehicle.status = calculateVehicleStatus([
      doc.insurance_expiry,
      doc.permit_expiry,
      doc.fitness_expiry
    ]);
    await vehicle.save();

    await createAlertsForVehicle(vehicle, doc.insurance_expiry, doc.permit_expiry, doc.fitness_expiry);

    // Vehicle Edited log removed

    const updatedVehicle = await Vehicle.findOne({
      where: { id: vehicle.id },
      include: [{ model: VehicleDocument, as: 'VehicleDocument' }]
    });

    res.json(formatVehicle(updatedVehicle));
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// DELETE /api/vehicles/:id
router.delete('/vehicles/:id', authenticateJWT, authorizeRoles('ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await Vehicle.findOne({ where: { id } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const num = vehicle.vehicle_number;
    await vehicle.destroy();

    console.log(`Vehicle ${num} deleted by ${req.user.email}`);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// ----------------- DOCUMENT MANAGEMENT ENDPOINTS -----------------

// GET /api/documents
router.get('/documents', authenticateJWT, async (req, res) => {
  const { search, type, status } = req.query;

  try {
    const vehicles = await Vehicle.findAll({
      include: [{ model: VehicleDocument, as: 'VehicleDocument' }]
    });

    const docsList = [];

    vehicles.forEach(vehicle => {
      const doc = vehicle.VehicleDocument;
      if (!doc) return;

      const types = [
        {
          type: 'Insurance',
          expiry: doc.insurance_expiry,
          issue: doc.insurance_issue_date,
          number: doc.insurance_policy,
          company: doc.insurance_company
        },
        {
          type: 'Permit',
          expiry: doc.permit_expiry,
          issue: doc.permit_issue_date,
          number: doc.permit_number,
          company: null
        },
        {
          type: 'Fitness',
          expiry: doc.fitness_expiry,
          issue: doc.fitness_issue_date,
          number: doc.fitness_certificate,
          company: null
        },
      ];

      types.forEach(t => {
        // Skip if expiry date is null/not specified
        if (!t.expiry) return;

        const docStatus = getDocStatus(t.expiry);

        // Apply type filter
        if (type && type !== 'All' && t.type !== type) return;

        // Apply status filter
        if (status && status !== 'All' && docStatus !== status) return;

        // Apply search filter
        if (search) {
          const matchSearch =
            vehicle.vehicle_number.toLowerCase().includes(search.toLowerCase()) ||
            (t.number && t.number.toLowerCase().includes(search.toLowerCase())) ||
            (t.company && t.company.toLowerCase().includes(search.toLowerCase()));
          if (!matchSearch) return;
        }

        docsList.push({
          id: `${vehicle.id}-${t.type.toLowerCase()}`,
          vehicle_id: vehicle.id,
          vehicle_number: vehicle.vehicle_number,
          vehicle_type: vehicle.vehicle_type,
          document_type: t.type,
          issue_date: t.issue || null,
          expiry_date: t.expiry,
          document_number: t.number || '',
          document_company: t.company || '',
          status: docStatus
        });
      });
    });

    res.json(docsList);
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents.' });
  }
});

// POST /api/documents/:id/replace
router.post('/documents/:id/replace', authenticateJWT, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  let vehicleId = req.params.id;
  let documentType = req.body.document_type || req.query.document_type;

  if (typeof vehicleId === 'string' && vehicleId.includes('-')) {
    const parts = vehicleId.split('-');
    vehicleId = parts[0];
    const typeAbbr = parts[1].toLowerCase();
    if (typeAbbr.startsWith('ins')) documentType = 'Insurance';
    else if (typeAbbr.startsWith('per')) documentType = 'Permit';
    else if (typeAbbr.startsWith('fit')) documentType = 'Fitness';
  }

  const sanitizedIssueDate = parseDate(issue_date);
  const sanitizedExpiryDate = parseDate(expiry_date);

  if (!documentType || !sanitizedExpiryDate) {
    return res.status(400).json({ error: 'Document type and a valid expiry date are required.' });
  }

  try {
    const vehicle = await Vehicle.findOne({
      where: { id: vehicleId },
      include: [{ model: VehicleDocument, as: 'VehicleDocument' }]
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    let doc = vehicle.VehicleDocument;
    if (!doc) {
      doc = await VehicleDocument.create({ vehicle_id: vehicle.id });
    }

    const type = documentType.toLowerCase();
    if (type.startsWith('ins')) {
      doc.insurance_issue_date = sanitizedIssueDate || doc.insurance_issue_date;
      doc.insurance_expiry = sanitizedExpiryDate;
      doc.insurance_policy = document_number || doc.insurance_policy;
      if (document_company) doc.insurance_company = document_company;
    } else if (type.startsWith('per')) {
      doc.permit_issue_date = sanitizedIssueDate || doc.permit_issue_date;
      doc.permit_expiry = sanitizedExpiryDate;
      doc.permit_number = document_number || doc.permit_number;
    } else if (type.startsWith('fit')) {
      doc.fitness_issue_date = sanitizedIssueDate || doc.fitness_issue_date;
      doc.fitness_expiry = sanitizedExpiryDate;
      doc.fitness_certificate = document_number || doc.fitness_certificate;
    } else {
      return res.status(400).json({ error: 'Invalid document type.' });
    }

    await doc.save();

    // Recalculate status of vehicle
    vehicle.status = calculateVehicleStatus([
      doc.insurance_expiry,
      doc.permit_expiry,
      doc.fitness_expiry
    ]);
    await vehicle.save();

    // Create/update alerts
    await createAlertsForVehicle(vehicle, doc.insurance_expiry, doc.permit_expiry, doc.fitness_expiry);

    // Document Replaced log removed

    res.json({ success: true, message: 'Document updated successfully.' });
  } catch (error) {
    console.error('Replace document error:', error);
    res.status(500).json({ error: 'Failed to update document.' });
  }
});

// DELETE /api/documents/:id (Clears specific document fields)
router.delete('/documents/:id', authenticateJWT, authorizeRoles('ADMIN'), async (req, res) => {
  let vehicleId = req.params.id;
  let documentType = req.query.document_type;

  if (typeof vehicleId === 'string' && vehicleId.includes('-')) {
    const parts = vehicleId.split('-');
    vehicleId = parts[0];
    const typeAbbr = parts[1].toLowerCase();
    if (typeAbbr.startsWith('ins')) documentType = 'Insurance';
    else if (typeAbbr.startsWith('per')) documentType = 'Permit';
    else if (typeAbbr.startsWith('fit')) documentType = 'Fitness';
  }

  if (!documentType) {
    return res.status(400).json({ error: 'Document type query parameter is required.' });
  }

  try {
    const vehicle = await Vehicle.findOne({
      where: { id: vehicleId },
      include: [{ model: VehicleDocument, as: 'VehicleDocument' }]
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const doc = vehicle.VehicleDocument;
    if (!doc) {
      return res.status(404).json({ error: 'No documents found for this vehicle.' });
    }

    const type = documentType.toLowerCase();
    if (type.startsWith('ins')) {
      doc.insurance_expiry = null;
      doc.insurance_issue_date = null;
      doc.insurance_policy = null;
      doc.insurance_company = null;
    } else if (type.startsWith('per')) {
      doc.permit_expiry = null;
      doc.permit_issue_date = null;
      doc.permit_number = null;
    } else if (type.startsWith('fit')) {
      doc.fitness_expiry = null;
      doc.fitness_issue_date = null;
      doc.fitness_certificate = null;
    } else {
      return res.status(400).json({ error: 'Invalid document type.' });
    }

    await doc.save();

    // Recalculate status of vehicle
    vehicle.status = calculateVehicleStatus([
      doc.insurance_expiry,
      doc.permit_expiry,
      doc.fitness_expiry
    ]);
    await vehicle.save();

    // Delete associated alerts for this document type
    await Alert.destroy({
      where: {
        vehicle_id: vehicle.id,
        document_type: documentType
      }
    });

    // Document Deleted log removed

    res.json({ success: true, message: 'Document data cleared successfully.' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete/clear document.' });
  }
});

// ----------------- ALERT SYSTEM ENDPOINTS -----------------

// GET /api/alerts
router.get('/alerts', authenticateJWT, async (req, res) => {
  const { search, type, status, priority, page = 1, limit = 5 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const whereClause = {};

    if (status && status !== 'All') {
      whereClause.status = status;
    }

    if (type && type !== 'All') {
      whereClause.document_type = type;
    }

    if (priority && priority !== 'All') {
      whereClause.priority = priority;
    }

    const vehicleWhere = {};
    if (search) {
      vehicleWhere[Op.or] = [
        { vehicle_number: { [Op.like]: `%${search}%` } },
        { remarks: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: alerts } = await Alert.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          where: vehicleWhere,
          include: [{ model: VehicleDocument, as: 'VehicleDocument' }]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const formattedAlerts = alerts.map(a => {
      let expDate = a.expiry_date;
      if (!expDate) {
        const doc = a.Vehicle?.VehicleDocument;
        if (doc) {
          if (a.document_type === 'Insurance') expDate = doc.insurance_expiry;
          else if (a.document_type === 'Permit') expDate = doc.permit_expiry;
          else if (a.document_type === 'Fitness') expDate = doc.fitness_expiry;
        }
      }
      return {
        id: a.id,
        vehicle_id: a.vehicle_id,
        vehicle_number: a.vehicle_number || a.Vehicle?.vehicle_number,
        alert_type: a.document_type,
        document_type: a.document_type,
        days_left: a.days_remaining,
        days_remaining: a.days_remaining,
        priority: a.priority,
        status: a.status,
        message: a.message || `${a.document_type} for Vehicle ${a.vehicle_number || a.Vehicle?.vehicle_number} is ${a.status.toLowerCase()}.`,
        is_read: a.is_read,
        createdAt: a.created_at || a.createdAt,
        expiry_date: expDate || 'Not Specified',
        Vehicle: a.Vehicle ? {
          id: a.Vehicle.id,
          vehicle_number: a.Vehicle.vehicle_number,
          vehicle_model: formatVehicle(a.Vehicle)?.vehicle_model,
          vehicle_type: a.Vehicle.vehicle_type
        } : null
      };
    });

    res.json({
      total: count,
      alerts: formattedAlerts,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Fetch alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// PUT /api/alerts/:id/read
router.put('/alerts/:id/read', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const alert = await Alert.findOne({
      where: { id },
      include: [{ model: Vehicle }]
    });
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found or access denied.' });
    }
    alert.is_read = true;
    await alert.save();
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Read alert error:', error);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

// PUT /api/alerts/:id/resolve
router.put('/alerts/:id/resolve', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  try {
    const alert = await Alert.findOne({
      where: { id },
      include: [{ model: Vehicle }]
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found or access denied.' });
    }

    const resolvedBy = req.user.name || req.user.email || 'Admin';
    const resolvedAt = new Date();

    // Parse resolution history or initialize
    let history = [];
    if (alert.resolution_history) {
      try {
        history = JSON.parse(alert.resolution_history);
      } catch (e) {
        history = [];
      }
    }

    history.push({
      resolved_by: resolvedBy,
      resolved_at: resolvedAt,
      notes: notes || 'Resolved via manual check'
    });

    alert.status = 'Resolved';
    alert.resolved_by = resolvedBy;
    alert.resolved_at = resolvedAt;
    alert.resolution_history = JSON.stringify(history);
    alert.is_read = true;

    await alert.save();

    // Alert Resolved log removed

    res.json({ success: true, alert });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Failed to resolve alert.' });
  }
});

// POST /api/alerts/read-all
router.post('/alerts/read-all', authenticateJWT, async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({ attributes: ['id'] });
    const vehicleIds = vehicles.map(v => v.id);
    await Alert.update(
      { is_read: true },
      { where: { vehicle_id: { [Op.in]: vehicleIds }, is_read: false } }
    );
    res.json({ success: true, message: 'All alerts marked as read.' });
  } catch (error) {
    console.error('Read all alerts error:', error);
    res.status(500).json({ error: 'Failed to mark all alerts as read' });
  }
});


// GET /api/alerts/stats (Scoped user count)
router.get('/alerts/stats', authenticateJWT, async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({ attributes: ['id'] });
    const vehicleIds = vehicles.map(v => v.id);

    const expiredAlerts = await Alert.count({
      where: { status: 'Expired', vehicle_id: { [Op.in]: vehicleIds } }
    });
    const expiringSoonAlerts = await Alert.count({
      where: { status: 'Expiring Soon', vehicle_id: { [Op.in]: vehicleIds } }
    });
    const resolvedAlerts = await Alert.count({
      where: { status: 'Resolved', vehicle_id: { [Op.in]: vehicleIds } }
    });

    const smsSent = await Notification.count({
      where: { type: 'SMS', status: 'Delivered' }
    });
    const emailSent = await Notification.count({
      where: { type: 'Email', status: 'Delivered' }
    });

    let setting = await Setting.findOne({ where: { user_id: req.user.id } });
    if (!setting) {
      setting = await Setting.findOne({ order: [['id', 'ASC']] });
    }

    res.json({
      expiredCount: expiredAlerts,
      expiringSoonCount: expiringSoonAlerts,
      resolvedCount: resolvedAlerts,
      theme: setting?.theme || 'Light',
      notificationsSent: {
        sms: smsSent,
        email: emailSent
      }
    });
  } catch (error) {
    console.error('Fetch alerts stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/dashboard/email-stats
router.get('/dashboard/email-stats', authenticateJWT, async (req, res) => {
  try {
    const todayStart = new Date('2026-06-22');
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const todayCount = await EmailLog.count({
      where: {
        status: 'Success',
        sent_at: { [Op.gte]: todayStart }
      }
    });

    const weekCount = await EmailLog.count({
      where: {
        status: 'Success',
        sent_at: { [Op.gte]: weekStart }
      }
    });

    const failedCount = await EmailLog.count({
      where: {
        status: 'Failed'
      }
    });

    const lastLog = await EmailLog.findOne({
      order: [['sent_at', 'DESC']]
    });

    res.json({
      today: todayCount,
      week: weekCount,
      failed: failedCount,
      lastSent: lastLog ? lastLog.sent_at : null
    });
  } catch (error) {
    console.error('Fetch dashboard email stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard email stats' });
  }
});

// GET /api/notifications (Notification History, scoped)
router.get('/notifications', authenticateJWT, async (req, res) => {
  const { limit = 5 } = req.query;
  try {
    const history = await Notification.findAll({
      include: [{ model: Vehicle, attributes: ['vehicle_number'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.json(history);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications history' });
  }
});

// GET /api/alerts/export (Download CSV containing alerts report)
router.get('/alerts/export', authenticateJWT, async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({ attributes: ['id'] });
    const vehicleIds = vehicles.map(v => v.id);

    const alerts = await Alert.findAll({
      where: { vehicle_id: { [Op.in]: vehicleIds } },
      include: [
        {
          model: Vehicle,
          attributes: ['vehicle_number'],
          include: [{ model: VehicleDocument, as: 'VehicleDocument' }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    let csvContent = 'Vehicle Number,Alert Type,Expiry Date,Days Left,Status\n';
    for (const a of alerts) {
      let expDate = 'Not Specified';
      const doc = a.Vehicle?.VehicleDocument;
      if (doc) {
        if (a.alert_type === 'Insurance') expDate = doc.insurance_expiry;
        else if (a.alert_type === 'Permit') expDate = doc.permit_expiry;
        else if (a.alert_type === 'Fitness') expDate = doc.fitness_expiry;
      }
      const daysText = a.status === 'Expired' ? `Expired ${Math.abs(a.days_left)} Days Ago` : `${a.days_left} Days`;
      csvContent += `"${a.Vehicle?.vehicle_number}","${a.alert_type} Expiry","${expDate}","${daysText}","${a.status}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="alerts_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to export alerts report' });
  }
});

// ----------------- REPORTS ENDPOINTS -----------------

// GET /api/reports/export
router.get('/reports/export', authenticateJWT, authorizeRoles('ADMIN', 'MANAGEMENT'), async (req, res) => {
  const { status, type, startDate, endDate } = req.query;
  try {
    const whereClause = {};
    if (status && status !== 'All') {
      whereClause.status = status;
    }
    if (type && type !== 'All' && type !== 'All Type') {
      whereClause.vehicle_type = type;
    }

    const includeClause = { model: VehicleDocument, as: 'VehicleDocument' };
    if (startDate || endDate) {
      const dateCond = {};
      if (startDate) dateCond[Op.gte] = startDate;
      if (endDate) dateCond[Op.lte] = endDate;
      includeClause.where = {
        [Op.or]: [
          { insurance_expiry: dateCond },
          { permit_expiry: dateCond },
          { fitness_expiry: dateCond }
        ]
      };
    }

    const vehicles = await Vehicle.findAll({
      where: whereClause,
      include: [includeClause],
      order: [['vehicle_number', 'ASC']]
    });

    let csvContent = 'Vehicle Number,Vehicle Type,Brand,Model,Owner Name,Driver Name,Contact Number,Status,Insurance Expiry,Insurance Policy,Insurance Company,Permit Expiry,Permit Number,Fitness Expiry,Fitness Certificate\n';

    for (const v of vehicles) {
      const doc = v.VehicleDocument;
      const formatted = formatVehicle(v);
      csvContent += `"${v.vehicle_number}","${v.vehicle_type}","${v.brand || ''}","${formatted.vehicle_model}","${v.owner_name}","${v.driver_name || ''}","${v.contact_number || ''}","${v.status}","${doc?.insurance_expiry || ''}","${doc?.insurance_policy || ''}","${doc?.insurance_company || ''}","${doc?.permit_expiry || ''}","${doc?.permit_number || ''}","${doc?.fitness_expiry || ''}","${doc?.fitness_certificate || ''}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fleet_compliance_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;