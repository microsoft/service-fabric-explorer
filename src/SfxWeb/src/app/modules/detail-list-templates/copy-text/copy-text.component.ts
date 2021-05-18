import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

@Component({
  selector: 'app-copy-text',
  templateUrl: './copy-text.component.html',
  styleUrls: ['./copy-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CopyTextComponent implements DetailBaseComponent {

  item: any;
  listSetting: ListColumnSetting;

  link: string;
  constructor() { }

}
