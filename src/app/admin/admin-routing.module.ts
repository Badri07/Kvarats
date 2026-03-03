import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { AuthGuard } from '../service/auth-guard/auth-guard.guard';
import { PatientsComponent } from './patients-layouts/patients/patients.component';
import { SettingsComponent } from './settings/settings.component';
import { ProfileComponent } from './profile/profile.component';
import { QuicksbooksConnectionComponent } from './quicksbooks-connection/quicksbooks-connection.component';
import { AddPatientsComponent } from './patients-layouts/add-patients/add-patients.component';
import {ManageDropdownsComponent} from '../admin/manage-dropdowns/manage-dropdowns/manage-dropdowns.component'
import { CalendarSchedulerComponent } from './scheduler/calendar-scheduler/calendar-scheduler.component';
import { UsersComponent } from './users/users.component';
import { ListPatientsComponent } from './patients-layouts/list-patients/list-patients/list-patients.component';
import { AddClientsComponent } from './client/add-client/add-clients.component';
import { ListPatientAssessmentsComponent } from './patients-layouts/patient-assessments/list-patient-assessments/list-patient-assessments.component';
import { AssessmentVersionsComponent } from './patients-layouts/patient-assessments/assessment-versions/assessment-versions.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { InvoiceComponent } from './Billing/invoice/invoice.component';
import { InvoiceDetailsComponent } from './Billing/invoice/invoice-details/invoice-details.component';
import { SuperbillsComponent } from './superbills/superbills.component';
import { SlidingscaleComponent } from './slidingscale/slidingscale.component';
import { PatientInsurancesComponent } from './patients-layouts/patient-insurances/patient-insurances.component';
import { ClientMenuAccessComponent } from './menu-management/client-menu-access/client-menu-access.component';
import { AppointmentListComponent } from './appointment-list/appointment-list.component';
import { ServiceManagementComponent } from './service-management/service-management.component';
import { AvailabilitySettingComponent } from './schedule/availability/availability.component';
import { LeavesComponent } from './schedule/leaves/leaves.component';
import { ScheduleDashboardComponent } from './schedule/schedule-dashboard/schedule-dashboard.component';
import { InsuranceDashboardComponent } from './insurances/Component/insurance-dashboard/insurance-dashboard.component';
import { EligibilityCheckComponent } from './insurances/Component/eligibility-check/eligibility-check.component';
import { SuperbillFormComponent } from './insurances/Component/superbill-form/superbill-form.component';
import { InsuranceFormComponent } from './insurances/Component/insurance-form/insurance-form.component';
import { EraUploadComponent } from './insurances/Component/era-upload/era-upload.component';
import { EraListComponent } from './insurances/Component/era-list/era-list.component';
import { EobListComponent } from './insurances/Component/eob-list/eob-list.component';
import { SuperbillListComponent } from './insurances/Component/superbill-list/superbill-list.component';
import { InsuranceListComponent } from './insurances/Component/insurance-list/insurance-list.component';
import { ClaimsComponent } from './insurances/Component/claims/claims.component';
import { SoapNoteComponent } from './notes/note-editor/note-editor.component';
import { NotesDashboardComponent } from './notes/notes-dashboard/notes-dashboard.component';
import { NotesListComponent } from './notes/notes-list/notes-list.component';
import { NoteViewerComponent } from './notes/note-viewer/note-viewer.component';
import { ClaimFormComponent } from './insurances/Component/claim-form/claim-form.component';
import { EraDetailComponent } from './insurances/Component/era-detail/era-detail.component';
import { RoleManagementComponent } from './roles-management/roles-management.component';
import { CategoryListComponent } from './manage-dropdowns/category-list/category-list.component';
import { DropdownValuesComponent } from './manage-dropdowns/dropdown-values/dropdown-values.component';
import { PaymentRequestFormComponent } from './Billing/components/payment-request-form/payment-request-form.component';
import { PaymentRequestsListComponent } from './Billing/components/payment-requests-list/payment-requests-list.component';
import { PaymentRequestInvoiceViewComponent } from './Billing/components/payment-request-invoice-view/payment-request-invoice-view.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [AuthGuard],  
        data: { breadcrumb: null, showBreadcrumb: false }
      },

      { path: 'users', component: UsersComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] }},
      { path: 'service-management', component: ServiceManagementComponent, canActivate: [AuthGuard], data: { roles: ['SuperAdmin'] }  },
      { path: 'roles', component: RoleManagementComponent, canActivate: [AuthGuard],data: { roles: ['SuperAdmin']} },

      {
        path: 'patients',
        children: [
          { path: 'list-patients', component: ListPatientsComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'add-patients', component: AddPatientsComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'add-patients/:id', component: AddPatientsComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'patient-assessments', component: ListPatientAssessmentsComponent, canActivate: [AuthGuard] , data: { roles: ['Admin', 'Therapist'] }},
          { path: 'assessment/:patientId/:id', component: PatientsComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'assessment', component: PatientsComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'patient-assessments/assessment-versions/:patientId', component: AssessmentVersionsComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'insurances', component: PatientInsurancesComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
        ]
      },

      {
        path: 'appointments',
        children: [
          { path: 'availability/availabilitySetting', component: AvailabilitySettingComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'availability/leave', component: LeavesComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'availability', component: ScheduleDashboardComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'add', component: CalendarSchedulerComponent, canActivate: [AuthGuard] , data: { roles: ['Admin', 'Therapist'] }},
          { path: 'list', component: AppointmentListComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
        ]
      },

      { path: 'transactions', component: TransactionsComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },

      {
        path: 'notes',
        children: [
          { path: 'new', component: SoapNoteComponent, canActivate: [AuthGuard] , data: { roles: ['Admin', 'Therapist'] }},
          { path: '', component: NotesListComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'viewer', component: NoteViewerComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'noteslist', component: NotesListComponent, canActivate: [AuthGuard] , data: { roles: ['Admin', 'Therapist'] }},
        ]
      },
      {
        path: 'insurance',
        children: [
          { path: '', redirectTo: 'claims', pathMatch: 'full' },
          { path: 'claims', component: InsuranceDashboardComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
          { path: 'eraeob', component: EraDetailComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
          { path: 'list', component: InsuranceListComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
          { path: 'eligibility/check', component: EligibilityCheckComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
          { path: 'superbills/new', component: SuperbillFormComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
          { path: 'new', component: InsuranceFormComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
          { path: 'era', component: EraListComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
          { path: 'eob', component: EobListComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
          { path: 'superbills', component: SuperbillListComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
          { path: 'Insurance/new', component: ClaimFormComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
          { path: 'newclaims', component: ClaimsComponent, canActivate: [AuthGuard] , data: { roles: ['Admin'] }},
          { path: 'era/upload', component: EraUploadComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
        ]
      },

      {
        path: 'billing',
        children: [
          { path: 'payments', component: PaymentRequestsListComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'payment-requests/new', component: PaymentRequestFormComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'payment-requests/:id', component: PaymentRequestFormComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'payment-requests/:id/edit', component: PaymentRequestFormComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'invoices', component: InvoiceComponent, canActivate: [AuthGuard] , data: { roles: ['Admin'] }},
          { path: 'invoice-details/patient/:patientId', component: InvoiceDetailsComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },
          { path: 'payment-requests/:id/view',component: PaymentRequestInvoiceViewComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] }}
        ]
      },

      { path: 'superbills', component: SuperbillsComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },

      { path: 'slidingscale', component: SlidingscaleComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist'] } },

      {
        path: 'settings',
        children: [
          { path: '', component: SettingsComponent, canActivate: [AuthGuard],data: { roles: ['SuperAdmin'] }  },
          { path: 'dropdowns', component: ManageDropdownsComponent, canActivate: [AuthGuard] ,data: { roles: ['SuperAdmin'] } },
          { path: 'dropdowns/categoryList', component: CategoryListComponent, canActivate: [AuthGuard] ,data: { roles: ['SuperAdmin'] } },
          { path: 'dropdowns/dropdownsValues', component: DropdownValuesComponent, canActivate: [AuthGuard] ,data: { roles: ['SuperAdmin'] } },
        ]
      },

      { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], data: { roles: ['Admin', 'Therapist','SuperAdmin'] } },
      { path: 'quicks-books', component: QuicksbooksConnectionComponent, canActivate: [AuthGuard], data: { roles: ['Admin','Therapist'] } },
      { path: 'clients', component: AddClientsComponent, canActivate: [AuthGuard],data: { roles: ['SuperAdmin'] } },
      {
        path: 'menu-management',
        children: [
          { path: 'client-menu-access', component: ClientMenuAccessComponent, canActivate: [AuthGuard],data: { roles: ['SuperAdmin'] }  }
        ]
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class AdminRoutingModule { }