import { Component, inject } from '@angular/core';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-insurance-eraeob',
  standalone: false,
  templateUrl: './insurance-eraeob.component.html',
  styleUrl: './insurance-eraeob.component.scss'
})
export class InsuranceEraeobComponent {

  
  public breadcrumbService = inject(BreadcrumbService)

  ngOnInit(){
  this.breadcrumbService.setBreadcrumbs([
    { label: 'Insurance Eraeob', url: 'insurance/eraeob' },
  ]);
  }
}
