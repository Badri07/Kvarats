// shared-popup.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PopupData {
  title: string;
  content: string;
  show: boolean;
  // Add any other properties you need
}

@Injectable({
  providedIn: 'root'
})
export class SharedPopupService {
  private popupState = new BehaviorSubject<PopupData>({
    title: '',
    content: '',
    show: false
  });

  // Observable that components can subscribe to
  popupState$: Observable<PopupData> = this.popupState.asObservable();

  // Method to show the popup
  showPopup(title: string, content: string): void {
    this.popupState.next({
      title,
      content,
      show: true
    });
  }

  // Method to hide the popup
  hidePopup(): void {
    this.popupState.next({
      ...this.popupState.value,
      show: false
    });
  }

  // Method to update popup content
  updatePopupContent(content: string): void {
    this.popupState.next({
      ...this.popupState.value,
      content
    });
  }
}