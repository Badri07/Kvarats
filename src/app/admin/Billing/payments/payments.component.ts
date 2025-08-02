import { Component, inject } from '@angular/core';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-payments',
  standalone: false,
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent {

 public breadcrumbService = inject(BreadcrumbService)

  ngOnInit(){
  this.breadcrumbService.setBreadcrumbs([
    { label: 'Billing Payments', url: 'billing/payments' },
  ]);
  }

}
