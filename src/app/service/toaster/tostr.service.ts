import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class TosterService {

 constructor(private toastr: ToastrService) {}


success(message: string) {
    this.toastr.success(message, '', {
      toastClass: 'ngx-toastr custom-toastr', 
      closeButton: false,
      progressBar: true,
      timeOut: 3000,
      enableHtml: true
    });
  }
 
  error(message: string) {
    this.toastr.error(message, '', {
      toastClass: 'ngx-toastr custom-toastr-error', 
      closeButton: false,
      progressBar: true,
      timeOut: 3000,
      enableHtml: true
    });
  }
 
  info(message: string) {
    this.toastr.info(message, '', {
      toastClass: 'ngx-toastr custom-toastr',
      closeButton: false,
      progressBar: true,
      timeOut: 3000,
      enableHtml: true
    });
  }
 
  warning(message: string) {
    this.toastr.warning(message, '', {
      toastClass: 'ngx-toastr custom-toastr',
      closeButton: false,
      progressBar: true,
      timeOut: 3000,
      enableHtml: true
    });
  }
}
