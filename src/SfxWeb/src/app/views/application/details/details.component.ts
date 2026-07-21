import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ApplicationBaseControllerDirective } from '../applicationBase';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DetailsComponent extends ApplicationBaseControllerDirective {
  protected data: DataService = inject(DataService);
}
