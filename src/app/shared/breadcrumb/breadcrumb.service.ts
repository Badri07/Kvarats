import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
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



private socket$!: WebSocketSubject<any>;

  connect(channel: string): Observable<any> {
    const wsUrl = `ws://your-api-domain.com/ws/${channel}`; 
    return this.socket$.asObservable();
  }

  sendMessage(message: any): void {
    if (this.socket$) {
      this.socket$.next(message);
    }
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
    }
  }
}
