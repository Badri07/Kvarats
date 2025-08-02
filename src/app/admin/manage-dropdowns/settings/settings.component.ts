import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: false
})
export class SettingsComponent {
  menuItems = [
    { label: 'Manage Dropdowns', route: 'manage-dropdowns', icon: 'M4 6h16M4 12h16M4 18h16' }
  ];
}