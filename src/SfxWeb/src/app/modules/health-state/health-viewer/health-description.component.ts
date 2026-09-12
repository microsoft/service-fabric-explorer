import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

@Component({
  selector: 'app-health-description',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '<span class="message">{{message}}</span>',
  styles: [`
    .message { display: block; min-width: 180px; max-width: 240px; white-space: pre-wrap; overflow-wrap: anywhere; color: #e6edf3; font: 400 15px/1.5 var(--font-family-ui); }
  `]
})
export class HealthDescriptionComponent implements DetailBaseComponent {
  item!: { raw: { Description: string } };
  listSetting!: ListColumnSetting;
  private readonly helpSuffix = /\s*For more information see:\s*https?:\/\/aka\.ms\/sfhealth\/?\s*$/i;
  get rawText() { return this.item.raw.Description || ''; }
  get message() {
    // Some health reports omit the space before the node name in this sentence.
    return this.rawText.replace(this.helpSuffix, '').trim().replace(/^(Replica has been created on)(?=\S)/, '$1 ');
  }
}
