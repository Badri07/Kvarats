export enum NotificationType {
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_UPDATED = 'appointment_updated',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  PAYMENT_RECEIVED = 'payment_received',
  INVOICE_CREATED = 'invoice_created',
  INSURANCE_CLAIM_UPDATE = 'insurance_claim_update',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  WELCOME = 'welcome'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface InAppNotification {
  id: string;
  recipientId: string; // User ID who should receive the notification
  senderId?: string; // User ID who sent the notification
  clientId: string; // For multi-tenant isolation
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string; // URL to navigate when notification is clicked
  actionText?: string; // Text for action button
  metadata?: { [key: string]: any }; // Additional data (appointment ID, patient ID, etc.)
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date; // Optional expiration date
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  messageTemplate: string; // Template with placeholders like {{patientName}}
  actionText?: string;
  actionUrlTemplate?: string;
  priority: NotificationPriority;
  expiresAfterDays?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  appointmentReminders: boolean;
  paymentNotifications: boolean;
  systemAnnouncements: boolean;
  marketingEmails: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationRequest {
  recipientId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: { [key: string]: any };
  priority?: NotificationPriority;
  expiresAt?: Date;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
  notificationsByType: { [key in NotificationType]: number };
  notificationsByPriority: { [key in NotificationPriority]: number };
}