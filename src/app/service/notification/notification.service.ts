import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  InAppNotification, 
  NotificationType, 
  NotificationPriority,
  CreateNotificationRequest,
  NotificationTemplate,
  NotificationStats
} from '../../models/notification.model';
import { Appointment } from '../../models/appointment.model';
import { Patient } from '../../models/patients.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class InAppNotificationService {
  private notifications = signal<InAppNotification[]>([
    // Sample notifications for demo
    {
      id: 'notif-1',
      recipientId: 'patient-lotus-1',
      senderId: 'therapist-lotus-1',
      clientId: 'client-lotus',
      type: NotificationType.APPOINTMENT_CREATED,
      priority: NotificationPriority.MEDIUM,
      title: 'New Appointment Scheduled',
      message: 'Your therapy session has been scheduled for January 20, 2025 at 10:00 AM with Dr. Michael Chen.',
      actionUrl: '/appointments',
      actionText: 'View Appointment',
      metadata: {
        appointmentId: 'apt-1',
        therapistName: 'Dr. Michael Chen',
        appointmentDate: '2025-01-20',
        appointmentTime: '10:00'
      },
      isRead: false,
      createdAt: new Date(2025, 0, 15, 14, 30),
      expiresAt: new Date(2025, 0, 25)
    },
    {
      id: 'notif-2',
      recipientId: 'patient-apollo-1',
      senderId: 'therapist-apollo-1',
      clientId: 'client-apollo',
      type: NotificationType.APPOINTMENT_REMINDER,
      priority: NotificationPriority.HIGH,
      title: 'Appointment Reminder',
      message: 'You have an upcoming therapy session tomorrow at 2:00 PM with Dr. James Wilson.',
      actionUrl: '/appointments',
      actionText: 'View Details',
      metadata: {
        appointmentId: 'apt-2',
        therapistName: 'Dr. James Wilson'
      },
      isRead: false,
      createdAt: new Date(2025, 0, 16, 9, 0),
      expiresAt: new Date(2025, 0, 18)
    },
    {
      id: 'notif-3',
      recipientId: 'patient-lotus-1',
      clientId: 'client-lotus',
      type: NotificationType.PAYMENT_RECEIVED,
      priority: NotificationPriority.LOW,
      title: 'Payment Confirmed',
      message: 'Your payment of $150.00 for therapy session has been successfully processed.',
      actionUrl: '/orders',
      actionText: 'View Receipt',
      metadata: {
        paymentAmount: 150.00,
        paymentMethod: 'Credit Card'
      },
      isRead: true,
      readAt: new Date(2025, 0, 14, 16, 45),
      createdAt: new Date(2025, 0, 14, 15, 30)
    }
  ]);

  private templates = signal<NotificationTemplate[]>([
    {
      id: 'template-1',
      type: NotificationType.APPOINTMENT_CREATED,
      title: 'New Appointment Scheduled',
      messageTemplate: 'Your {{appointmentType}} has been scheduled for {{appointmentDate}} at {{appointmentTime}} with {{therapistName}}.',
      actionText: 'View Appointment',
      actionUrlTemplate: '/appointments/{{appointmentId}}',
      priority: NotificationPriority.MEDIUM,
      expiresAfterDays: 7,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'template-2',
      type: NotificationType.APPOINTMENT_REMINDER,
      title: 'Appointment Reminder',
      messageTemplate: 'You have an upcoming {{appointmentType}} {{timeDescription}} at {{appointmentTime}} with {{therapistName}}.',
      actionText: 'View Details',
      actionUrlTemplate: '/appointments/{{appointmentId}}',
      priority: NotificationPriority.HIGH,
      expiresAfterDays: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'template-3',
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Confirmed',
      messageTemplate: 'Your payment of {{paymentAmount}} for {{serviceType}} has been successfully processed.',
      actionText: 'View Receipt',
      actionUrlTemplate: '/orders/{{orderId}}',
      priority: NotificationPriority.LOW,
      expiresAfterDays: 30,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // Get notifications for a specific user
  getNotificationsForUser(userId: string): Observable<InAppNotification[]> {
    const userNotifications = this.notifications().filter(notif => notif.recipientId === userId);
    return of(userNotifications).pipe(delay(300));
  }

  // Get unread notifications for a user
  getUnreadNotificationsForUser(userId: string): Observable<InAppNotification[]> {
    const unreadNotifications = this.notifications().filter(notif => 
      notif.recipientId === userId && !notif.isRead
    );
    return of(unreadNotifications).pipe(delay(300));
  }

  // Get notification count for a user
  getNotificationCount(userId: string): Observable<{ total: number; unread: number }> {
    const userNotifications = this.notifications().filter(notif => notif.recipientId === userId);
    const unreadCount = userNotifications.filter(notif => !notif.isRead).length;
    
    return of({
      total: userNotifications.length,
      unread: unreadCount
    }).pipe(delay(100));
  }

  // Create a new notification
  createNotification(request: CreateNotificationRequest): Observable<InAppNotification> {
    const newNotification: InAppNotification = {
      id: this.generateId(),
      recipientId: request.recipientId,
      senderId: request.senderId,
      clientId: this.getCurrentClientId(),
      type: request.type,
      priority: request.priority || NotificationPriority.MEDIUM,
      title: request.title,
      message: request.message,
      actionUrl: request.actionUrl,
      actionText: request.actionText,
      metadata: request.metadata,
      isRead: false,
      createdAt: new Date(),
      expiresAt: request.expiresAt
    };

    this.notifications.update(notifications => [newNotification, ...notifications]);
    return of(newNotification).pipe(delay(500));
  }

  // Create appointment notification using template
  createAppointmentNotification(
    appointment: Appointment, 
    patient: Patient, 
    therapistName: string,
    type: NotificationType = NotificationType.APPOINTMENT_CREATED
  ): Observable<InAppNotification> {
    const template = this.templates().find(t => t.type === type);
    
    if (!template) {
      return throwError(() => new Error('Notification template not found'));
    }

    const appointmentDate = appointment.startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const appointmentTime = appointment.startTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const timeDescription = this.getTimeDescription(appointment.startTime);
    const appointmentType = this.getAppointmentTypeLabel(appointment.type);

    // Replace template placeholders
    const message = template.messageTemplate
      .replace('{{appointmentType}}', appointmentType)
      .replace('{{appointmentDate}}', appointmentDate)
      .replace('{{appointmentTime}}', appointmentTime)
      .replace('{{therapistName}}', therapistName)
      .replace('{{timeDescription}}', timeDescription)
      .replace('{{patientName}}', `${patient.firstName} ${patient.lastName}`);

    const actionUrl = template.actionUrlTemplate?.replace('{{appointmentId}}', appointment.id);

    const expiresAt = template.expiresAfterDays 
      ? new Date(Date.now() + template.expiresAfterDays * 24 * 60 * 60 * 1000)
      : undefined;

    const request: CreateNotificationRequest = {
      recipientId: patient.id,
      senderId: appointment.therapistId,
      type: template.type,
      title: template.title,
      message: message,
      actionUrl: actionUrl,
      actionText: template.actionText,
      priority: template.priority,
      expiresAt: expiresAt,
      metadata: {
        appointmentId: appointment.id,
        patientId: patient.id,
        therapistId: appointment.therapistId,
        therapistName: therapistName,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        appointmentType: appointmentType
      }
    };

    return this.createNotification(request);
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<InAppNotification> {
    const notifications = this.notifications();
    const index = notifications.findIndex(notif => notif.id === notificationId);
    
    if (index === -1) {
      return throwError(() => new Error('Notification not found'));
    }

    const updatedNotification = {
      ...notifications[index],
      isRead: true,
      readAt: new Date()
    };

    this.notifications.update(notifications => {
      const newNotifications = [...notifications];
      newNotifications[index] = updatedNotification;
      return newNotifications;
    });

    return of(updatedNotification).pipe(delay(300));
  }

  public http = inject(HttpClient);

 markAllAsRead(): Observable<any> {
  const url = `${environment.apidev}/Notifications/MarkAllAsRead`;
  return this.http.put<any>(url, {}).pipe(
    map((response) => {
      console.log('All notifications marked as read:', response);
      return response; 
    }),
    catchError((error) => {
      console.error('Error marking all notifications as read:', error);
      return throwError(() => error);
    })
  );
}


  deleteNotification(notificationId: string): Observable<boolean> {
    this.notifications.update(notifications => 
      notifications.filter(notif => notif.id !== notificationId)
    );
    return of(true).pipe(delay(300));
  }

  // Delete all notifications for a user
  deleteAllForUser(userId: string): Observable<boolean> {
    this.notifications.update(notifications => 
      notifications.filter(notif => notif.recipientId !== userId)
    );
    return of(true).pipe(delay(500));
  }

  // Get notification statistics for a user
  getNotificationStats(userId: string): Observable<NotificationStats> {
    const userNotifications = this.notifications().filter(notif => notif.recipientId === userId);
    
    const stats: NotificationStats = {
      totalNotifications: userNotifications.length,
      unreadNotifications: userNotifications.filter(notif => !notif.isRead).length,
      readNotifications: userNotifications.filter(notif => notif.isRead).length,
      notificationsByType: {} as { [key in NotificationType]: number },
      notificationsByPriority: {} as { [key in NotificationPriority]: number }
    };

    // Count by type
    Object.values(NotificationType).forEach(type => {
      stats.notificationsByType[type] = userNotifications.filter(notif => notif.type === type).length;
    });

    // Count by priority
    Object.values(NotificationPriority).forEach(priority => {
      stats.notificationsByPriority[priority] = userNotifications.filter(notif => notif.priority === priority).length;
    });

    return of(stats).pipe(delay(300));
  }

  // Clean up expired notifications
  cleanupExpiredNotifications(): Observable<number> {
    const now = new Date();
    const beforeCount = this.notifications().length;
    
    this.notifications.update(notifications => 
      notifications.filter(notif => !notif.expiresAt || notif.expiresAt > now)
    );

    const afterCount = this.notifications().length;
    const deletedCount = beforeCount - afterCount;

    return of(deletedCount).pipe(delay(500));
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getCurrentClientId(): string {
    // This would typically come from AuthService
    return 'client-1'; // Default for demo
  }

  private getTimeDescription(appointmentDate: Date): string {
    const now = new Date();
    const diffTime = appointmentDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    if (diffDays === -1) return 'yesterday';
    if (diffDays > 1 && diffDays <= 7) return `in ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    
    return `on ${appointmentDate.toLocaleDateString()}`;
  }

  private getAppointmentTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'initial_consultation': 'initial consultation',
      'therapy_session': 'therapy session',
      'follow_up': 'follow-up session',
      'group_session': 'group session',
      'assessment': 'assessment',
      'telehealth': 'telehealth session',
      'emergency': 'emergency session'
    };
    return labels[type] || 'appointment';
  }

  // Template management
  getTemplates(): Observable<NotificationTemplate[]> {
    return of(this.templates()).pipe(delay(300));
  }

  getTemplateByType(type: NotificationType): Observable<NotificationTemplate | undefined> {
    return of(this.templates().find(template => template.type === type)).pipe(delay(300));
  }

  // Bulk operations
  createBulkNotifications(requests: CreateNotificationRequest[]): Observable<InAppNotification[]> {
    const newNotifications: InAppNotification[] = requests.map(request => ({
      id: this.generateId(),
      recipientId: request.recipientId,
      senderId: request.senderId,
      clientId: this.getCurrentClientId(),
      type: request.type,
      priority: request.priority || NotificationPriority.MEDIUM,
      title: request.title,
      message: request.message,
      actionUrl: request.actionUrl,
      actionText: request.actionText,
      metadata: request.metadata,
      isRead: false,
      createdAt: new Date(),
      expiresAt: request.expiresAt
    }));

    this.notifications.update(notifications => [...newNotifications, ...notifications]);
    return of(newNotifications).pipe(delay(500));
  }

  // Real-time notification polling (in a real app, this would use WebSockets)
  pollForNewNotifications(userId: string, lastCheckTime: Date): Observable<InAppNotification[]> {
    const newNotifications = this.notifications().filter(notif => 
      notif.recipientId === userId && 
      notif.createdAt > lastCheckTime
    );
    
    return of(newNotifications).pipe(delay(1000));
  }
}