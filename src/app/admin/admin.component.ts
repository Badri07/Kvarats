import { Component, Input } from '@angular/core';
import { AuthService } from '../service/auth/auth.service';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { PopupService } from '../service/popup/popup-service';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {

 openedAccordion: string | null = null;
 username: string = '';
 userRole: string = '';

  @Input() isDarkMode = false;

  
isMobileView:boolean = false;
isMobileSidebarOpen:boolean = false;

//titleImg:string ='/images/visit-wise-logo 1.png';
userImg:string ='/images/user-image-removebg-preview.png';
logo:string ='/images/LogoLatest.png';
titleImg:string ='/images/CalendarlyLogo.svg';

toggleOpen: string = '/images/sidenav-open.png';
toggleClose: string = '/images/sidenav-close.png';

 constructor(private authservice:AuthService,
  private router: Router,
  private _loader:PopupService
 ){
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
 }


  ngOnInit() {
    const storedDark = localStorage.getItem('darkMode');
    this.isDarkMode = storedDark === 'true';

    this.getUserDetails();
    this.checkScreenSize();
  window.addEventListener('resize', () => this.checkScreenSize());
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
              //  { url: 'patients', name: 'Patient Assessment', icon: 'fas fa-notes-medical' },

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
        {
          url: 'manage-dropdowns', name: 'Manage Dropdowns',icon: 'fas fa-list-alt' }
      ]
    }
  ];
checkScreenSize() {
  this.isMobileView = window.innerWidth < 768;
  if (!this.isMobileView) {
    this.isMobileSidebarOpen = false;
  }
}
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

  logout(){
    this.authservice.logout();
  }

  getUserDetails() {
   var get_username = this.authservice.getUsername();
   var get_Role = this.authservice.getUserRole();
    if (get_username && get_Role) {

      this.username = get_username
      this.userRole = get_Role
    }
  }

isSidebarCollapsed: boolean = false;
toggleSidebar() {
  this.isSidebarCollapsed = !this.isSidebarCollapsed;
}


//dark mode
toggleDarkMode() {
   this.isDarkMode = !this.isDarkMode;
  localStorage.setItem('darkMode', String(this.isDarkMode));
}

}
