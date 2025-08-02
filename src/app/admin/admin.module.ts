import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { AvailabilityComponent } from './Availability/availability/availability.component';
import { CalendarComponent } from './calendar/calendar.component';
import { UsersComponent } from './users/users.component';
import { TherapistsComponent } from './therapists/therapists.component';
import { PatientsComponent } from './patients/patients.component';
import { ProfileComponent } from './profile/profile.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuicksbooksConnectionComponent } from './quicksbooks-connection/quicksbooks-connection.component';
import { AddPatientsComponent } from './add-patients/add-patients.component';
import { ListPatientsComponent } from './list-patients/list-patients/list-patients.component';
import { SchedulerModule } from '../shared/scheduler/scheduler.module';
import { MaterialModule } from '../shared/material/material.module';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
import { AgGridModule } from 'ag-grid-angular';
import { AddClientsComponent } from './client/add-client/add-clients.component';
import { ListClientsComponent } from './client/list-clients/list-clients.component';
import { ClientsSettingsComponent } from './client/clients-settings/clients-settings.component';
import { AssessmentVersionsComponent } from './patient-assessments/assessment-versions/assessment-versions.component';
import { ListPatientAssessmentsComponent } from './patient-assessments/list-patient-assessments/list-patient-assessments.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { InsuranceClaimsComponent } from './insurances/insurance-claims/insurance-claims.component';
import { InsuranceEraeobComponent } from './insurances/insurance-eraeob/insurance-eraeob.component';
import { PaymentsComponent } from './Billing/payments/payments.component';
import { InvoiceComponent } from './Billing/invoice/invoice.component';
import { InvoiceDetailsComponent } from './Billing/invoice/invoice-details/invoice-details.component';
import { SuperbillsComponent } from './superbills/superbills.component';
import { SlidingscaleComponent } from './slidingscale/slidingscale.component';
import { BaseChartDirective } from 'ng2-charts';
import { SettingModule } from '../shared/settings/settings.module';
@NgModule({
  declarations: [
    DashboardComponent,
    AvailabilityComponent,
    CalendarComponent,
    UsersComponent,
    TherapistsComponent,
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
    PaymentsComponent, 
    InvoiceComponent, 
    SuperbillsComponent, 
    SlidingscaleComponent,
    

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
BaseChartDirective, FormsModule

  ]
})
export class AdminModule { }
