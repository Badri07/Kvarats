import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PatientLoginComponent } from './patient-login/patient-login.component';
import { PatientAuthGuard } from '../../service/auth-guard/patient-auth.guard';
import { PatientsRegistrationComponent } from './patients-registration/patients-registration.component';


const routes: Routes = [
{path:'patient/login',component:PatientLoginComponent},
{path:'patient/registration',component:PatientsRegistrationComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientsAuthRoutingModule { }
