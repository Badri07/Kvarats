import { Component, inject } from '@angular/core';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-superbills',
  standalone: false,
  templateUrl: './superbills.component.html',
  styleUrl: './superbills.component.scss'
})
export class SuperbillsComponent {
public breadcrumbService = inject(BreadcrumbService)

  ngOnInit(){
  this.breadcrumbService.setBreadcrumbs([
    { label: 'Superbills', url: 'superbills' },
  ]);
  }
}
