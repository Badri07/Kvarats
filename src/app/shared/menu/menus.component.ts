import { Component, Input, OnDestroy } from '@angular/core';
import { AuthService } from '../../service/auth/auth.service';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { PopupService } from '../../service/popup/popup-service';
import { Menu, MenuService } from './menus.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menus',
  standalone: false,
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.scss'
})
export class MenusComponent implements OnDestroy {
  @Input() isDarkMode = false;

  menus: Menu[] = [];
  openedAccordion: string | null = null;
  username: string | null | undefined;
  userRole: string | null | undefined;

  isMobileView = false;
  isMobileSidebarOpen = false;
  isSidebarCollapsed = false;

  userEmail!: string | null;
  private routerSubscription: Subscription;

  constructor(
    private authservice: AuthService,
    private menuService: MenuService,
    private router: Router,
    private _loader: PopupService
  ) {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this._loader.show();
      } else if (event instanceof NavigationEnd) {
        this.updateActiveMenuState(event.urlAfterRedirects || event.url);
        setTimeout(() => {
          this._loader.hide();
        }, 300);
      } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
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

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

    loadMenus() {
    let menuObservable;
 
    if (this.userRole === 'Admin' || this.userRole === 'Therapist') {
      menuObservable = this.menuService.getMenus();
    } else if (this.userRole === 'SuperAdmin') {
      menuObservable = this.menuService.getSuperAdminMenus();
    } else {
      return;
    }
 
    menuObservable.subscribe({
      next: (data) => {
        this.menus = this.buildMenuHierarchy(data);
        this.updateActiveMenuState(this.router.url);
        console.log("this.router.url", this.router.url);
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
      if (menu.url && !menu.url) {
        menu.url = menu.url;
      }

      menu.submenus = [];
      menu.isActive = false;
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

  updateActiveMenuState(currentUrl: string): void {
    this.resetActiveStates(this.menus);
    this.findAndSetActiveSubmenu(this.menus, currentUrl);
    this.autoOpenAccordionForActiveSubmenu(this.menus);
  }

  resetActiveStates(menus: Menu[]): void {
    menus.forEach(menu => {
      menu.isActive = false;
      if (menu.submenus && menu.submenus.length > 0) {
        this.resetActiveStates(menu.submenus);
      }
    });
  }

  findAndSetActiveSubmenu(menus: Menu[], currentUrl: string): boolean {
    for (const menu of menus) {
      if (menu.url === currentUrl) {
        this.isMobileSidebarOpen = false;
        menu.isActive = true;
        return true;
      }
      
      if (menu.url && currentUrl.startsWith(menu.url + '/')) {
        this.isMobileSidebarOpen = false;
        menu.isActive = true;
        return true;
      }
      
      if (menu.submenus && menu.submenus.length > 0) {
        const found = this.findAndSetActiveSubmenu(menu.submenus, currentUrl);
        if (found) {
          return true;
        }
      }
    }
    return false;
  }

  autoOpenAccordionForActiveSubmenu(menus: Menu[]): void {
    for (const menu of menus) {
      if (menu.submenus && menu.submenus.length > 0) {
        const hasActiveSubmenu = menu.submenus.some(sub => sub.isActive);
        if (hasActiveSubmenu) {
          this.openedAccordion = menu.name;
          return;
        }
        this.autoOpenAccordionForActiveSubmenu(menu.submenus);
      }
    }
  }

  isMenuActive(menu: Menu): boolean {
    return menu.isActive || false;
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