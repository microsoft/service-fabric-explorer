import { ChangeDetectionStrategy, Component,  Input, ViewChild, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgbNav, NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { result } from 'cypress/types/lodash';
import { CommandSafetyLevel, PowershellCommand } from 'src/app/Models/PowershellCommand';
import { SettingsService } from 'src/app/services/settings.service';
import { ActionDialogComponent } from 'src/app/shared/component/action-dialog/action-dialog.component';
import { ModalData } from 'src/app/ViewModels/Modal';

@Component({
  selector: 'app-powershell-commands',
  templateUrl: './powershell-commands.component.html',
  styleUrls: ['./powershell-commands.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PowershellCommandsComponent implements ModalData, OnChanges{

  title: string = 'Acknowledge';
  modalTitle: string = 'Warning';
  modalMessage: string;
  
  activeId:any = 1;
  safetyLevelEnum = CommandSafetyLevel;
  
  @Input() commands: PowershellCommand[];
  @ViewChild('nav') nav: NgbNav;
  
  safeCommands: PowershellCommand[] = [];
  unsafeCommands: PowershellCommand[] = [];
  dangerousCommands: PowershellCommand[] = [];
  
  constructor(protected dialog: MatDialog, protected settings: SettingsService) {}
  
  ngOnChanges() {
    this.safeCommands = this.getCommandsBySafety(this.safetyLevelEnum.safe);
    this.unsafeCommands = this.getCommandsBySafety(this.safetyLevelEnum.unsafe);
    this.dangerousCommands = this.getCommandsBySafety(this.safetyLevelEnum.dangerous);

  }

  onNavChange(e: NgbNavChangeEvent) {
    if (e.nextId == 2 && !this.settings.getSessionVariable<boolean>('unsafeCommandsWarned')) {
      e.preventDefault();
      this.modalMessage = "The commands you are about to view are potentially unsafe, and executing them can result in undesirable results. Please ensure you understand their risks."
      this.openWarningModal('unsafeCommandsWarned', e.nextId);
    }
    else if (e.nextId == 3 && !this.settings.getSessionVariable<boolean>('dangerCommandsWarned')) {
      e.preventDefault();
      this.modalMessage = "The commands you are about to view are potentially very dangerous to the cluster, and executing them incorrectly can lead to dire consequences."
      this.openWarningModal('dangerCommandsWarned', e.nextId);
    }
    
  }

  getCommandsBySafety(level: CommandSafetyLevel): PowershellCommand[] {
    return this.commands.filter(c => c.safetyLevel === level);
  }

  openWarningModal(warnedVar: string, navId: number) {
    let dialogRef = this.dialog.open(ActionDialogComponent, {
      data: this, panelClass: 'mat-dialog-container-wrapper'
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.nav.select(navId);
        this.settings.setSessionVariable<boolean>(warnedVar, true);
      } 
    });
  }
}
