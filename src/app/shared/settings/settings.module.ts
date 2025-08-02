import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { SettingsComponent } from '../../admin/settings/settings.component';
import { ManageDropdownsComponent } from '../../admin/manage-dropdowns/manage-dropdowns/manage-dropdowns.component';
import { CountriesDataComponent } from '../../admin/manage-dropdowns/countries-data/countries-data.component';
import { LookupDataComponent } from '../../admin/manage-dropdowns/lookup-data/lookup-data.component';
import { MedicationComponent } from '../../admin/manage-dropdowns/medication/medication.component';
import { ConfirmDialogComponent } from '../../admin/manage-dropdowns/confirm-dialog/confirm-dialog.component';
import { DropdownDataService } from '../../service/dropdown/dropdown-data-service';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
import { AgGridModule } from 'ag-grid-angular';

@NgModule({
  declarations: [
    SettingsComponent,
    ManageDropdownsComponent,
    CountriesDataComponent,
    LookupDataComponent,
    MedicationComponent,
    ConfirmDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AgGridModule
  ],

  providers: [
    DropdownDataService
  ],
  exports: [
    SettingsComponent,
    ManageDropdownsComponent,
    CountriesDataComponent,
    LookupDataComponent,
    MedicationComponent,
    ConfirmDialogComponent
  ]
})
export class SettingModule { }
