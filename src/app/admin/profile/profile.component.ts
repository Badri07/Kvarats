import { Component, inject } from '@angular/core';
import { AuthService } from '../../service/auth/auth.service';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {

  userEmail!:string | null;

 public authService = inject(AuthService);
 public breadcrumbService = inject(BreadcrumbService);
 

  ngOnInit(){
     this.breadcrumbService.setBreadcrumbs([
    { label: 'Profile', url: 'profile' },
  ]);
    this.getUserName();
  }

    getUserName(){
    this.userEmail = this.authService.getUsername();
}

}
