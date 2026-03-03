import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend, LineController, PointElement, ChartType, ChartConfiguration, LineElement, Filler } from 'chart.js';
import { AuthService } from '../../../service/auth/auth.service';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';
import { interval, Subscription } from 'rxjs';
import { SuperAdminService } from '../../../service/admin/superAdmin.service';
import { AdminService } from '../../../service/admin/admin.service';
import { Router } from '@angular/router';

ChartJS.register( CategoryScale, LineController, LinearScale, LineElement, PointElement, Filler, BarElement, BarController, Title, Tooltip, Legend );

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentDate: Date = new Date();
  IsshowPagination: boolean = false;
  tableHeight: string = '300px';
  public _authService = inject(AuthService);
  public breadcrumbService = inject(BreadcrumbService);
  private superAdminService = inject(SuperAdminService);
  public adminService = inject(AdminService);
  private router = inject(Router);

  // QuickBooks Popup Properties
  showQuickBooksPopup: boolean = false;
  private popupShownKey = 'quickbooks_popup_shown';
  private popupDismissedKey = 'quickbooks_popup_dismissed';

  activeSessions: any[] = [];
  sessionHistory: any[] = [];
  suspiciousActivities: any[] = [];
  sessionStats: any = {
    totalActive: 0,
    totalToday: 0,
    averageDuration: '0m',
    peakConcurrent: 0
  };
  liveSessionFeed: any[] = [];
  private sessionSubscription!: Subscription;
  private sessionRefreshInterval!: Subscription;

  userName!: string | null;
  get_email!: string | null;
  userRole!: string;
  recentUserActivity: any[] = [];
  recentMenuUsage: any[] = [];
  quickActions: any[] = [];
  upcomingAppointments: any[] = [];
  notifications: any[] = [];
  recentFilter: string = 'today';
  summaryCards: any[] = [];
  therapists: any[] = [];
  recoveryRates: any[] = [];
  pieData: any[] = [];
  chartConfigs: any[] = [];
  users: any[] = [];
  columnDefs: any[] = [];
  adminCards: any[] = [];
  superAdminCards: any[] = [];
  recentClients: any[] = [];
  
  dashboardData: any = {
    totalClients: 0,
    totalClientsThisMonth: 0,
    totalMultiProviders: 0,
    totalMultiProvidersThisMonth: 0,
    totalSoloProviders: 0,
    totalSoloProvidersThisMonth: 0,
    recentClients: []
  };

  clientDashboardData: any = {
    isSoloProvider: false,
    totalUsers: 0,
    totalPatients: 0,
    upcomingAppointments: []
  };

  systemStats: any = {
    memoryUsage: 0,
    usedMemory: 0,
    totalMemory: 0,
    cpuCores: 0,
    cpuThreads: 0,
    performanceScore: 0,
    connectionType: 'Unknown',
    downlink: 0,
    deviceType: 'Unknown',
    browserName: 'Unknown',
    browserVersion: 'Unknown',
    pageLoadTime: 0,
    domReadyTime: 0,
    timing: {},
    status: 'healthy'
  };
  systemAlerts: any[] = [];
  performanceHistory: any[] = [];
  performanceChartData: any = {};
  performanceChartOptions: any = {};
  isLoadingSystemStats: boolean = false;
  isLoadingDashboard: boolean = false;
  private systemStatsSubscription!: Subscription;
  private memoryCheckInterval: any;
  private performanceSubscription: any;

  ngOnInit() {
    this.getUserName();
    this.getUserRole();
    this.breadcrumbService.setVisible(false);
    this.initializeQuickActions();
    this.initializeNotifications();
    this.loadRealSystemStats();
    this.setupPerformanceMonitoring();
    this.initializeSessionMonitoring();
    this.startLiveSessionUpdates();
    
    if (this.userRole === 'Admin') {
      this.loadClientDashboardData();
    }
    if(this.userRole ==='SuperAdmin'){
      this.loadDashboardData();
    }

    this.checkAndShowQuickBooksPopup();
  }

  ngOnDestroy() {
    this.breadcrumbService.setVisible(true);
    if (this.systemStatsSubscription) {
      this.systemStatsSubscription.unsubscribe();
    }
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
    }
    if (this.sessionRefreshInterval) {
      this.sessionRefreshInterval.unsubscribe();
    }
    if (this.performanceSubscription) {
      this.performanceSubscription.unsubscribe();
    }
  }

  private checkAndShowQuickBooksPopup(): void {
    const popupShown = localStorage.getItem(this.popupShownKey);
    const popupDismissed = localStorage.getItem(this.popupDismissedKey);
    
    if (!popupShown && !popupDismissed) {
      setTimeout(() => {
        this.showQuickBooksPopup = true;
        localStorage.setItem(this.popupShownKey, 'true');
      }, 1000);
    }
  }

  onCloseQuickBooksPopup(): void {
    this.showQuickBooksPopup = false;
    localStorage.setItem(this.popupDismissedKey, 'true');
  }

  onConnectQuickBooks(): void {
    this.showQuickBooksPopup = false;
    localStorage.setItem(this.popupDismissedKey, 'true');
    this.router.navigate(['/quicks-books']);
  }

  onRemindLater(): void {
    this.showQuickBooksPopup = false;
    localStorage.removeItem(this.popupShownKey);
  }

  loadClientDashboardData(): void {
    const clientId:any = this._authService.getClientId();
    const currentUserId:any = this._authService.getUserId();

    this.adminService.getClientDashboard(clientId, currentUserId).subscribe({
      next: (response) => {
        if (response.success) {
          this.clientDashboardData = response.data;
          this.transformClientDashboardData();
        }
      },
      error: (error) => {
        console.error('Error loading client dashboard data:', error);
      }
    });
  }

  private transformClientDashboardData(): void {
    this.upcomingAppointments = this.clientDashboardData.upcomingAppointments.map((appointment: any) => ({
      appointmentId: appointment.appointmentId,
      patientName: appointment.patientName,
      therapistName: appointment.therapistName,
      time: this.formatTime(appointment.startTime),
      date: this.formatDate(appointment.date),
      status: appointment.status,
      type: 'Scheduled Appointment'
    }));

    this.updateAdminCardsWithClientData();
  }

  private formatTime(timeString: string): string {
    if (!timeString) return '';
    const timeParts = timeString.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  private updateAdminCardsWithClientData(): void {
    this.adminCards = [ 
      { 
        bg: 'bg-purple-600', 
        icon: 'fas fa-users', 
        title: 'Total Users', 
        value: this.clientDashboardData.totalUsers.toString(),
        subText: 'Active users in system',
        chart: this.getLineChartConfig('#8B5CF6', 'rgba(139, 92, 246, 0.1)', 'Users')
      },
      { 
        bg: 'bg-blue-500', 
        icon: 'fas fa-user-injured', 
        title: 'Total Patients', 
        value: this.clientDashboardData.totalPatients.toString(),
        subText: 'Registered patients',
        chart: this.getLineChartConfig('#3B82F6', 'rgba(59, 130, 246, 0.1)', 'Patients')
      },
      { 
        bg: 'bg-green-500', 
        icon: 'fas fa-calendar-check', 
        title: 'Upcoming Appointments', 
        value: this.clientDashboardData.upcomingAppointments.length.toString(),
        subText: 'Scheduled sessions',
        chart: this.getLineChartConfig('#10B981', 'rgba(16, 185, 129, 0.1)', 'Appointments')
      },
      { 
        bg: 'bg-orange-500', 
        icon: 'fas fa-user-md', 
        title: 'Provider Type', 
        value: this.clientDashboardData.isSoloProvider ? 'Solo' : 'Multi',
        subText: this.clientDashboardData.isSoloProvider ? 'Independent practice' : 'Group practice',
        chart: this.getLineChartConfig('#F59E0B', 'rgba(245, 158, 11, 0.1)', 'Provider')
      }
    ];
  }

  refreshClientDashboard(): void {
    this.loadClientDashboardData();
  }

  loadDashboardData(): void {
    this.isLoadingDashboard = true;
    this.superAdminService.getSuperAdminDashboard().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardData = response.data;
          this.transformRecentClientsData();
          this.updateSuperAdminCards();
        }
        this.isLoadingDashboard = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoadingDashboard = false;
      }
    });
  }

  private transformRecentClientsData(): void {
    this.recentClients = this.dashboardData.recentClients.map((client: any) => ({
      id: client.id,
      initial: this.getInitials(client.name),
      name: client.name,
      type: 'Client',
      status: 'Active',
      country: client.countryName,
      phoneNumber: client.phoneNumber,
      created: new Date(client.createdAt)
    }));
  }

  private getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  private updateSuperAdminCards(): void {
    this.superAdminCards = [ 
      { 
        bg: 'bg-purple-600', 
        icon: 'fas fa-building', 
        title: 'Total Clients', 
        value: this.dashboardData.totalClients.toString(),
        subText: `+${this.dashboardData.totalClientsThisMonth} this month` 
      },
      { 
        bg: 'bg-orange-300', 
        icon: 'fas fa-user-md', 
        title: 'Total Multi Providers', 
        value: this.dashboardData.totalMultiProviders.toString(),
        subText: `+${this.dashboardData.totalMultiProvidersThisMonth} this month` 
      }, 
      { 
        bg: 'bg-green-500', 
        icon: 'fas fa-users', 
        title: 'Total Solo Providers', 
        value: this.dashboardData.totalSoloProviders.toString(),
        subText: `+${this.dashboardData.totalSoloProvidersThisMonth} this month` 
      }
    ];
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  initializeSessionMonitoring(): void {
    this.loadActiveSessions();
    this.loadSessionHistory();
    this.loadSuspiciousActivities();
  }

  startLiveSessionUpdates(): void {
    this.sessionRefreshInterval = interval(10000).subscribe(() => {
      this.loadActiveSessions();
      this.updateSessionStats();
    });
  }

  async loadActiveSessions(): Promise<void> {
    try {
      this.updateSessionStats();
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  async loadSessionHistory(): Promise<void> {
    try {
    } catch (error) {
      console.error('Failed to load session history:', error);
    }
  }

  async loadSuspiciousActivities(): Promise<void> {
    try {
    } catch (error) {
      console.error('Failed to load suspicious activities:', error);
    }
  }

  updateSessionStats(): void {
    this.sessionStats = {
      totalActive: this.activeSessions.length,
      totalToday: this.getTodaySessionsCount(),
      averageDuration: this.calculateAverageDuration(),
      peakConcurrent: this.calculatePeakConcurrent(),
      uniqueUsers: this.getUniqueUsersCount(),
      byDevice: this.getSessionsByDevice(),
      byLocation: this.getSessionsByLocation()
    };
  }

  calculateTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }

  calculateDuration(loginTime: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(loginTime).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  }

  getSessionStatus(lastActivity: Date): string {
    const inactiveMs = new Date().getTime() - new Date(lastActivity).getTime();
    const inactiveMins = Math.floor(inactiveMs / 60000);
    
    if (inactiveMins < 5) return 'active';
    if (inactiveMins < 15) return 'idle';
    return 'inactive';
  }

  getTodaySessionsCount(): number {
    const today = new Date().toDateString();
    return this.sessionHistory.filter(session => 
      new Date(session.loginTime).toDateString() === today
    ).length;
  }

  calculateAverageDuration(): string {
    if (this.sessionHistory.length === 0) return '0m';
    
    const totalMs = this.sessionHistory.reduce((sum, session) => {
      return sum + (new Date(session.logoutTime).getTime() - new Date(session.loginTime).getTime());
    }, 0);
    
    const avgMs = totalMs / this.sessionHistory.length;
    const avgMins = Math.floor(avgMs / 60000);
    
    return avgMins < 60 ? `${avgMins}m` : `${Math.floor(avgMins / 60)}h ${avgMins % 60}m`;
  }

  calculatePeakConcurrent(): number {
    return Math.max(this.activeSessions.length, 0);
  }

  getUniqueUsersCount(): number {
    const uniqueUsers = new Set(this.activeSessions.map(session => session.userId));
    return uniqueUsers.size;
  }

  getSessionsByDevice(): any {
    const devices = this.activeSessions.reduce((acc, session) => {
      acc[session.deviceType] = (acc[session.deviceType] || 0) + 1;
      return acc;
    }, {});
    
    return devices;
  }

  getSessionsByLocation(): any {
    const locations = this.activeSessions.reduce((acc, session) => {
      acc[session.location] = (acc[session.location] || 0) + 1;
      return acc;
    }, {});
    
    return locations;
  }

  setupPerformanceMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      this.updateMemoryUsage();
    }, 5000);
    this.performanceSubscription = interval(10000).subscribe(() => {
      this.updatePerformanceMetrics();
    });
  }

  loadRealSystemStats(): void {
    this.getMemoryUsage();
    this.getCPUInfo();
    this.getNetworkInfo();
    this.getDeviceInfo();
    this.getPerformanceTiming();
    this.calculatePerformanceScore();
  }

  refreshSystemStats(): void {
    this.loadRealSystemStats();
  }

  private getMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.systemStats.usedMemory = Math.round(memory.usedJSHeapSize / 1048576);
      this.systemStats.totalMemory = Math.round(memory.totalJSHeapSize / 1048576);
      this.systemStats.memoryUsage = Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100);
    } else {
      this.estimateMemoryUsage();
    }
  }

  private estimateMemoryUsage(): void {
    const estimatedUsage = Math.round(Math.random() * 30 + 50);
    this.systemStats.memoryUsage = estimatedUsage;
    this.systemStats.usedMemory = Math.round((estimatedUsage / 100) * 1024);
    this.systemStats.totalMemory = 1024;
  }

  private updateMemoryUsage(): void {
    this.getMemoryUsage();
  }

  private getCPUInfo(): void {
    if (navigator.hardwareConcurrency) {
      this.systemStats.cpuCores = navigator.hardwareConcurrency;
      this.systemStats.cpuThreads = navigator.hardwareConcurrency;
    } else {
      this.systemStats.cpuCores = 4;
      this.systemStats.cpuThreads = 4;
    }
  }

  private getNetworkInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.systemStats.connectionType = connection.effectiveType || 'Unknown';
      this.systemStats.downlink = connection.downlink || 0;
    } else {
      this.systemStats.connectionType = 'Unknown';
      this.systemStats.downlink = 0;
    }
  }

  private getDeviceInfo(): void {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) {
      this.systemStats.browserName = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      this.systemStats.browserName = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      this.systemStats.browserName = 'Safari';
    } else if (userAgent.includes('Edge')) {
      this.systemStats.browserName = 'Edge';
    }
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      this.systemStats.deviceType = 'Mobile';
    } else if (/Tablet/.test(userAgent)) {
      this.systemStats.deviceType = 'Tablet';
    } else {
      this.systemStats.deviceType = 'Desktop';
    }
    const versionMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/([0-9.]+)/);
    this.systemStats.browserVersion = versionMatch ? versionMatch[2] : 'Unknown';
  }

  private getPerformanceTiming(): void {
    const timing = performance.timing;
    this.systemStats.timing = {
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcpConnection: timing.connectEnd - timing.connectStart,
      ttfb: timing.responseStart - timing.requestStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      fullLoad: timing.loadEventEnd - timing.navigationStart
    };
    this.systemStats.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    this.systemStats.domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
  }

  private calculatePerformanceScore(): void {
    let score = 100;
    if (this.systemStats.pageLoadTime > 3000) score -= 20;
    else if (this.systemStats.pageLoadTime > 2000) score -= 10;
    if (this.systemStats.memoryUsage > 80) score -= 15;
    else if (this.systemStats.memoryUsage > 70) score -= 10;
    if (this.systemStats.connectionType === 'slow-2g') score -= 20;
    else if (this.systemStats.connectionType === '2g') score -= 10;
    this.systemStats.performanceScore = Math.max(0, score);
  }

  private updatePerformanceMetrics(): void {
    this.getMemoryUsage();
    this.calculatePerformanceScore();
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.getNetworkInfo();
        this.calculatePerformanceScore();
      });
    }
  }

  initializeQuickActions(): void {
    this.quickActions = [ 
      { 
        label: 'Add Patient', 
        icon: 'fas fa-user-plus', 
        action: 'addPatient',
        route: '/admin/patients/add-patients'
      }, 
      { 
        label: 'Add User', 
        icon: 'fas fa-user-plus', 
        action: 'addUser',
        route: '/admin/users'
      }, 
      { 
        label: 'Appointments', 
        icon: 'fas fa-calendar-plus', 
        action: 'appointments',
        route: '/admin/appointments/add'
      }, 
      { 
        label: 'QB Connection', 
        icon: 'fas fa-plug', 
        action: 'qbConnection',
        route: '/admin/quicks-books'
      } 
    ];
  }

  initializeNotifications(): void {
    this.notifications = [];
  }

  getDurationClass(durationMinutes: number): string {
    if (durationMinutes > 120) { return 'bg-red-100 text-red-800'; } 
    else if (durationMinutes > 60) { return 'bg-orange-100 text-orange-800'; } 
    else { return 'bg-green-100 text-green-800'; }
  }

  refreshRecentActivity(): void { 
    console.log('Refreshing recent activity...'); 
  }

  filterRecentActivity(filter: string): void { 
    this.recentFilter = filter; 
    console.log('Filtering recent activity by:', filter); 
  }

  viewMenuDetails(usage: any): void { 
    console.log('Viewing menu details:', usage); 
  }
   
  handleQuickAction(action: any): void {
    switch (action.action) {
      case 'addPatient':
        this.router.navigate(['/patients/add-patients'], {
          queryParams: { tab: 'AddPatients' }
        });
        break;
      case 'addUser':
        this.router.navigate(['/users'], {
          queryParams: { tab: 'AddUser' }
        });
        break;
      case 'appointments':
        this.router.navigate(['/appointments/add']);
        break;
      case 'qbConnection':
        this.router.navigate(['/quicks-books']);
        break;
    }
  }

  getLineChartConfig(color: string, bgColor: string, label: string): ChartConfiguration<'line'> {
    return { 
      type: 'line', 
      data: { 
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 
        datasets: [{ 
          label, 
          data: [10, 20, 15, 25, 30, 18, 10], 
          fill: true, 
          borderColor: color, 
          backgroundColor: bgColor, 
          tension: 0.4, 
          pointRadius: 4, 
          pointBackgroundColor: color 
        }] 
      }, 
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false }, 
          tooltip: { 
            callbacks: { 
              label: (ctx) => `${label}: ${ctx.parsed.y}` 
            } 
          } 
        }, 
        scales: { 
          x: { display: false }, 
          y: { display: false } 
        }, 
        elements: { 
          line: { borderWidth: 2 } 
        } 
      } 
    };
  }

  getUserName() { 
    this.userName = this._authService.getUsername(); 
  }

  getUserRole() { 
    this.userRole = this._authService.getUserRole(); 
    console.log("userRole", this.userRole); 
  }

  editUser(id: string) { }

  onDelete(id: string) { }

  viewSessionDetails(data: any) { }

  sendWarning(data: any) { }

  forceLogout(data: any) { }
}