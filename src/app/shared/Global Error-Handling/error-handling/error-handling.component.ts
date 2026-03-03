import { Component, inject } from '@angular/core';
import { ErrorInfo, ErrorService } from '../../../service/Global-Error-Handling/Error.service';
import { PopupService } from '../../../service/popup/popup-service';
import { ToastRef } from 'ngx-toastr';
import { TosterService } from '../../../service/toaster/tostr.service';

@Component({
  selector: 'app-error-handling',
  standalone: false,
  templateUrl: './error-handling.component.html',
  styleUrl: './error-handling.component.scss'
})
export class ErrorHandlingComponent {

 isVisible = false;
  errorInfo: ErrorInfo = { message: '', timestamp: new Date(), status: 0 };

  constructor(private errorService: ErrorService) {
    this.errorService.showErrorModal$.subscribe(show => {
      this.isVisible = show;
    });

    this.errorService.errorInfo$.subscribe(info => {
      this.errorInfo = info;
    });
  }

  closeErrorModal() {
    this.errorService.hideError();
  }

  public _toastr = inject(TosterService);
  private _loader = inject(PopupService);

 sendErrorReport() {
  this._loader.show();
    const errorReport = {
      message: this.errorInfo.message,
      status: this.errorInfo.status,
      timestamp: this.errorInfo.timestamp,
      url: this.errorInfo.url || window.location.href,
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      reportTimestamp: new Date().toISOString()
    };
    // console.log("Error Report Payload:", errorReport);
    this.errorService.NotificationsSendAlertMail(errorReport).subscribe({
      next: (res:any) => {
        console.log('Error report sent successfully:', res);
        this._loader.hide();
        this._toastr.success('Alert email sent successfully');
        this.closeErrorModal();
        this.isVisible = false;
      },
      error: (err) => {
        console.error('Failed to send error report:', err);
        // this.showErrorNotification();
        this._loader.hide();
        this.closeErrorModal();
         this.isVisible = false;
      },
      complete: () => {
                this._loader.hide();
   this.isVisible = false;
        console.log('Error report API call completed');
      }
    });
  }

  private sendErrorToAPI(errorReport: any) {
    // Here you would typically send to your backend API
    console.log("Sending to API:", errorReport);
    
    // Example with HttpClient (uncomment when ready)
    // return this.http.post('/api/error-reports', errorReport).subscribe({
    //   next: (response) => {
    //     console.log('Error report sent successfully');
    //     this.closeErrorModal();
    //   },
    //   error: (err) => {
    //     console.error('Failed to send error report:', err);
    //   }
    // });

    // For now, just log and close modal
    this.closeErrorModal();
  }
}
