import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from '../admin/register/register.component';
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component';
import { LandingPageComponent } from '../../patients/landingPage/landing-page.component';
import { VerificationPendingComponent } from './verification-pending/verification-pending.component';
import { PatientLandingPageComponent } from '../../patients/patient-landing-page/patient-landing-page.component';

const routes: Routes = [
{path:'login',component:LoginComponent},
{path:'register',component:RegisterComponent},
{path:'forgot-password',component:ForgotpasswordComponent},
{path:'landing-page',component:LandingPageComponent},
{ path:'patient-landing', component: PatientLandingPageComponent},
{path:'verification-pending',component:VerificationPendingComponent},
{ path: '', redirectTo: 'landing-page', pathMatch: 'full' },
];

@NgModule({

  imports: [
    CommonModule,
    RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
