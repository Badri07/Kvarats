import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientsRoutingModule } from './patients-routing.module';
import { LandingPageComponent } from './landingPage/landing-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BaseChartDirective } from 'ng2-charts';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PatientAppointmentComponent } from './patient-appointment/patient-appointment.component';
import { PaymentsComponent } from './payments/payments.component';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
import { AgGridModule } from 'ag-grid-angular';
@NgModule({
  declarations: [
    LandingPageComponent,
    DashboardComponent,
    PatientAppointmentComponent,
    PaymentsComponent
  ],
  imports: [
    CommonModule,
    PatientsRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    BaseChartDirective,
    AgGridModule
    
  ]
})
export class PatientsModule { }
