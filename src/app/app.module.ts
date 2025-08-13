import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgSelectModule } from '@ng-select/ng-select';
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
import { PatientsComponent } from './patients/patients.component';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SuccessComponent } from './success/success.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    AdminComponent,
    PatientsComponent,
   LoaderComponent,
   MenusComponent,
   BreadcrumbComponent,
   PatientLoginComponent,
   AuthComponent,
   DashboardComponent,
   SuccessComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    ToastrModule.forRoot({
  timeOut: 3000,
  positionClass: 'toast-top-right',
  preventDuplicates: true,
  closeButton: false,
  progressBar: true,
  toastClass: 'custom-toastr', 
  iconClasses: {
    error: 'custom-toastr-error',
    success: 'custom-toastr',
    info: 'custom-toastr',       
    warning: 'custom-toastr',    
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
