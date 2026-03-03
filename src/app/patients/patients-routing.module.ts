import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PatientsComponent } from './patients.component';
import { PatientsDashboardComponent } from '../patients/dashboard/dashboard.component';
import { PatientAppointmentComponent } from './patient-appointment/patient-appointment.component';
import { PatientAuthGuard } from '../service/auth-guard/patient-auth.guard';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { PatientsNotesComponent } from './notes/patients-notes/patients-notes.component';
import { PaymentRequestsListComponent } from './components/payment-requests-list/payment-requests-list.component';
import { PaymentDetailComponent } from './components/payment-detail/payment-detail.component';
import { NotesListComponent } from './notes/notes-list/notes-list.component';

const routes: Routes = [
    {
      path: 'patient',
      component: PatientsComponent,
      children: [
        { path: 'dashboard', component: PatientsDashboardComponent, canActivate: [PatientAuthGuard]},
        
        { path: 'patients-appointments', component: PatientAppointmentComponent, canActivate: [PatientAuthGuard]},
        { path: 'notes', component: NotesListComponent, canActivate: [PatientAuthGuard]},
        { path: 'payment', component: PaymentRequestsListComponent, canActivate: [PatientAuthGuard]},
        { path: 'payment-request/:id', component: PaymentDetailComponent, canActivate: [PatientAuthGuard]},
        { path: 'file-upload', component: FileUploadComponent, canActivate: [PatientAuthGuard]},
      ]
    },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientsRoutingModule { }
