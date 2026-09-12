import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PowershellCommand, CommandParamTypes, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-command-editor', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './command-editor.component.html', styleUrls: ['./command-editor.component.scss']
})
export class CommandEditorComponent implements OnChanges, OnDestroy {
  @Input() command!: PowershellCommand;
  readonly types = CommandParamTypes;
  private static nextId = 0;
  readonly fieldPrefix = `command-editor-${CommandEditorComponent.nextId++}-`;
  form = new FormGroup<Record<string, FormControl>>({});
  required: PowershellCommandParameter[] = [];
  optional: PowershellCommandParameter[] = [];
  script = '';
  private changes?: Subscription;

  ngOnChanges() {
    this.changes?.unsubscribe();
    const controls: Record<string, FormControl> = {};
    this.required = this.command.parameters.filter(param => param.required);
    this.optional = this.command.parameters.filter(param => !param.required);
    this.command.parameters.forEach(param => {
      const toggle = param.type === this.types.bool || param.type === this.types.switch;
      controls[param.name] = new FormControl(param.value ?? (toggle ? false : ''), param.required && !toggle ? Validators.required : null);
    });
    this.form = new FormGroup(controls);
    this.script = this.command.getScript();
    this.changes = this.form.valueChanges.subscribe(values => {
      this.command.parameters.forEach(param => param.value = values[param.name]);
      this.script = this.command.getScript();
    });
  }

  ngOnDestroy() { this.changes?.unsubscribe(); }
}
