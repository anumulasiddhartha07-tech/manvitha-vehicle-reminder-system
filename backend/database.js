import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
let sequelize;

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

if (dbHost && dbUser && dbName) {
  // Use MySQL if environment variables are provided
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  console.log('Database initialized with MySQL dialect.');
} else {
  // Fallback to SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
  });
  console.log('Database initialized with SQLite dialect.');
}

// Model definitions

// 1. User Model
export const User = sequelize.define('User', {
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'full_name'
  },
  name: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.full_name;
    },
    set(value) {
      this.setDataValue('full_name', value);
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  password: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.password_hash;
    },
    set(value) {
      this.setDataValue('password_hash', value);
    }
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'email_verified'
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ADMIN'
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    allowNull: false,
    defaultValue: 'Active'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reset_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reset_token_expires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

// Helper for password comparison
User.prototype.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password_hash) return false;
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// 2. Vehicle Model
export const Vehicle = sequelize.define('Vehicle', {
  vehicle_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  vehicle_type: {
    type: DataTypes.ENUM('SUV', 'Traveller', 'Bus', 'Car', 'Van'),
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true
  },
  owner_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  driver_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contact_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Expiring Soon', 'Expired'),
    allowNull: false,
    defaultValue: 'Active'
  },
  registration_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'registration_date'
  }
}, {
  underscored: true,
  tableName: 'vehicles',
  updatedAt: false
});

// 3. VehicleDocument Model (replaces Document)
export const VehicleDocument = sequelize.define('VehicleDocument', {
  insurance_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  insurance_policy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  insurance_company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  permit_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  permit_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fitness_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fitness_certificate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  insurance_issue_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'insurance_issue_date'
  },
  permit_issue_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'permit_issue_date'
  },
  fitness_issue_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'fitness_issue_date'
  }
}, {
  underscored: true,
  tableName: 'vehicle_documents',
  timestamps: false
});

// Alias to prevent import crashes during refactoring
export const Document = VehicleDocument;

// 4. Alert Model
export const Alert = sequelize.define('Alert', {
  vehicle_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'vehicle_id'
  },
  vehicle_number: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'vehicle_number'
  },
  document_type: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'document_type'
  },
  alert_type: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.document_type;
    },
    set(value) {
      this.setDataValue('document_type', value);
    }
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'expiry_date'
  },
  days_remaining: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'days_remaining'
  },
  days_left: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.days_remaining;
    },
    set(value) {
      this.setDataValue('days_remaining', value);
    }
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    allowNull: false,
    defaultValue: 'Low'
  },
  status: {
    type: DataTypes.ENUM('New', 'Read', 'Resolved', 'Expiring Soon', 'Expired'),
    allowNull: false,
    defaultValue: 'New'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  resolved_by: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'resolved_by'
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resolved_at'
  },
  resolution_history: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'resolution_history'
  }
}, {
  underscored: true,
  tableName: 'alerts',
  updatedAt: false
});

// 5. Notification Model
export const Notification = sequelize.define('Notification', {
  type: {
    type: DataTypes.ENUM('SMS', 'Email'),
    allowNull: false,
    field: 'notification_type'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Delivered', 'Pending', 'Failed'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  underscored: true,
  tableName: 'notifications'
});

// 6. Setting Model
export const Setting = sequelize.define('Setting', {
  company_name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Manivtha Tours & Travels'
  },
  company_location: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Hyderabad, Telangana, India'
  },
  company_contact: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '+91 98765 43210'
  },
  insurance_alerts_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  permit_alerts_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  fitness_alerts_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  reminder_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30
  },
  theme: {
    type: DataTypes.ENUM('Light', 'Dark'),
    allowNull: false,
    defaultValue: 'Light'
  },
  email_sender_name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Manivtha Tours & Travels',
    field: 'email_sender_name'
  },
  email_sender_email: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'alerts@manivtha.com',
    field: 'email_sender_email'
  },
  email_provider: {
    type: DataTypes.ENUM('Resend', 'EmailJS'),
    allowNull: false,
    defaultValue: 'Resend',
    field: 'email_provider'
  },
  email_reminder_schedule: {
    type: DataTypes.ENUM('Daily', 'Weekly'),
    allowNull: false,
    defaultValue: 'Daily',
    field: 'email_reminder_schedule'
  },
  email_status: {
    type: DataTypes.ENUM('Connected', 'Disconnected'),
    allowNull: false,
    defaultValue: 'Connected',
    field: 'email_status'
  },
  email_alerts_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'email_alerts_enabled'
  }
}, {
  underscored: true,
  tableName: 'settings'
});



// Associations
Vehicle.hasOne(VehicleDocument, { foreignKey: 'vehicle_id', as: 'VehicleDocument', onDelete: 'CASCADE' });
VehicleDocument.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

Vehicle.hasMany(Alert, { foreignKey: 'vehicle_id', as: 'Alerts', onDelete: 'CASCADE' });
Alert.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

User.hasMany(Vehicle, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Vehicle.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Notification, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

Vehicle.hasMany(Notification, { foreignKey: 'vehicle_id', onDelete: 'CASCADE' });
Notification.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

Alert.hasMany(Notification, { foreignKey: 'alert_id', onDelete: 'CASCADE' });
Notification.belongsTo(Alert, { foreignKey: 'alert_id' });

User.hasOne(Setting, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Setting.belongsTo(User, { foreignKey: 'user_id' });





// Initial Database Seeder
export const seedDatabase = async () => {
  try {
    // 1. Create Default Admin User
    const adminCount = await User.count({ where: { email: 'admin@manivtha.com' } });
    if (adminCount > 0) return; // Database already seeded

    const admin = await User.create({
      full_name: 'Admin',
      email: 'admin@manivtha.com',
      password: 'adminpassword',
      username: 'admin',
      email_verified: true,
      role: 'ADMIN'
    });

    // Create settings for admin
    await Setting.create({
      user_id: admin.id,
      company_name: 'Manivtha Tours & Travels',
      company_location: 'Hyderabad, Telangana, India',
      company_contact: '+91 98765 43210',
      insurance_alerts_enabled: true,
      permit_alerts_enabled: true,
      fitness_alerts_enabled: true,
      reminder_days: 30,
      theme: 'Light'
    });

    // 2. Create Staff and Management Users
    await User.create({
      full_name: 'Staff Member',
      email: 'staff@manivtha.com',
      password: 'staffpassword',
      username: 'staff',
      email_verified: true,
      role: 'STAFF'
    });

    await User.create({
      full_name: 'Manager',
      email: 'manager@manivtha.com',
      password: 'managerpassword',
      username: 'manager',
      email_verified: true,
      role: 'MANAGEMENT'
    });

    console.log('Database successfully seeded with default users!');
  } catch (error) {
    console.error('Seeding database failed:', error);
  }
};

export { sequelize };
