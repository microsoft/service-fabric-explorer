import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-warning',
  templateUrl: './warning.component.html',
  styleUrls: ['./warning.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarningComponent {

  @Input() description: string = "";
  @Input() iconSize: string = "mif-4x";
  //provide additional data in a list format
  @Input() descriptionList: string[] = [];
  @Input() link: string;
  @Input() linkText: string;

  constructor() { }

}
