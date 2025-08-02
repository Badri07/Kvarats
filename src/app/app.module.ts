import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './auth/admin/login/login.component';
import { RegisterComponent } from './auth/admin/register/register.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {  provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { AdminComponent } from './admin/admin.component';
// import { authInterceptor } from './interceptors/auth.interceptor';
import { timeoutInterceptor } from './interceptors/timeout.interceptor';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from './shared/loader/loader.component';
import { authInterceptor } from './interceptors/auth.interceptor';
import { MenusComponent } from './shared/menu/menus.component';
import { BreadcrumbComponent } from './shared/breadcrumb/breadcrumb.component';
import { PatientLoginComponent } from './auth/patients/patient-login/patient-login.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    AdminComponent,
   LoaderComponent,
   MenusComponent,
   BreadcrumbComponent,
   PatientLoginComponent

  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    ToastrModule.forRoot({
  timeOut: 3000,
  positionClass: 'toast-top-right',
  preventDuplicates: true,
  closeButton: false,
  progressBar: true,
  toastClass: 'custom-toastr', // default (success)
  iconClasses: {
    error: 'custom-toastr-error',
    success: 'custom-toastr',
    info: 'custom-toastr',       // Optional: reuse same style
    warning: 'custom-toastr',    // Optional: reuse same style
  }
}),
  ],
  providers:[

provideHttpClient(
      withInterceptors([
  timeoutInterceptor,
        authInterceptor
      ])
    )  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
