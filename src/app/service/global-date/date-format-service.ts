import { inject, Injectable, Signal, signal } from '@angular/core';
import { catchError, map, Observable, Subject, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environments';
import { HttpClient } from '@angular/common/http';

export type DateFormat = 
  | 'dd/MM/yyyy' 
  | 'MM/dd/yyyy' 
  | 'yyyy-MM-dd' 
  | 'dd-MMM-yyyy' 
  | 'MMM dd, yyyy';

@Injectable({
  providedIn: 'root'
})
export class DateFormatService {
  private readonly STORAGE_KEY = 'user-date-format';
  
  // Use consistent naming - currentFormat is the private signal
  private currentFormat = signal<DateFormat>('dd/MM/yyyy');
  
  // Public readonly signal for components
  public dateFormat = this.currentFormat.asReadonly();
  
  // Subject for change notifications
  private dateFormatChanged = new Subject<void>();
  dateFormatChanged$ = this.dateFormatChanged.asObservable();
  
  public http = inject(HttpClient);

  constructor() {
    // Load from localStorage on service creation
    this.loadSavedFormat();
  }

  // Add this method to initialize from backend
  initializeDateFormat(userId: string): void {
    this.getUserDateFormat(userId).subscribe({
      next: (response) => {
        if (response && response.data && response.data.dateFormat) {
          const apiFormat = response.data.dateFormat;
          // Convert API format to your service format
          const mappedFormat = this.mapApiFormatToServiceFormat(apiFormat);
          this.setDateFormat(mappedFormat);
        } else if (response && response.dateFormat) {
          // Alternative response format
          const mappedFormat = this.mapApiFormatToServiceFormat(response.dateFormat);
          this.setDateFormat(mappedFormat);
        }
      },
      error: (error) => {
        console.error('Failed to load date format from API:', error);
        // Already loaded from localStorage in constructor, so no need to fallback
      }
    });
  }

  // Add this method to map API format to your format
  private mapApiFormatToServiceFormat(apiFormat: string): DateFormat {
    // Handle different API format variations
    const format = apiFormat?.toUpperCase();
    
    switch (format) {
      case 'YYYY-MM-DD':
        return 'yyyy-MM-dd';
      case 'MM/DD/YYYY':
        return 'MM/dd/yyyy';
      case 'DD/MM/YYYY':
        return 'dd/MM/yyyy';
      case 'DD-MMM-YYYY':
        return 'dd-MMM-yyyy';
      case 'MMM DD, YYYY':
        return 'MMM dd, yyyy';
      default:
        // If API format matches our format exactly, use it
        if (this.isValidDateFormat(apiFormat as DateFormat)) {
          return apiFormat as DateFormat;
        }
        return 'dd/MM/yyyy'; // Default fallback
    }
  }

  // Add this method to map service format to API format
  private mapServiceFormatToApiFormat(serviceFormat: DateFormat): string {
    switch (serviceFormat) {
      case 'yyyy-MM-dd':
        return 'YYYY-MM-DD';
      case 'MM/dd/yyyy':
        return 'MM/DD/YYYY';
      case 'dd/MM/yyyy':
        return 'DD/MM/YYYY';
      case 'dd-MMM-yyyy':
        return 'DD-MMM-YYYY';
      case 'MMM dd, yyyy':
        return 'MMM DD, YYYY';
      default:
        return 'DD/MM/YYYY';
    }
  }

  // Add this method to fetch from API
  getUserDateFormat(userId: string): Observable<any> {
    return this.http.get(`${environment.apidev}/Auth/get-date-format/${userId}`).pipe(
      map((response: any) => response),
      catchError(error => {
        console.error('Error fetching date format:', error);
        return throwError(() => error);
      })
    );
  }

  getDateFormatOptions(): { value: DateFormat; label: string; apiValue: string }[] {
    return [
      { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY', apiValue: 'DD/MM/YYYY' },
      { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY', apiValue: 'MM/DD/YYYY' },
      { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD', apiValue: 'YYYY-MM-DD' },
      { value: 'dd-MMM-yyyy', label: 'DD-MMM-YYYY', apiValue: 'DD-MMM-YYYY' },
      { value: 'MMM dd, yyyy', label: 'MMM DD, YYYY', apiValue: 'MMM DD, YYYY' }
    ];
  }

  // CORRECTED setDateFormat method - use currentFormat not _currentDateFormat
  setDateFormat(format: DateFormat): void {
    // Update the signal
    this.currentFormat.set(format);
    
    // Save to localStorage
    this.saveFormatToStorage(format);
    
    // Notify all subscribers
    this.dateFormatChanged.next();
    
    // Dispatch custom event for components that might be listening
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('dateFormatChanged', { 
        detail: { format } 
      });
      window.dispatchEvent(event);
    }
  }
  
  UpdateDateformat(data: any): Observable<any> {
    return this.http.put(`${environment.apidev}/Users/update-date-format`, data).pipe(
      tap((response: any) => {
        // After successful API update, update local format
        if (response && response.data && response.data.dateFormat) {
          const mappedFormat = this.mapApiFormatToServiceFormat(response.data.dateFormat);
          this.setDateFormat(mappedFormat);
        } else if (response && response.dateFormat) {
          const mappedFormat = this.mapApiFormatToServiceFormat(response.dateFormat);
          this.setDateFormat(mappedFormat);
        }
      }),
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error updating date format:', error);
        return throwError(() => error);
      })
    );
  }
  
  // Helper method for components to update format
  updateUserDateFormat(userId: string, format: DateFormat): Observable<any> {
    const apiFormat = this.mapServiceFormatToApiFormat(format);
    const data = {
      userId: userId,
      dateFormat: apiFormat
    };
    
    return this.UpdateDateformat(data);
  }
  
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    try {
      let dateObj: Date;
      
      if (typeof date === 'string') {
        // Handle different date string formats
        if (date.includes('T')) {
          // ISO format
          dateObj = new Date(date);
        } else if (date.includes('/')) {
          // Date with slashes
          const parts = date.split(/[/-]/);
          if (parts.length === 3) {
            const currentFormat = this.currentFormat();
            if (currentFormat === 'dd/MM/yyyy' || currentFormat === 'MM/dd/yyyy') {
              // Handle based on current format
              const [first, second, third] = parts;
              if (currentFormat === 'dd/MM/yyyy') {
                // day/month/year
                dateObj = new Date(parseInt(third), parseInt(second) - 1, parseInt(first));
              } else {
                // month/day/year
                dateObj = new Date(parseInt(third), parseInt(first) - 1, parseInt(second));
              }
            } else {
              dateObj = new Date(date);
            }
          } else {
            dateObj = new Date(date);
          }
        } else {
          dateObj = new Date(date);
        }
      } else {
        dateObj = date;
      }
      
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date provided:', date);
        return String(date);
      }
      
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[dateObj.getMonth()];

      switch (this.currentFormat()) {
        case 'dd/MM/yyyy':
          return `${day}/${month}/${year}`;
        case 'MM/dd/yyyy':
          return `${month}/${day}/${year}`;
        case 'yyyy-MM-dd':
          return `${year}-${month}-${day}`;
        case 'dd-MMM-yyyy':
          return `${day}-${monthName}-${year}`;
        case 'MMM dd, yyyy':
          return `${monthName} ${day}, ${year}`;
        default:
          return `${day}/${month}/${year}`;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return String(date);
    }
  }

  getCurrentFormat(): DateFormat {
    return this.currentFormat();
  }

  private loadSavedFormat(): void {
    try {
      const savedFormat = localStorage.getItem(this.STORAGE_KEY) as DateFormat;
      if (savedFormat && this.isValidDateFormat(savedFormat)) {
        this.currentFormat.set(savedFormat);
      }
    } catch (error) {
      console.warn('Failed to load saved date format:', error);
    }
  }

  private saveFormatToStorage(format: DateFormat): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, format);
    } catch (error) {
      console.warn('Failed to save date format:', error);
    }
  }

  private isValidDateFormat(format: string): format is DateFormat {
    const validFormats: DateFormat[] = [
      'dd/MM/yyyy', 
      'MM/dd/yyyy', 
      'yyyy-MM-dd', 
      'dd-MMM-yyyy', 
      'MMM dd, yyyy'
    ];
    return validFormats.includes(format as DateFormat);
  }
}