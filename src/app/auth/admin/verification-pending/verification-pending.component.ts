import { Component } from '@angular/core';

@Component({
  selector: 'app-verification-pending',
  standalone: false,
  templateUrl: './verification-pending.component.html',
  styleUrl: './verification-pending.component.scss'
})
export class VerificationPendingComponent {

  accent = '#FFA157';
  mail:string='support@gmail.com'
  refreshStatus() {
    window.location.reload();
  }
 
  contactSupport() {
    window.location.href = 'mailto:support@example.com';
  }
}
