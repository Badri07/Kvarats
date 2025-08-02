import { Component, Input } from '@angular/core';
import { PopupService } from '../../service/popup/popup-service';

@Component({
  selector: 'app-loader',
  standalone: false,
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent {

  constructor(private _service:PopupService){}
@Input() isLoader: boolean = false;

ngOnInit(){
   this._service.loaderState$.subscribe((state: boolean) => {
      this.isLoader = state;
    });
}
}
