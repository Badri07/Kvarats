import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Breadcrumb } from '../../models/breacrumb.interface';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {

  private breadcrumbs = new BehaviorSubject<Breadcrumb[]>([]);
  breadcrumbs$ = this.breadcrumbs.asObservable();

  setBreadcrumbs(breadcrumbs: Breadcrumb[]) {
    this.breadcrumbs.next(breadcrumbs);
  }

private isVisible = new BehaviorSubject<boolean>(true);
isVisible$ = this.isVisible.asObservable();

setVisible(status: boolean) {
  this.isVisible.next(status);
}


}
