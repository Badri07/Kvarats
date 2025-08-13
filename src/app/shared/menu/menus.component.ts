import { Component, Input } from '@angular/core';
import { AuthService } from '../../service/auth/auth.service';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { PopupService } from '../../service/popup/popup-service';
import { Menu, MenuService } from './menus.service';


@Component({
  selector: 'app-menus',
  standalone: false,
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.scss'
})
export class MenusComponent {
    @Input() isDarkMode = false;

menus: Menu[] = [];
  openedAccordion: string | null = null;
  username: string | null | undefined;
  userRole: string | null | undefined;

  isMobileView = false;
  isMobileSidebarOpen = false;
  isSidebarCollapsed = false;

  userEmail!:string | null

  constructor(
    private authservice: AuthService,
    private menuService: MenuService,
    private router: Router,
    private _loader: PopupService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this._loader.show();
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        setTimeout(() => {
          this._loader.hide();
        }, 300);
      }
    });
  }

  ngOnInit() {
    this.getUserDetails();
    this.loadMenus();
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());


  }

  loadMenus() {
    this.menuService.getMenus().subscribe({
      next: (data) => {
        console.log("Data",data);

        this.menus = this.buildMenuHierarchy(data);
      },
      error: (err) => {
        console.error('Error fetching menus', err);
      }
    });
  }

 buildMenuHierarchy(flatMenus: Menu[]): Menu[] {
  const menuMap = new Map<string, Menu>();
  const roots: Menu[] = [];

  flatMenus.forEach(menu => {
    // Prepend 'admin' if not already included
    if (menu.url && !menu.url.startsWith('/admin')) {
      menu.url = '/admin' + menu.url;
    }

    menu.submenus = [];
    menuMap.set(menu.id, menu);
  });

  flatMenus.forEach(menu => {
    if (menu.parentMenuId) {
      const parent = menuMap.get(menu.parentMenuId);
      if (parent) {
        parent.submenus?.push(menu);
      }
    } else {
      roots.push(menu);
    }
  });

  return roots;
}


  toggleAccordion(menuName: string) {
    this.openedAccordion = this.openedAccordion === menuName ? null : menuName;
  }

  isAccordionOpen(menuName: string): boolean {
    return this.openedAccordion === menuName;
  }

  logout() {
    this.authservice.logout();
  }

  getUserDetails() {
    this.username = this.authservice.getUsername();
    this.userRole = this.authservice.getUserRole();

  }

  checkScreenSize() {
    this.isMobileView = window.innerWidth < 768;
    if (!this.isMobileView) {
      this.isMobileSidebarOpen = false;
    }
  }

  toggleSidebar() {
    if (this.isMobileView) {
      this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('dark', this.isDarkMode);
  }

handleSingleMenuClick(url: string) {
  this.openedAccordion = null; 
  if (this.router.url !== url) {
    this.router.navigate([url]);
  }
  if (this.isMobileView) {
    this.isMobileSidebarOpen = false;
  }
}

}
