import { NgModule } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { AvailabilityComponent } from './Availability/availability/availability.component';
import { CalendarComponent } from './calendar/calendar.component';
import { UsersComponent } from './users/users.component';
import { PatientsComponent } from './patients-layouts/patients/patients.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuicksbooksConnectionComponent } from './quicksbooks-connection/quicksbooks-connection.component';
import { AddPatientsComponent } from './patients-layouts/add-patients/add-patients.component';
import { ListPatientsComponent } from './patients-layouts/list-patients/list-patients/list-patients.component';
import { SchedulerModule } from '../shared/scheduler/scheduler.module';
import { MaterialModule } from '../shared/material/material.module';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
import { AgGridModule } from 'ag-grid-angular';
import { AddClientsComponent } from './client/add-client/add-clients.component';
import { ListClientsComponent } from './client/list-clients/list-clients.component';
import { ClientsSettingsComponent } from './client/clients-settings/clients-settings.component';
import { AssessmentVersionsComponent } from './patients-layouts/patient-assessments/assessment-versions/assessment-versions.component';
import { ListPatientAssessmentsComponent } from './patients-layouts/patient-assessments/list-patient-assessments/list-patient-assessments.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { InsuranceClaimsComponent } from './insurances/insurance-claims/insurance-claims.component';
import { InsuranceEraeobComponent } from './insurances/insurance-eraeob/insurance-eraeob.component';


import { InvoiceComponent } from './Billing/invoice/invoice.component';
import { InvoiceDetailsComponent } from './Billing/invoice/invoice-details/invoice-details.component';
import { SuperbillsComponent } from './superbills/superbills.component';
import { SlidingscaleComponent } from './slidingscale/slidingscale.component';
import { BaseChartDirective } from 'ng2-charts';
import { SettingModule } from '../shared/settings/settings.module';
import { CommonAgGridComponent } from '../shared/common-ag-grid/common-ag-grid.component';
import { PatientInsurancesComponent } from '../admin/patients-layouts/patient-insurances/patient-insurances.component';
import { MenuManagementComponent } from './menu-management/menu-management.component';
import { MenuListComponent } from './menu-management/menu-list/menu-list.component';
import { MenuModalComponent } from './menu-management/menu-modal/menu-modal.component';
import { ClientMenuAccessComponent } from './menu-management/client-menu-access/client-menu-access.component';
import { AppointmentListComponent } from './appointment-list/appointment-list.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { PatientsViewComponent } from './patients-layouts/patients-view/patients-view.component';
import { ServiceManagementComponent } from './service-management/service-management.component';
import { ButtonComponent } from '../shared/button/button.component';
import { ModalComponent } from '../shared/modal/modal.component';
import { ScheduleDashboardComponent } from './schedule/schedule-dashboard/schedule-dashboard.component';
import { LeavesComponent } from './schedule/leaves/leaves.component';
import { AvailabilitySettingComponent } from './schedule/availability/availability.component';
import { CommonPaginationComponent } from '../shared/common-pagination/common-pagination.component';
import { ClaimsComponent } from './insurances/Component/claims/claims.component';
import { EraDetailComponent } from './insurances/Component/era-detail/era-detail.component';
import { EobListComponent } from './insurances/Component/eob-list/eob-list.component';
import { EobDetailComponent } from './insurances/Component/eob-detail/eob-detail.component';
import { SuperbillListComponent } from './insurances/Component/superbill-list/superbill-list.component';
import { SuperbillFormComponent } from './insurances/Component/superbill-form/superbill-form.component';
import { InsuranceListComponent } from './insurances/Component/insurance-list/insurance-list.component';
import { InsuranceFormComponent } from './insurances/Component/insurance-form/insurance-form.component';
import { EraUploadComponent } from './insurances/Component/era-upload/era-upload.component';
import { InsuranceDashboardComponent } from './insurances/Component/insurance-dashboard/insurance-dashboard.component';
import { EligibilityCheckComponent } from './insurances/Component/eligibility-check/eligibility-check.component';
import { EraListComponent } from './insurances/Component/era-list/era-list.component';
import { SoapNoteComponent } from './notes/note-editor/note-editor.component';
import { NoteViewerComponent } from './notes/note-viewer/note-viewer.component';
import { NotesDashboardComponent } from './notes/notes-dashboard/notes-dashboard.component';
import { NotesListComponent } from './notes/notes-list/notes-list.component';
import { ClaimFormComponent } from './insurances/Component/claim-form/claim-form.component';
import { RoleManagementComponent } from './roles-management/roles-management.component';
import { DropdownValuesComponent } from './manage-dropdowns/dropdown-values/dropdown-values.component';
import { CategoryListComponent } from './manage-dropdowns/category-list/category-list.component';
import { ProfileComponent } from './profile/profile.component';
import { InitialAssessmentComponent } from './notes/components/initial-assessment/initial-assessment.component';
import { SoapNotesComponent } from './notes/components/soap-notes/soap-notes.component';
import { DapNotesComponent } from './notes/components/dap-notes/dap-notes.component';
import { PatientListComponent } from './notes/components/patient-list/patient-list.component';
import { CrisisNotesComponent } from './notes/components/crisis-notes/crisis-notes.component';
import { TreatmentPlansComponent } from './notes/components/treatment-plans/treatment-plans.component';
import { DischargeSummaryComponent } from './notes/components/discharge-summary/discharge-summary.component';
import { ProgressNotesComponent } from './notes/components/progress-notes/progress-notes.component';
import { PaymentRequestsListComponent } from './Billing/components/payment-requests-list/payment-requests-list.component';
import { PaymentRequestFormComponent } from './Billing/components/payment-request-form/payment-request-form.component';
import { PaymentRequestInvoiceViewComponent } from './Billing/components/payment-request-invoice-view/payment-request-invoice-view.component';


@NgModule({
  declarations: [
    DashboardComponent,
    AvailabilityComponent,
    CalendarComponent,
    UsersComponent,
    ProfileComponent,
    QuicksbooksConnectionComponent,
    AddPatientsComponent,
    ListPatientsComponent,
    AddClientsComponent,
    InvoiceDetailsComponent,
    ListClientsComponent,
    ClientsSettingsComponent,
    AssessmentVersionsComponent,
    ListPatientAssessmentsComponent,
    PatientsComponent, 
    TransactionsComponent, 
    InsuranceClaimsComponent, 
    InsuranceEraeobComponent, 
  PaymentRequestsListComponent,
  PaymentRequestFormComponent,
    InvoiceComponent, 
    SuperbillsComponent, 
    SlidingscaleComponent,
    CommonAgGridComponent,
    PatientInsurancesComponent,
    MenuManagementComponent,
    MenuListComponent,
    MenuModalComponent,
    ClientMenuAccessComponent,
    AppointmentListComponent,
    PatientsViewComponent,
    ServiceManagementComponent,
    ScheduleDashboardComponent,
    LeavesComponent,
    AvailabilitySettingComponent,
    CommonPaginationComponent,
    ClaimsComponent,
    EraDetailComponent,
    EobListComponent,
    EobDetailComponent,
    SuperbillListComponent,
    SuperbillFormComponent,
    InsuranceListComponent,
    InsuranceFormComponent,
    EraUploadComponent,
    InsuranceDashboardComponent,
    EligibilityCheckComponent,
    EraListComponent,
    ClaimFormComponent,
    SoapNoteComponent,
    NoteViewerComponent,
    NotesDashboardComponent,
    NotesListComponent,
    RoleManagementComponent,
    DropdownValuesComponent,
    CategoryListComponent,
    InitialAssessmentComponent,
    SoapNotesComponent,
    DapNotesComponent,
    InitialAssessmentComponent,
    PatientListComponent,
    CrisisNotesComponent,
    DischargeSummaryComponent,
    ProgressNotesComponent,
    TreatmentPlansComponent,
    PaymentRequestInvoiceViewComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SchedulerModule,
    SettingModule,
    MaterialModule,
    AgGridModule,
    BaseChartDirective,
    FormsModule,
    NgSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    
  ]
})
export class AdminModule { }
