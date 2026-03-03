import { Component, computed, HostListener, inject, Input, signal, OnInit, OnDestroy, Signal, ElementRef } from '@angular/core';
import { AuthService } from '../service/auth/auth.service';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { PopupService } from '../service/popup/popup-service';
import { InAppNotificationService } from '../service/notification/notification.service';
import { AdminService } from '../service/admin/admin.service';
import { HttpClient } from '@angular/common/http';
import { TosterService } from '../service/toaster/tostr.service';
import { DateFormat, DateFormatService } from '../service/global-date/date-format-service';

export interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  type?: string;
  actionUrl?: string;
  title?: string;
  priority?: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit, OnDestroy {
  openedAccordion: string | null = null;
  username: string = '';
  userRole: string = '';

  @Input() isDarkMode = false;

  isMobileView: boolean = false;
  isMobileSidebarOpen: boolean = false;
  isExpanded = signal(true);

  userImg: string = '/images/user-image-removebg-preview.png';
  logo: string = '/images/LogoLatest.png';
  titleImg: string = '/images/CalendarlyLogo.svg';
  toggleOpen: string = '/images/sidenav-open.png';
  toggleClose: string = '/images/sidenav-close.png';

  isSidebarCollapsed: boolean = false;

  // Notification related properties
  private notificationsSignal = signal<Notification[]>([]);
  isOpen = signal(false);
  isLoading = signal(false);
  lastCheckTime = signal(new Date());
  private pollInterval?: number;
  isshowNotification: boolean = true;
  
  // Modal state
  showAllNotificationsModal = signal(false);
  
  // Services
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(InAppNotificationService);
  public adminService = inject(AdminService);
  public http = inject(HttpClient);
  private _loader = inject(PopupService);

  constructor(
    private elementRef: ElementRef
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this._loader.show();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        setTimeout(() => {
          this._loader.hide();
        }, 300);
      }
    });

    this.isMobileView = window.innerWidth <= 768;
  }

  ngOnInit() {
    const storedDark = localStorage.getItem('darkMode');
    this.isDarkMode = storedDark === 'true';

    this.getUserDetails();
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
    this.loadNotifications();
    this.startPolling();
    this.getDateFormat();

    // Initialize date format modal selections
    this.selectedTimeFormat.set(this.currentTimeFormat());
    this.selectedFirstDayOfWeek.set(this.currentFirstDayOfWeek());
    this.selectedDateFormat.set(this.currentDateFormat());
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  menus = [
    {
      url: 'dashboard',
      name: 'Dashboard',
      icon: 'fas fa-tachometer-alt'
    },
    {
      url: 'therapists',
      name: 'Therapist',
      icon: 'fas fa-user-md'
    },
    {
      name: 'Patients',
      icon: 'fas fa-user-injured',
      submenus: [
        { url: 'add-patients', name: 'Add-Patients', icon: 'fas fa-calendar-check' },
        { url: 'list-patients', name: 'Patient List', icon: 'fas fa-hospital-user' }
      ]
    },
    {
      name: 'Appointments',
      icon: 'fas fa-calendar-check',
      submenus: [
        { url: 'add-appointment', name: 'Add Appointments', icon: 'fas fa-calendar-check' },
        { url: 'availability', name: 'Availability', icon: 'fas fa-user-clock' }
      ]
    },
    {
      url: 'users',
      name: 'Users',
      icon: 'fas fa-user'
    },
    {
      url: 'quicks-books',
      name: 'Quickbooks Connection',
      icon: 'fas fa-plug'
    },
    {
      url: 'settings',
      name: 'Settings',
      icon: 'fas fa-cog',
      submenus: [
        { url: 'manage-dropdowns', name: 'Manage Dropdowns', icon: 'fas fa-list-alt' }
      ]
    }
  ];

  // NOTIFICATION METHODS
  get notifications() {
    return this.notificationsSignal.asReadonly();
  }

  get unreadCount(): number {
    return this.notifications().filter(notification => !notification.isRead).length;
  }

  get hasUnread(): boolean {
    return this.unreadCount > 0;
  }

  recentNotifications = computed(() => 
    this.notifications()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  );

  get currentUserId(): string | null {
    return this.authService.getUserId();
  }

  setnotificationId: any;

  loadNotifications(): void {
    console.log("Loading notifications...");
    
    const userId = this.currentUserId;
    if (!userId) {
      console.log('No user ID found');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    
    this.adminService.getAllNotification().subscribe({
      next: (res: any) => {
        console.log("Notifications response:", res);
        
        let notificationsArray: Notification[] = [];
        
        // Handle different response formats
        if (Array.isArray(res)) {
          notificationsArray = res;
        } else if (res?.data && Array.isArray(res.data)) {
          notificationsArray = res.data;
        } else if (res?.notifications && Array.isArray(res.notifications)) {
          notificationsArray = res.notifications;
        } else if (res?.items && Array.isArray(res.items)) {
          notificationsArray = res.items;
        } else {
          console.warn('Unexpected response format:', res);
          notificationsArray = [];
        }

        // Process notifications to ensure proper structure
        const processedNotifications: Notification[] = notificationsArray.map((item: any, index: number) => {
          this.setnotificationId = item.id;
          return {
            id: item.id?.toString() || `temp-${Date.now()}-${index}`,
            message: item.message || item.content || item.body || 'No message content',
            isRead: Boolean(item.isRead || item.read || false),
            createdAt: item.createdAt || item.timestamp || item.createdDate || new Date().toISOString(),
            readAt: item.readAt || item.readDate || null,
            type: item.type || 'system',
            actionUrl: item.actionUrl || item.url || item.link || null,
            title: item.title || this.getDefaultTitle(item.type),
            priority: item.priority || 'medium'
          };
        });

        console.log("Processed notifications:", processedNotifications);
        this.notificationsSignal.set(processedNotifications);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.notificationsSignal.set([]);
        this.isLoading.set(false);
      }
    });
  }

  // Toggle notification dropdown
  toggleDropdown(): void {
    console.log('Before toggle - isOpen:', this.isOpen());
    this.isOpen.update(open => !open);
    
    if (this.isOpen()) {
      console.log('Dropdown opened, loading notifications...');
      this.loadNotifications();
    }
    console.log('After toggle - isOpen:', this.isOpen());
  }

  // Close dropdown
  closeDropdown(): void {
    this.isOpen.set(false);
  }

  // Handle notification click
  onNotificationClick(notification: Notification): void {
    console.log('Notification clicked:', notification);
    
    // Mark as read if unread
    if (!notification.isRead) {
      this.markAsRead(notification.id);
    }

    // Navigate if action URL provided
    if (notification.actionUrl) {
      console.log('Navigating to:', notification.actionUrl);
      this.router.navigateByUrl(notification.actionUrl).then(success => {
        if (success) {
          console.log('Navigation successful');
        }
      });
    }

    // Close dropdown after handling
    this.closeDropdown();
  }

  // Handle notification click in modal
  onModalNotificationClick(notification: Notification): void {
    console.log('Modal notification clicked:', notification);
    
    // Mark as read if unread
    if (!notification.isRead) {
      this.markAsRead(notification.id);
    }

    // Navigate if action URL provided
    if (notification.actionUrl) {
      console.log('Navigating to:', notification.actionUrl);
      this.router.navigateByUrl(notification.actionUrl).then(success => {
        if (success) {
          console.log('Navigation successful');
          this.closeAllNotificationsModal();
        }
      });
    }
  }

  // Mark single notification as read
  markAsRead(notificationId: string): void {
    console.log('Marking notification as read:', notificationId);
    
    // Optimistically update UI
    this.notificationsSignal.update(notifications =>
      notifications.map(notification =>
        notification.id === notificationId 
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification
      )
    );

    // Call service
    this.notificationService.markAsRead(notificationId).subscribe({
      error: (error) => {
        console.error('Error marking notification as read:', error);
        // Revert optimistic update on error
        this.notificationsSignal.update(notifications =>
          notifications.map(notification =>
            notification.id === notificationId 
              ? { ...notification, isRead: false, readAt: undefined }
              : notification
          )
        );
      }
    });
  }

  public _toastr = inject(TosterService);

  markAllAsRead(): void {
    debugger
   
    //  const userId:any = this.currentUserId;
 
    this.notificationService.markAllAsRead().subscribe({
      next: (res: any) => {
        this._loader?.hide();

        if (res) {
          this._toastr.success(res.data || 'All notifications marked as read.');
          // Optionally reload notifications list
          this.loadNotifications?.();
        } 
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
        this._loader?.hide();
        this._toastr.error(error?.error?.message || 'Something went wrong while marking notifications as read.');
      }
    });
  }

  // Delete notification
  deleteNotification(notificationId: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    console.log('Deleting notification:', notificationId);

    // Store the notification for potential rollback
    const notificationToDelete = this.notifications().find(n => n.id === notificationId);
    
    // Optimistically remove from UI
    this.notificationsSignal.update(notifications =>
      notifications.filter(notification => notification.id !== notificationId)
    );

    // Call service
    this.notificationService.deleteNotification(notificationId).subscribe({
      error: (error) => {
        console.error('Error deleting notification:', error);
        // Add back if deletion failed
        if (notificationToDelete) {
          this.notificationsSignal.update(notifications => 
            [...notifications, notificationToDelete]
          );
        }
      }
    });
  }

  // View all notifications - Opens modal instead of navigating
  viewAllNotifications(): void {
    console.log('Opening all notifications modal');
    this.closeDropdown();
    this.showAllNotificationsModal.set(true);
    // Load fresh data when opening modal
    this.loadNotifications();
  }

  // Close all notifications modal
  closeAllNotificationsModal(): void {
    console.log('Closing all notifications modal');
    this.showAllNotificationsModal.set(false);
  }

  // Close modal when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    
    const clickedInsideNotification = target.closest('.notification-container');
    if (!clickedInsideNotification && this.isOpen()) {
      console.log('Clicked outside notification dropdown, closing dropdown');
      this.closeDropdown();
    }
    
    // Close modal when clicking on backdrop
    if (this.showAllNotificationsModal() && target.classList.contains('fixed') && target.classList.contains('inset-0')) {
      console.log('Clicked outside modal, closing modal');
      this.closeAllNotificationsModal();
    }

    // Close date format modal when clicking outside
    if (this.showDateFormatModal() && target.classList.contains('modal-overlay')) {
      console.log('Clicked outside date format modal, closing modal');
      this.closeDateFormatModal();
    }

   const clickedInsideDateFormat = target.closest('.date-format-selector');

if (!clickedInsideDateFormat && this.isDateFormatPopoverOpen()) {
  this.isDateFormatPopoverOpen.set(false);
}

  }

  // Close modal with Escape key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showAllNotificationsModal()) {
      console.log('Escape key pressed, closing modal');
      this.closeAllNotificationsModal();
    }
    if (this.showDateFormatModal()) {
      console.log('Escape key pressed, closing date format modal');
      this.closeDateFormatModal();
    }
  }

  // Start polling for new notifications
  startPolling(): void {
    this.pollInterval = window.setInterval(() => {
      if (!this.isOpen() && !this.showAllNotificationsModal()) { // Only poll when dropdown and modal are closed
        this.checkForNewNotifications();
      }
    }, 30000); // Every 30 seconds
  }

  // Check for new notifications
  checkForNewNotifications(): void {
    const userId = this.currentUserId;
    if (!userId) return;

    console.log('Polling for new notifications...');
    // Implement your polling logic here if needed
  }

  // Format time ago for display
  formatTimeAgo(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks}w ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch (error) {
      console.error('Error formatting time ago:', error, dateString);
      return 'Recently';
    }
  }

  // Get notification title
  getNotificationTitle(type?: string): string {
    return this.getDefaultTitle(type);
  }

  // Get default title based on type
  private getDefaultTitle(type?: string): string {
    const titleMap: { [key: string]: string } = {
      system: 'System Message',
      alert: 'Alert',
      info: 'Information',
      success: 'Success',
      warning: 'Warning'
    };
    
    return titleMap[type || 'system'] || 'Notification';
  }

  // EXISTING METHODS (keeping your original functionality)
  toggleAccordion(menuName: string) {
    if (this.openedAccordion === menuName) {
      this.openedAccordion = null;
    } else {
      this.openedAccordion = menuName;
    }
  }

  isAccordionOpen(menuName: string): boolean {
    return this.openedAccordion === menuName;
  }

  logout() {
    this.authService.logout();
  }

  getUserDetails() {
    const get_username = this.authService.getUsername();
    const get_Role = this.authService.getUserRole();
    if (get_username && get_Role) {
      this.username = get_username;
      this.userRole = get_Role;
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    document.documentElement.classList.toggle('dark', this.isDarkMode);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.isMobileView = window.innerWidth <= 768;
    if (this.isMobileView && this.isMobileSidebarOpen) {
      this.isMobileSidebarOpen = false;
    }
  }

  checkScreenSize() {
    this.isMobileView = window.innerWidth <= 768;
    if (this.isMobileView) {
      this.isMobileSidebarOpen = false;
    }
  }

  toggleSidebar(): void {
    if (this.isMobileView) {
      this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
      
      const workspace = document.querySelector('.workspace');
      if (workspace) {
        if (this.isMobileSidebarOpen) {
          workspace.classList.add('mobile-sidebar-open');
        } else {
          workspace.classList.remove('mobile-sidebar-open');
        }
      }
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  handleBottomLinkClick(url?: string): void {
    if (url) {
      this.router.navigate([url]);
    } else {
      this.logout();
    }
    if (this.isMobileView) {
      this.toggleSidebar();
    }
  }

  // Keep your existing utility methods
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-orange-400 bg-orange-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

getDateFormat(){
    var getUserId:any = this.authService.getUserId();
    this.authService.getDateFormat(getUserId).subscribe(res => {
      console.log("res", res);
      
      let format: DateFormat = 'dd/MM/yyyy';
      
      if (res && res.dateFormat) {
        format = res.dateFormat;
      } else if (typeof res === 'string') {
        format = res as DateFormat;
      } else if (res && res.data && res.data.dateFormat) {
        format = res.data.dateFormat;
      }
      this.dateFormatService.setDateFormat(format);
    })
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'appointment_created':
      case 'appointment_updated':
        return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
      case 'appointment_reminder':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'payment_received':
        return 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z';
      case 'invoice_created':
        return 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z';
      case 'system_announcement':
        return 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  // DATE FORMAT SERVICE AND MODAL FUNCTIONALITY
  private dateFormatService = inject(DateFormatService);
  public currentDateFormat: Signal<DateFormat> = this.dateFormatService.dateFormat;
  public dateFormat = this.dateFormatService.getDateFormatOptions();

  

  // Date Format Modal functionality
  showDateFormatModal = signal(false);
  selectedDateFormat = signal<DateFormat | null>(null);
  selectedTimeFormat = signal<string>('12h');
  selectedFirstDayOfWeek = signal<string>('0');


public dateFormatOptions:any = [
  { value: 'MM/DD/YYYY' as DateFormat, label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY' as DateFormat, label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD' as DateFormat, label: 'YYYY-MM-DD' },
  { value: 'MMM DD, YYYY' as DateFormat, label: 'MMM DD, YYYY' },
  // { value: 'MMMM DD, YYYY' as DateFormat, label: 'MMMM DD, YYYY' },
  // { value: 'DD MMM YYYY' as DateFormat, label: 'DD MMM YYYY' }
];


openDateFormatModal(): void {
  this.selectedDateFormat.set(this.currentDateFormat());
  this.selectedTimeFormat.set(this.currentTimeFormat());
  this.selectedFirstDayOfWeek.set(this.currentFirstDayOfWeek());
  this.showDateFormatModal.set(true);
}

// CLOSE MODAL
closeDateFormatModal(event?: Event): void {
  if (event && event.target === event.currentTarget) {
    this.showSettingsModal.set(false);
  } else if (!event) {
    this.showSettingsModal.set(false);
  }
}

// SELECT DATE FORMAT
onDateFormatSelect(format: DateFormat): void {
  this.selectedDateFormat.set(format);
}

applyDateFormatSettings(): void {
  if (this.selectedDateFormat()) {
    const userId = this.currentUserId;
    if (!userId) {
      this._toastr.error('User not found. Please log in again.');
      return;
    }

    const updateData = {
      userId: userId,
      dateFormat: this.selectedDateFormat()!
    };

    this._loader.show();
    
    this.dateFormatService.UpdateDateformat(updateData).subscribe({
      next: (response: any) => {
        this._loader.hide();
        
        if (response.success) {
          // Update the universal date format service with the confirmed format from response
          this.dateFormatService.setDateFormat(response.data.dateFormat);
          this.showDateFormatModal.set(false); // Fixed: use showDateFormatModal
          this._toastr.success(response.message || 'Date format preferences updated successfully.');
          this.loadNotifications();
        } else {
          this._toastr.error(response.message || 'Failed to update date format.');
        }
      },
      error: (error: any) => {
        this._loader.hide();
        this.showDateFormatModal.set(false); // Fixed: use showDateFormatModal
        console.error('Error updating date format:', error);
        this._toastr.error(error?.error?.message || 'Failed to update date format. Please try again.');
      }
    });
  }
}

onDateFormatChange(event: any) {
  
  const selectElement = event.target as HTMLSelectElement;
  const newFormat = selectElement.value as DateFormat;
  this.dateFormatService.setDateFormat(newFormat);
  const userId = this.currentUserId;
  if (!userId) {
    this._toastr.error('User not found. Please log in again.');
    return;
  }

  const updateData = {
    userId: userId,
    dateFormat: newFormat
  };

  this._loader.show();
  
  this.dateFormatService.UpdateDateformat(updateData).subscribe({
    next: (response: any) => {
      this._loader.hide();
        this._toastr.success(response.message || 'Date format updated successfully.');
      
      
    },
    error: (error: any) => {
      this._loader.hide();
      console.error('Error updating date format:', error);
      this._toastr.error(error?.error?.message || 'Failed to update date format. Please try again.');
      // Optionally revert the local change if API fails
      // this.dateFormatService.setDateFormat(this.currentDateFormat());
    }
  });
}
dateFormats = [
  {
    value: 'dd/MM/yyyy',
    label: 'DD/MM/YYYY',
    description: 'Day first (International)',
    example: '25/12/2023'
  },
  {
    value: 'MM/dd/yyyy',
    label: 'MM/DD/YYYY',
    description: 'Month first (US)',
    example: '12/25/2023'
  },
  {
    value: 'yyyy-MM-dd',
    label: 'YYYY-MM-DD',
    description: 'ISO Standard',
    example: '2023-12-25'
  },
  {
    value: 'dd-MMM-yyyy',
    label: 'DD-MMM-YYYY',
    description: 'Day with abbreviated month',
    example: '25-Dec-2023'
  },
  {
    value: 'MMM dd, yyyy',
    label: 'MMM DD, YYYY',
    description: 'Month first with comma',
    example: 'Dec 25, 2023'
  }
];
isDateFormatPopupOpen = false;
  
toggleDateFormatPopup() {
  this.isDateFormatPopupOpen = !this.isDateFormatPopupOpen;
}

closeDateFormatPopup() {
  this.isDateFormatPopupOpen = false;
}

getCurrentDateFormatLabel(): string {
  const format = this.dateFormats.find(f => f.value === this.currentDateFormat());
  return format ? format.label : 'DD/MM/YYYY';
}

getFormattedExampleDate(): string {
  const today = new Date();
  return this.formatDate(today, this.currentDateFormat());
}

private formatDate(date: Date, format: string): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  switch(format) {
    case 'dd/MM/yyyy': return `${day}/${month}/${year}`;
    case 'MM/dd/yyyy': return `${month}/${day}/${year}`;
    case 'yyyy-MM-dd': return `${year}-${month}-${day}`;
    case 'dd-MMM-yyyy': return `${day}-${this.getMonthName(date)}-${year}`;
    case 'MMM dd, yyyy': return `${this.getMonthName(date)} ${day}, ${year}`;
    default: return `${day}/${month}/${year}`;
  }
}

private getMonthName(date: Date): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
}
  
formatDatePreview(format: any): string {
  const now = new Date();

  switch (format) {
    case 'MM/DD/YYYY':
      return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now
        .getDate()
        .toString()
        .padStart(2, '0')}/${now.getFullYear()}`;

    case 'DD/MM/YYYY':
      return `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${now.getFullYear()}`;

    case 'YYYY-MM-DD':
      return `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    case 'MMM DD, YYYY':
      return now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

    case 'MMMM DD, YYYY':
      return now.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

    case 'DD MMM YYYY':
      return now.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

    default:
      return now.toLocaleDateString();
  }
}

// TIME & WEEK SETTINGS MOCK
currentTimeFormat(): string {
  return localStorage.getItem('timeFormat') || '12h';
}

currentFirstDayOfWeek(): string {
  return localStorage.getItem('firstDayOfWeek') || '0';
}
showSettingsModal = signal(false);
selectedLanguage = signal<string>('en');
selectedTimezone = signal<string>('UTC');

// OPEN SETTINGS MODAL
openSettingsModal(): void {
  this.selectedDateFormat.set(this.currentDateFormat());
  this.selectedTimeFormat.set(this.currentTimeFormat());
  this.selectedFirstDayOfWeek.set(this.currentFirstDayOfWeek());
  this.selectedLanguage.set(this.currentLanguage());
  this.selectedTimezone.set(this.currentTimezone());
  this.showSettingsModal.set(true);
}

// CLOSE SETTINGS MODAL
closeSettingsModal(event?: Event): void {
  if (event && event.target === event.currentTarget) {
    this.showSettingsModal.set(false);
  } else if (!event) {
    this.showSettingsModal.set(false);
  }
}
isDateFormatPopoverOpen = signal(false);

toggleDateFormatPopover() {
  this.isDateFormatPopoverOpen.update(v => !v);
}
// APPLY ALL SETTINGS
applySettings(): void {
  if (this.selectedDateFormat()) {
    this.dateFormatService.setDateFormat(this.selectedDateFormat()!);
  }

  // Save time format
  localStorage.setItem('timeFormat', this.selectedTimeFormat());
  
  // Save first day of week
  localStorage.setItem('firstDayOfWeek', this.selectedFirstDayOfWeek());
  
  // Save language
  localStorage.setItem('language', this.selectedLanguage());
  
  // Save timezone
  localStorage.setItem('timezone', this.selectedTimezone());

  this.showSettingsModal.set(false);
  this._toastr.success('Settings updated successfully.');
}

// TIME FORMAT PREVIEW
formatTimePreview(format: string): string {
  const now = new Date();
  if (format === '12h') {
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } else {
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
}

// LANGUAGE CHANGE HANDLER
onLanguageChange(event: any): void {
  const selectElement = event.target as HTMLSelectElement;
  this.selectedLanguage.set(selectElement.value);
}

// TIMEZONE CHANGE HANDLER
onTimezoneChange(event: any): void {
  const selectElement = event.target as HTMLSelectElement;
  this.selectedTimezone.set(selectElement.value);
}

// GET CURRENT LANGUAGE
currentLanguage(): string {
  return localStorage.getItem('language') || 'en';
}

// GET CURRENT TIMEZONE
currentTimezone(): string {
  return localStorage.getItem('timezone') || 'UTC';
}

getCurrentFormatLabel(): string {
  const currentFormat = this.currentDateFormat();
  return this.dateFormatOptions.find((opt:any) => opt.value === currentFormat)?.label || currentFormat;
}

// GET FORMAT LABEL BY VALUE
getFormatLabel(format: DateFormat): string {
  return this.dateFormatOptions.find((opt:any) => opt.value === format)?.label || format;
}
}