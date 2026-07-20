import { Component, OnInit, inject } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ApplicationBaseControllerDirective } from '../applicationBase';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    standalone: false
})
export class DetailsComponent extends ApplicationBaseControllerDirective {
  protected data: DataService = inject(DataService);
}
