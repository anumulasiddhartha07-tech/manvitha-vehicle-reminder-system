import { Vehicle, VehicleDocument, User, Setting, Alert, Notification } from './database.js';
import { sendDocumentExpiryEmail, sendDocumentExpiredEmail } from './emailService.js';
import { Op } from 'sequelize';

const getToday = () => {
  const now = new Date();
  if (now.getFullYear() === 2026 && now.getMonth() === 5) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return new Date('2026-06-22');
};

export const runExpiryCheck = async () => {
  console.log('[EXPIRY MONITOR] Starting scan of vehicle documents...');
  try {
    const today = getToday();
    
    // Find all vehicles with their documents and user settings
    const vehicles = await Vehicle.findAll({
      include: [
        { model: VehicleDocument, as: 'VehicleDocument' },
        { 
          model: User,
          include: [{ model: Setting }]
        }
      ]
    });

    for (const vehicle of vehicles) {
      const user = vehicle.User;
      if (!user) continue;

      const settings = user.Setting || {
        insurance_alerts_enabled: true,
        permit_alerts_enabled: true,
        fitness_alerts_enabled: true,
        reminder_days: 30
      };

      const doc = vehicle.VehicleDocument;
      if (!doc) continue;

      const docTypes = [
        { name: 'Insurance', expiry: doc.insurance_expiry, enabled: settings.insurance_alerts_enabled },
        { name: 'Permit', expiry: doc.permit_expiry, enabled: settings.permit_alerts_enabled },
        { name: 'Fitness', expiry: doc.fitness_expiry, enabled: settings.fitness_alerts_enabled }
      ];

      // Track whether vehicle status needs to change
      const allDaysLeft = [];

      for (const d of docTypes) {
        if (!d.expiry) continue;

        const expDate = new Date(d.expiry);
        const diffTime = expDate - today;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        allDaysLeft.push(daysLeft);

        // If doc alert is disabled, skip alert creation/notification
        if (!d.enabled) continue;

        let status = 'Active';
        let priority = 'Low';
        let message = '';

        if (daysLeft <= 0) {
          status = 'Expired';
          priority = 'High';
          message = `${d.name} for Vehicle ${vehicle.vehicle_number} has expired on ${d.expiry} (${Math.abs(daysLeft)} days ago).`;
        } else if (daysLeft <= 30) {
          status = 'Expiring Soon';
          priority = 'Medium';
          message = `${d.name} for Vehicle ${vehicle.vehicle_number} is expiring soon on ${d.expiry} (${daysLeft} days remaining).`;
        } else {
          status = 'Active';
        }

        if (status === 'Expired' || status === 'Expiring Soon') {
          // Check for duplicate alerts generated on the SAME day
          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(today);
          endOfDay.setHours(23, 59, 59, 999);

          const existingAlert = await Alert.findOne({
            where: {
              vehicle_id: vehicle.id,
              document_type: d.name,
              status: status,
              createdAt: {
                [Op.between]: [startOfDay, endOfDay]
              }
            }
          });

          if (!existingAlert) {
            // Create the alert in database
            const alert = await Alert.create({
              vehicle_id: vehicle.id,
              vehicle_number: vehicle.vehicle_number,
              document_type: d.name,
              expiry_date: d.expiry,
              days_remaining: daysLeft,
              priority: priority,
              status: status,
              message: message,
              is_read: false
            });

            console.log(`[EXPIRY MONITOR] Generated new ${status} alert for vehicle ${vehicle.vehicle_number}`);



            // Send Email Notifications
            // Check if notification already sent today to prevent duplicates
            const existingNotification = await Notification.findOne({
              where: {
                vehicle_id: vehicle.id,
                alert_id: alert.id,
                type: 'Email',
                createdAt: {
                  [Op.between]: [startOfDay, endOfDay]
                }
              }
            });

            if (!existingNotification) {
              console.log(`[EXPIRY MONITOR] Sending email to ${user.email} for vehicle ${vehicle.vehicle_number} (${d.name} is ${status})`);
              
              let emailSentSuccessfully = false;
              let emailError = null;

              try {
                if (status === 'Expired') {
                  await sendDocumentExpiredEmail(
                    user.id,
                    user.email,
                    user.full_name,
                    vehicle.id,
                    vehicle.vehicle_number,
                    d.name,
                    d.expiry
                  );
                } else {
                  await sendDocumentExpiryEmail(
                    user.id,
                    user.email,
                    user.full_name,
                    vehicle.id,
                    vehicle.vehicle_number,
                    d.name,
                    d.expiry,
                    daysLeft
                  );
                }
                emailSentSuccessfully = true;
              } catch (err) {
                emailError = err;
                console.error('[EXPIRY MONITOR] Email sending failed:', err);
              }

              // Create notification record
              await Notification.create({
                vehicle_id: vehicle.id,
                alert_id: alert.id,
                type: 'Email',
                message: message,
                status: emailSentSuccessfully ? 'Delivered' : 'Failed',
                sent_at: emailSentSuccessfully ? new Date() : null,
                user_id: user.id
              });


            }
          } else {
            // Update the existing alert days left
            existingAlert.days_remaining = daysLeft;
            existingAlert.expiry_date = d.expiry;
            existingAlert.message = message;
            await existingAlert.save();
          }
        } else {
          // If status is Active (meaning valid now, e.g. after a renewal), check if there are unresolved active/expired alerts in DB to resolve them
          const unresolvedAlerts = await Alert.findAll({
            where: {
              vehicle_id: vehicle.id,
              document_type: d.name,
              status: { [Op.in]: ['Expiring Soon', 'Expired'] }
            }
          });

          for (const alert of unresolvedAlerts) {
            alert.status = 'Resolved';
            alert.days_remaining = daysLeft;
            alert.message = `${d.name} for Vehicle ${vehicle.vehicle_number} has been resolved/renewed.`;
            await alert.save();

            console.log(`[EXPIRY MONITOR] Resolved alert ID ${alert.id} for vehicle ${vehicle.vehicle_number}`);


          }
        }
      }

      // Auto calculate and update the vehicle general status
      let newVehicleStatus = 'Active';
      if (allDaysLeft.some(dl => dl <= 0)) {
        newVehicleStatus = 'Expired';
      } else if (allDaysLeft.some(dl => dl <= 30)) {
        newVehicleStatus = 'Expiring Soon';
      }

      if (vehicle.status !== newVehicleStatus) {
        vehicle.status = newVehicleStatus;
        await vehicle.save();
        console.log(`[EXPIRY MONITOR] Updated general status of vehicle ${vehicle.vehicle_number} to ${newVehicleStatus}`);
      }
    }
    console.log('[EXPIRY MONITOR] Scan completed.');
  } catch (error) {
    console.error('[EXPIRY MONITOR] Error during scan:', error);
  }
};

// Calculate ms until next 09:00 AM
const getMsUntil9AM = () => {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);
  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }
  return target - now;
};

// Start periodic checks
export const startScheduler = () => {
  // Run immediately on startup (within 5 seconds)
  setTimeout(runExpiryCheck, 5000);
  
  // Schedule to run at 9:00 AM daily
  const msTo9AM = getMsUntil9AM();
  console.log(`[EXPIRY MONITOR] Scheduled daily check at 09:00 AM in ${Math.round(msTo9AM / 1000 / 60)} minutes.`);
  setTimeout(() => {
    runExpiryCheck();
    // Re-schedule daily checks every 24 hours
    setInterval(runExpiryCheck, 24 * 60 * 60 * 1000);
  }, msTo9AM);
};
