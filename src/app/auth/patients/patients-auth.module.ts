import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PatientsAuthRoutingModule } from './patients-auth-routing.modules';
import { PatientsRegistrationComponent } from './patients-registration/patients-registration.component';


@NgModule({
  declarations: [
    PatientsRegistrationComponent
  
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PatientsAuthRoutingModule   
  ],
  providers:[provideHttpClient()]
})
export class PatientsAuthModule { }
