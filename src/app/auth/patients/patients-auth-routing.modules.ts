import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PatientLoginComponent } from './patient-login/patient-login.component';
import { PatientAuthGuard } from '../../service/auth-guard/patient-auth.guard';


const routes: Routes = [
{path:'patient/login',component:PatientLoginComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientsAuthRoutingModule { }
