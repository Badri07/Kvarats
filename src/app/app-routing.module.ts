import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SuccessComponent } from './success/success.component';

const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'success', component: SuccessComponent },
  {path:'',loadChildren:()=>import('./auth/admin/auth.module').then((mod)=>mod.AuthModule)},
  {path:'',loadChildren:()=>import('./admin/admin.module').then((mod)=>mod.AdminModule)},
  {path:'',loadChildren:()=>import('./patients/patients.module').then((mod)=>mod.PatientsModule)},
  {path:'',loadChildren:()=>import('./auth/patients/patients-auth.module').then((mod)=>mod.PatientsAuthModule)
    
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled', 
      anchorScrolling: 'enabled',
      scrollOffset: [0, 0]
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
