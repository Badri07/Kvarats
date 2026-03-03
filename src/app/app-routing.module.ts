import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path:'',loadChildren:()=>import('./auth/admin/auth.module').then((mod)=>mod.AuthModule)},
  {path:'',loadChildren:()=>import('./admin/admin.module').then((mod)=>mod.AdminModule)},
  {path:'',loadChildren:()=>import('./patients/patients.module').then((mod)=>mod.PatientsModule)},
  {path:'',loadChildren:()=>import('./auth/patients/patients-auth.module').then((mod)=>mod.PatientsAuthModule)},
  {path:'',loadChildren:()=>import('./auth/Superadmin/superadmin.module').then((mod)=>mod.SuperadminModule)},
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
