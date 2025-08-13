import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from '../admin/admin.component';
import { LandingPageComponent } from './landingPage/landing-page.component';
import { PatientsComponent } from './patients.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PatientAppointmentComponent } from './patient-appointment/patient-appointment.component';
import { PatientAuthGuard } from '../service/auth-guard/patient-auth.guard';
import { PaymentsComponent } from './payments/payments.component';

const routes: Routes = [
    {
      path: 'patient',
      component: PatientsComponent,
      children: [
        { path: 'dashboard', component: DashboardComponent, canActivate: [PatientAuthGuard]},
        { path: 'patients-appointments', component: PatientAppointmentComponent, canActivate: [PatientAuthGuard]},
        { path: 'payment', component: PaymentsComponent, canActivate: [PatientAuthGuard]},
      ]
    },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientsRoutingModule { }
