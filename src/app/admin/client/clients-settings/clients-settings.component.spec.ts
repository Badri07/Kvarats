import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientsSettingsComponent } from './clients-settings.component';

describe('ClientsSettingsComponent', () => {
  let component: ClientsSettingsComponent;
  let fixture: ComponentFixture<ClientsSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientsSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientsSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
