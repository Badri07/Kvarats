import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientsRoutingModule } from './patients-routing.module';
import { LandingPageComponent } from './landingPage/landing-page.component';
import { PatientsDashboardComponent } from '../patients/dashboard/dashboard.component';
import { BaseChartDirective } from 'ng2-charts';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PatientAppointmentComponent } from './patient-appointment/patient-appointment.component';
import { PaymentsComponent } from './payments/payments.component';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { PaymentCardComponent } from './payment-card/payment-card.component';
import { PaymentPopupComponent } from './payment-popup/payment-popup.component';
ModuleRegistry.registerModules([AllCommunityModule]);
import { AgGridModule } from 'ag-grid-angular';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { PatientsNotesComponent } from './notes/patients-notes/patients-notes.component';
import { PaymentRequestsListComponent } from './components/payment-requests-list/payment-requests-list.component';
import { PaymentDetailComponent } from './components/payment-detail/payment-detail.component';
import { PatientLandingPageComponent } from './patient-landing-page/patient-landing-page.component';
import { NotesListComponent } from './notes/notes-list/notes-list.component';
import { SoapNotesComponent } from './notes/components/soap-notes/soap-notes.component';
import { DapNotesComponent } from './notes/components/dap-notes/dap-notes.component';
import { CrisisNotesComponent } from './notes/components/crisis-notes/crisis-notes.component';
import { TreatmentPlansComponent } from './notes/components/treatment-plans/treatment-plans.component';
import { ProgressNotesComponent } from './notes/components/progress-notes/progress-notes.component';
import { DischargeSummaryComponent } from './notes/components/discharge-summary/discharge-summary.component';
import { SchedulerModule } from '../shared/scheduler/scheduler.module';
import { InitialAssessmentComponent } from './notes/components/initial-assessment/initial-assessment.component';

@NgModule({
  declarations: [
    LandingPageComponent,
    PatientLandingPageComponent,
    PatientsDashboardComponent,
    PatientAppointmentComponent,
    PaymentsComponent,
    PaymentCardComponent,
    PaymentPopupComponent,
    FileUploadComponent,
    PatientsNotesComponent,
    PaymentRequestsListComponent,
    PaymentDetailComponent,
    NotesListComponent,
    SoapNotesComponent,
    DapNotesComponent,
    CrisisNotesComponent,
    TreatmentPlansComponent,
    ProgressNotesComponent,
    DischargeSummaryComponent,
    InitialAssessmentComponent
  ],
  imports: [
    CommonModule,
    PatientsRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    BaseChartDirective,
    AgGridModule,
    SchedulerModule
  ],  
  
})
export class PatientsModule { }
