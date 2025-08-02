import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { AuthGuard } from '../service/auth-guard/auth-guard.guard';
import { AvailabilityComponent } from './Availability/availability/availability.component';
import { TherapistsComponent } from './therapists/therapists.component';
import { PatientsComponent } from './patients/patients.component';
import { SettingsComponent } from './settings/settings.component';
import { ProfileComponent } from './profile/profile.component';
import { QuicksbooksConnectionComponent } from './quicksbooks-connection/quicksbooks-connection.component';
import { AddPatientsComponent } from './add-patients/add-patients.component';
import {ManageDropdownsComponent} from '../admin/manage-dropdowns/manage-dropdowns/manage-dropdowns.component'
import { CalendarSchedulerComponent } from './scheduler/calendar-scheduler/calendar-scheduler.component';
import { UsersComponent } from './users/users.component';
import { ListPatientsComponent } from './list-patients/list-patients/list-patients.component';
import { AddClientsComponent } from './client/add-client/add-clients.component';
import { ListPatientAssessmentsComponent } from './patient-assessments/list-patient-assessments/list-patient-assessments.component';
import { AssessmentVersionsComponent } from './patient-assessments/assessment-versions/assessment-versions.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { InsuranceClaimsComponent } from './insurances/insurance-claims/insurance-claims.component';
import { InsuranceEraeobComponent } from './insurances/insurance-eraeob/insurance-eraeob.component';
import { PaymentsComponent } from './Billing/payments/payments.component';
import { InvoiceComponent } from './Billing/invoice/invoice.component';
import { InvoiceDetailsComponent } from './Billing/invoice/invoice-details/invoice-details.component';
import { SuperbillsComponent } from './superbills/superbills.component';
import { SlidingscaleComponent } from './slidingscale/slidingscale.component';


const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] ,  data: { breadcrumb: null, showBreadcrumb: false }
},

      // Users
      { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },

      // Patients
      { path: 'patients/list-patients', component: ListPatientsComponent, canActivate: [AuthGuard] },
      { path: 'patients/add-patients', component: AddPatientsComponent, canActivate: [AuthGuard] },
      { path: 'patients/add-patients/:id', component: AddPatientsComponent, canActivate: [AuthGuard] },
      { path: 'patients/patient-assessments', component: ListPatientAssessmentsComponent, canActivate: [AuthGuard] },
      { path: 'patients/assessment/:id', component: PatientsComponent },
      { path: 'patients/patient-assessments/assessment-versions/:patientId', component: AssessmentVersionsComponent, canActivate: [AuthGuard] },

      // Appointments
      { path: 'appointments/availability', component: AvailabilityComponent, canActivate: [AuthGuard] },
      { path: 'appointments/add', component: CalendarSchedulerComponent, canActivate: [AuthGuard] },

      // Transactions
      { path: 'transactions', component: TransactionsComponent, canActivate: [AuthGuard] },

      // Insurance & Claims
      { path: 'insurance/claims', component: InsuranceClaimsComponent, canActivate: [AuthGuard] },
      { path: 'insurance/eraeob', component: InsuranceEraeobComponent, canActivate: [AuthGuard] },

      // Billing & Payments
      { path: 'billing/payments', component: PaymentsComponent, canActivate: [AuthGuard] },
      { path: 'billing/invoices', component: InvoiceComponent, canActivate: [AuthGuard] },
      { path: 'billing/invoice-details/patient/:patientId', component: InvoiceDetailsComponent, canActivate: [AuthGuard] },

      // Superbills
      { path: 'superbills', component: SuperbillsComponent, canActivate: [AuthGuard] },

      // Sliding Scale
      { path: 'slidingscale', component: SlidingscaleComponent, canActivate: [AuthGuard] },

      // Settings
      { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
      { path: 'settings/dropdowns', component: ManageDropdownsComponent, canActivate: [AuthGuard] },

      // Misc
      { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
      { path: 'quicks-books', component: QuicksbooksConnectionComponent, canActivate: [AuthGuard] },
      { path: 'clients/add', component: AddClientsComponent, canActivate: [AuthGuard] },
    ]
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
