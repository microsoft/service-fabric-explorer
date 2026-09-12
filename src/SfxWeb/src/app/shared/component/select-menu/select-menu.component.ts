import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { NgbDropdown, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

export interface SelectMenuOption { value: string | number | boolean; label: string; disabled?: boolean; }

@Component({
  selector: 'app-select-menu', standalone: true, imports: [NgbDropdownModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div ngbDropdown #menu="ngbDropdown" container="body" placement="bottom-start" (openChange)="onOpen($event)">
      <button #trigger type="button" ngbDropdownToggle class="select-trigger" [disabled]="disabled" [attr.aria-label]="label" aria-haspopup="listbox" [attr.aria-controls]="menuId">
        <span>{{selectedLabel}}</span>
      </button>
      <div ngbDropdownMenu class="sfx-select-options" role="listbox" [id]="menuId" [attr.aria-label]="label">
        @for (option of options; track option.value) {
          <button type="button" ngbDropdownItem role="option" [disabled]="option.disabled" [attr.aria-selected]="option.value === value" (click)="choose(option)"><span class="option-check" aria-hidden="true">{{option.value === value ? '✓' : ''}}</span><span class="option-label">{{option.label}}</span></button>
        } @empty { <span class="select-empty">No options available</span> }
      </div>
    </div>`,
  styles: [`
    :host { display: inline-block; min-width: 0; max-width: 100%; }
    .select-trigger { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; min-height: 36px; padding: 7px 10px; border: 1px solid #484f58; border-radius: 6px; background: #21262d; color: #e6edf3; font: 400 15px/1.4 var(--font-family-ui); cursor: pointer; }
    .select-trigger > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .select-trigger::after { flex-shrink: 0; }
    .select-trigger:hover:not(:disabled) { background: #30363d; }
    .select-trigger:disabled { color: #8b949e; opacity: .6; cursor: default; }
    .select-trigger:focus-visible { outline: 2px solid #58a6ff; outline-offset: 2px; }
  `]
})
export class SelectMenuComponent {
  private static nextId = 0;
  readonly menuId = `sfx-select-${SelectMenuComponent.nextId++}`;
  @Input() options: SelectMenuOption[] = [];
  @Input() value: string | number | boolean = '';
  @Input() label = 'Select an option';
  @Input() placeholder = 'Select';
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<any>();
  @ViewChild('menu') menu!: NgbDropdown;
  @ViewChild('trigger') trigger!: ElementRef<HTMLButtonElement>;
  get selectedLabel() { return this.options.find(option => option.value === this.value)?.label ?? this.placeholder; }
  choose(option: SelectMenuOption) {
    if (this.disabled || option.disabled) { return; }
    this.menu.close();
    this.trigger.nativeElement.focus({ preventScroll: true });
    this.valueChange.emit(option.value);
  }
  onOpen(open: boolean) { if (open && this.disabled) { this.menu.close(); } }
}
