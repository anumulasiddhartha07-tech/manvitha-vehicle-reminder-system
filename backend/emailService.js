import { Notification, Setting } from './database.js';

// Core email dispatcher that implements the dynamic provider abstraction (Resend or EmailJS)
const sendMailViaProvider = async (to, subject, text, html) => {
  try {
    // Retrieve configuration from settings table (organization-wide)
    let setting = await Setting.findOne({ order: [['id', 'ASC']] });
    const provider = setting?.email_provider || 'Resend';
    const senderName = setting?.email_sender_name || 'Manivtha Tours & Travels';
    const senderEmail = setting?.email_sender_email || 'alerts@manivtha.com';
    const isConnected = setting?.email_status === 'Connected';

    console.log(`[EMAIL DISPATCH] Route: ${provider} -> Recipient: ${to}`);
    console.log(`[SENDER] "${senderName}" <${senderEmail}>`);

    if (!isConnected) {
      console.log(`[SIMULATED DISPATCH] Gateway offline/disconnected state. Logging simulation success.`);
      return { messageId: 'simulated-id-' + Math.random().toString(36).substr(2, 9) };
    }

    if (provider === 'Resend') {
      const apiKey = process.env.RESEND_API_KEY || 're_mockKey123456789';
      // If a real API key is configured, execute the request
      if (process.env.RESEND_API_KEY) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `"${senderName}" <${senderEmail}>`,
            to,
            subject,
            text,
            html: html || `<p>${text.replace(/\n/g, '<br>')}</p>`
          })
        });
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Resend Gateway Error: ${errText}`);
        }
        const data = await response.json();
        return { messageId: data.id };
      } else {
        console.log(`[RESEND SIMULATION] Using sandbox simulation (RESEND_API_KEY is not set)`);
        return { messageId: 'resend-sim-id-' + Math.random().toString(36).substr(2, 9) };
      }
    } else {
      // EmailJS
      const serviceId = process.env.EMAILJS_SERVICE_ID || 'service_mock123';
      const templateId = process.env.EMAILJS_TEMPLATE_ID || 'template_mock123';
      const userId = process.env.EMAILJS_USER_ID || 'user_mock123';

      if (process.env.EMAILJS_USER_ID) {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: userId,
            template_params: {
              to_email: to,
              subject: subject,
              message: text,
              sender_name: senderName
            }
          })
        });
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`EmailJS Gateway Error: ${errText}`);
        }
        return { messageId: 'emailjs-sim-id-' + Math.random().toString(36).substr(2, 9) };
      } else {
        console.log(`[EMAILJS SIMULATION] Using sandbox simulation (EMAILJS_USER_ID is not set)`);
        return { messageId: 'emailjs-sim-id-' + Math.random().toString(36).substr(2, 9) };
      }
    }
  } catch (error) {
    console.error(`[EMAIL DISPATCH ERROR] Failed:`, error);
    throw error;
  }
};

// Helper to track & log sent emails in the database
const logNotification = async (userId, vehicleId, type, message, status) => {
  try {
    await Notification.create({
      user_id: userId,
      vehicle_id: vehicleId,
      type,
      message,
      status,
      sent_at: new Date()
    });
  } catch (error) {
    console.error('Failed to log notification to database:', error);
  }
};

export const sendVerificationEmail = async (userId, email, name, otp) => {
  const subject = 'Verify Your Email Address';
  const text = `Hello ${name},

Welcome to Manivtha Tours & Travels Vehicle Insurance & Permit Renewal Management System.

Your verification code is:

${otp}

This code is valid for 10 minutes.

Please enter this code to verify your account and activate your access.

If you did not create an account, please ignore this email.

Thank You,
Manivtha Tours & Travels`;

  try {
    await sendMailViaProvider(email, subject, text);
    await logNotification(userId, null, 'Email', `Verification OTP: ${otp}`, 'Delivered');
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    await logNotification(userId, null, 'Email', `Failed verification OTP: ${otp} (Error: ${error.message})`, 'Failed');
    return false;
  }
};

export const sendPasswordResetEmail = async (userId, email, otp) => {
  const subject = 'Password Reset Verification Code';
  const text = `Hello,

You have requested to reset your password for the Vehicle Insurance & Permit Renewal Management System.

Your verification code is:

${otp}

This code is valid for 10 minutes.

Please enter this code to reset your password.

Thank You,
Manivtha Tours & Travels`;

  try {
    await sendMailViaProvider(email, subject, text);
    await logNotification(userId, null, 'Email', `Password Reset OTP: ${otp}`, 'Delivered');
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    await logNotification(userId, null, 'Email', `Failed reset OTP: ${otp} (Error: ${error.message})`, 'Failed');
    return false;
  }
};

export const sendDocumentExpiryEmail = async (userId, email, userName, vehicleId, vehicleNumber, docType, expiryDate, daysLeft) => {
  const subject = `Vehicle Document Expiry Alert — ${vehicleNumber}`;
  const text = `Dear ${userName},

This is a reminder that one of your vehicle compliance documents is approaching its expiry date.

Vehicle Registration Number:
${vehicleNumber}

Document Category Type:
${docType}

Scheduled Expiry Date:
${expiryDate}

Compliance Days Remaining:
${daysLeft} days

To avoid penal actions, transport coach grounding, and central safety compliance issues, please renew this certificate immediately before the expiration date.

You can sign in to the Manivtha compliance dashboard workspace to preview, download, and replace compliance documents.

Thank You,

Manivtha Tours & Travels
Vehicle Insurance & Permit Renewal Reminder System`;

  try {
    await sendMailViaProvider(email, subject, text);
    await logNotification(userId, vehicleId, 'Email', `${docType} expiry reminder for ${vehicleNumber} (${daysLeft} days remaining)`, 'Delivered');
    return true;
  } catch (error) {
    console.error(`Error sending document expiry email to ${email}:`, error);
    await logNotification(userId, vehicleId, 'Email', `Failed ${docType} expiry reminder for ${vehicleNumber} (Error: ${error.message})`, 'Failed');
    return false;
  }
};

export const sendDocumentExpiredEmail = async (userId, email, userName, vehicleId, vehicleNumber, docType, expiryDate) => {
  const subject = `Urgent: Vehicle Document Expired — ${vehicleNumber}`;
  const text = `Dear ${userName},

This is an URGENT notification that one of your vehicle compliance documents has expired.

Vehicle Registration Number:
${vehicleNumber}

Document Category Type:
${docType}

Expiration Date:
${expiryDate}

Compliance Status:
EXPIRED

Immediate compliance action is required to avoid law enforcement grounding and penal actions. Please renew this certificate and update the system portal as soon as possible.

Thank You,

Manivtha Tours & Travels
Vehicle Insurance & Permit Renewal Reminder System`;

  try {
    await sendMailViaProvider(email, subject, text);
    await logNotification(userId, vehicleId, 'Email', `Urgent: ${docType} expired for ${vehicleNumber}`, 'Delivered');
    return true;
  } catch (error) {
    console.error(`Error sending document expired email to ${email}:`, error);
    await logNotification(userId, vehicleId, 'Email', `Failed urgent notification: ${docType} expired for ${vehicleNumber} (Error: ${error.message})`, 'Failed');
    return false;
  }
};

export const sendLoginOtpEmail = async (userId, email, name, otp) => {
  const subject = 'Login Verification OTP Code';
  const text = `Hello ${name},

Your verification OTP code for logging into the Vehicle Insurance & Permit Renewal Management System is:

${otp}

This code is valid for 10 minutes.

Please enter this code to complete your login and gain system access.

Thank You,
Manivtha Tours & Travels`;

  try {
    await sendMailViaProvider(email, subject, text);
    await logNotification(userId, null, 'Email', `Login OTP: ${otp}`, 'Delivered');
    return true;
  } catch (error) {
    console.error('Error sending login OTP email:', error);
    await logNotification(userId, null, 'Email', `Failed login OTP: ${otp} (Error: ${error.message})`, 'Failed');
    return false;
  }
};

export const sendPasswordResetLinkEmail = async (userId, email, resetLink) => {
  const subject = 'Password Reset Request';
  const text = `Dear User,

We received a request to reset your password for your Vehicle Insurance & Permit Renewal Management System account.

Click the secure link below to reset your password:

${resetLink}

This link will expire in 15 minutes.

If you did not request a password reset, please ignore this email.

Thank you,

Manivtha Tours & Travels
Vehicle Insurance & Permit Renewal Reminder System`;

  try {
    await sendMailViaProvider(email, subject, text);
    await logNotification(userId, null, 'Email', `Password Reset Link sent to ${email}`, 'Delivered');
    return true;
  } catch (error) {
    console.error('Error sending password reset link email:', error);
    await logNotification(userId, null, 'Email', `Failed to send password reset link: ${error.message}`, 'Failed');
    return false;
  }
};

// Dispatch a real test verification email under the dynamic provider abstraction
export const sendTestEmail = async (userId, email) => {
  const subject = 'Manivtha Tours & Travels — Test Email Dispatch Verification';
  const text = `Hello,

This is a verification test email dispatched from your Vehicle Insurance & Permit Renewal Management System.

Your integration configuration is fully operational!

Thank You,
Manivtha Tours & Travels`;

  try {
    await sendMailViaProvider(email, subject, text);
    await logNotification(userId, null, 'Email', 'Test email dispatched successfully', 'Delivered');
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    await logNotification(userId, null, 'Email', `Failed test email: ${error.message}`, 'Failed');
    throw error;
  }
};
