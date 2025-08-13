import { Component, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import * as AOS from 'aos';
import { PopupService } from '../../service/popup/popup-service';

@Component({
  selector: 'app-landing-page',
  standalone: false,
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {


  logo:string ='/images/LogoLatest.png';
  public Router = inject(Router);
  public _loader = inject(PopupService);
  public ngZone = inject(NgZone)

 ngAfterViewInit(): void {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: false,
      mirror: true
    });

    setTimeout(() => {
      AOS.refresh();
    }, 500);
  }

navigateToLogin(): void {
  console.log('Showing loader');
  this._loader.show();

  setTimeout(() => {
    console.log('Navigating now');
    this.Router.navigate(['/patient/login']).then(() => {
      console.log('Hiding loader');
      this._loader.hide();
    });
  }, 1000);
}


  navigateToDashboard(): void {
    // this.router.navigate(['/dashboard']);
  }
}
