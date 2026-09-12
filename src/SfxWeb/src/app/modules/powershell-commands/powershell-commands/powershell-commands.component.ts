import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild, OnChanges, OnDestroy, inject } from '@angular/core';
import { ExperienceService } from 'src/app/services/experience.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NgbNav, NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { CommandSafetyLevel, PowershellCommand } from 'src/app/Models/PowershellCommand';
import { SettingsService } from 'src/app/services/settings.service';
import { ActionDialogComponent } from 'src/app/modules/action-dialog/action-dialog/action-dialog.component';
import { IModalBody, IModalData, IModalTitle } from 'src/app/ViewModels/Modal';

@Component({
    selector: 'app-powershell-commands',
    templateUrl: './powershell-commands.component.html',
    styleUrls: ['./powershell-commands.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PowershellCommandsComponent implements IModalData, OnChanges, OnDestroy {
  public experience = inject(ExperienceService);
  private cdr = inject(ChangeDetectorRef);
  private warningSubscription?: Subscription;
  public search = '';
  public selectedCommand?: PowershellCommand;

  visibleCommands(commands: PowershellCommand[]) {
    const query = this.search.trim().toLowerCase();
    return commands.filter(command => !query || `${command.name} ${command.prefix}`.toLowerCase().includes(query));
  }

  selectedFor(commands: PowershellCommand[]) {
    return this.selectedCommand && commands.includes(this.selectedCommand) ? this.selectedCommand : commands[0];
  }

  ngOnDestroy() { this.warningSubscription?.unsubscribe(); }
  protected dialog = inject(MatDialog);
  protected settings = inject(SettingsService);


  title: string = 'Acknowledge';
  
  modalTitle: IModalTitle = {
    title: 'Warning',
    class: 'warning'
  }
  modalBody: IModalBody = { inputs: {message: ''} };

  activeId:any = 1;
  safetyLevelEnum = CommandSafetyLevel;
  
  @Input() commands!: PowershellCommand[];
  @ViewChild('nav') nav!: NgbNav;
  
  safeCommands: PowershellCommand[] = [];
  unsafeCommands: PowershellCommand[] = [];
  dangerousCommands: PowershellCommand[] = [];
  
  ngOnChanges() {
    this.safeCommands = this.getCommandsBySafety(this.safetyLevelEnum.safe);
    this.unsafeCommands = this.getCommandsBySafety(this.safetyLevelEnum.unsafe);
    this.dangerousCommands = this.getCommandsBySafety(this.safetyLevelEnum.dangerous);
    if (this.selectedCommand && !this.commands.includes(this.selectedCommand)) { this.selectedCommand = undefined; }

  }

  onNavChange(e: NgbNavChangeEvent) {
    this.search = '';
    if (e.nextId == 2 && !this.settings.getSessionVariable<boolean>('unsafeCommandsWarned')) {
      e.preventDefault();
      this.modalBody.inputs.message = "The commands you are about to view are potentially unsafe, and executing them can result in undesirable results. Please ensure you understand their risks."
      this.openWarningModal('unsafeCommandsWarned', e.nextId);
    }
    else if (e.nextId == 3 && !this.settings.getSessionVariable<boolean>('dangerCommandsWarned')) {
      e.preventDefault();
      this.modalBody.inputs.message = "The commands you are about to view are potentially very dangerous to the cluster, and executing them incorrectly can lead to dire consequences."
      this.openWarningModal('dangerCommandsWarned', e.nextId);
    }
    
  }

  getCommandsBySafety(level: CommandSafetyLevel): PowershellCommand[] {
    return (this.commands || []).filter(c => c.safetyLevel === level);
  }

  openWarningModal(warnedVar: string, navId: number) {
    let dialogRef = this.dialog.open(ActionDialogComponent, {
      data: this, panelClass: 'mat-dialog-container-wrapper'
    });
  
    this.warningSubscription?.unsubscribe();
    this.warningSubscription = dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.settings.setSessionVariable<boolean>(warnedVar, true);
        this.nav?.select(navId);
        this.cdr.markForCheck();
      } 
    });
  }
}
