import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PowershellScript } from 'src/app/Models/RawDataTypes';
import { DataService } from 'src/app/services/data.service';
import { Utils } from 'src/app/Utils/Utils';

@Component({
  selector: 'app-powershell-script-dropdown',
  templateUrl: './powershell-script-dropdown.component.html',
  styleUrls: ['./powershell-script-dropdown.component.scss']
})
export class PowershellScriptDropdownComponent {

  @Input() treeView = false;
  @Input() powershellScripts: PowershellScript[];
  @Input() displayText: string;
  @Output() changedState = new EventEmitter();
  constructor(public dataService: DataService, private liveAnnouncer: LiveAnnouncer) { }

  closeChange(state: boolean) {
    if (!Utils.isIEOrEdge) {
      this.liveAnnouncer.announce(`Scripts dropdown button is now ${state ? 'Expanded' : 'Collapsed'}`);
    }

    this.changedState.emit(state);
  }

}
