import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path:'',loadChildren:()=>import('./auth/admin/auth.module').then((mod)=>mod.AuthModule)},
  {path:'',loadChildren:()=>import('./admin/admin.module').then((mod)=>mod.AdminModule)},
  {path:'',loadChildren:()=>import('./auth/patients/patients-auth.module').then((mod)=>mod.PatientsAuthModule)}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
