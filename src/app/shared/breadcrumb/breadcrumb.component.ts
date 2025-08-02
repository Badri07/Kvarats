import { Component } from '@angular/core';
import { BreadcrumbService } from './breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  standalone: false,
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {

  breadcrumbs:any = [];
  show = true;


  constructor(private breadcrumbService: BreadcrumbService) {
    
    this.breadcrumbService.breadcrumbs$.subscribe(bcs => {
      this.breadcrumbs = bcs;
    });
    this.breadcrumbService.isVisible$.subscribe(status => {
    this.show = status;
  });

  }
}
