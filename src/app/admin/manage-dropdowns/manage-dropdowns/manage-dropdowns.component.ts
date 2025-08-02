import { Component, ElementRef, inject, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-manage-dropdowns',
  templateUrl: './manage-dropdowns.component.html',
  styleUrls: ['./manage-dropdowns.component.scss'],
  standalone: false
})
export class ManageDropdownsComponent {
activeTab = 'countries';
sliderLeft = '0px';
sliderWidth = '0px';

@ViewChildren('tabItem', { read: ElementRef }) tabItems!: QueryList<ElementRef>;
@ViewChild('tabContainer', { static: true }) tabContainer!: ElementRef;

  public breadcrumbService = inject(BreadcrumbService)
  ngOnInit(){
     this.breadcrumbService.setBreadcrumbs([
    { label: 'Manage Dropdowns', url: 'settings/dropdowns' },
  ]);
  }

  ngAfterViewInit() {
  // Wait for tab rendering
  setTimeout(() => this.updateSliderPosition(this.tabs.findIndex(tab => tab.id === this.activeTab)), 0);
}

setActiveTab(tabId: string, index: number) {
  this.activeTab = tabId;
  this.updateSliderPosition(index);
}

updateSliderPosition(index: number) {
  const tabEl = this.tabItems.toArray()[index]?.nativeElement;
  if (tabEl) {
    this.sliderLeft = tabEl.offsetLeft + 'px';
    this.sliderWidth = tabEl.offsetWidth + 'px';
  }
}
  tabs = [
    { id: 'countries', label: 'Countries Data', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.995' },
    { id: 'lookup', label: 'Lookup Data', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'medication', label: 'Medications', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' }
  ];


}