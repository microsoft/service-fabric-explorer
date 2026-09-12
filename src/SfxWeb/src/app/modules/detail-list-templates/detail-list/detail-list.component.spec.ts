import { TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { ListColumnSettingWithFilter, ListSettings } from 'src/app/Models/ListSettings';
import { DetailListComponent } from './detail-list.component';

describe('DetailListComponent toolbar filters', () => {
  it('populates New filter options when rows are assigned before settings', () => {
    TestBed.configureTestingModule({ providers: [
      { provide: LiveAnnouncer, useValue: { announce: () => {} } },
      { provide: MatDialog, useValue: {} }
    ] });
    const component = TestBed.runInInjectionContext(() => new DetailListComponent());
    component.experience.isNew.set(true);
    component.list = [{ status: 'Active' }];
    component.listSettings = new ListSettings(100, [], 'arrival-order', [new ListColumnSettingWithFilter('status', 'Status')]);
    component.toolbarFilterProperties = ['status'];
    component.ngOnChanges({ listSettings: new SimpleChange(undefined, component.listSettings, true) });
    expect(component.hasToolbarFilterOptions).toBeTrue();
    expect(component.toolbarFilterColumns[0].filterValues[0].value).toBe('Active');
    const modernSettings = component.listSettings;
    modernSettings.search = 'missing';
    component.updateList();
    expect(component.sortedFilteredList.length).toBe(0);
    component.experience.isNew.set(false);
    component.listSettings = new ListSettings(100, [], 'classic', [new ListColumnSettingWithFilter('status', 'Status')]);
    component.ngOnChanges({ listSettings: new SimpleChange(modernSettings, component.listSettings, false) });
    expect(component.sortedFilteredList.length).toBe(1);
    component.ngOnDestroy();
  });
  it('resizes columns within bounds and ignores resize input in Classic', () => {
    TestBed.configureTestingModule({ providers: [
      { provide: LiveAnnouncer, useValue: { announce: () => {} } },
      { provide: MatDialog, useValue: {} }
    ] });
    const component = TestBed.runInInjectionContext(() => new DetailListComponent());
    const column = new ListColumnSettingWithFilter('node', 'Node');
    component.listSettings = new ListSettings(100, [], 'resize-test', [column]);
    const originalMode = component.experience.isNew();
    component.experience.isNew.set(true);
    component.columnWidths.set(column, 200);
    component.resizeColumnKey(new KeyboardEvent('keydown', { key: 'ArrowRight' }), column);
    expect(component.resizedTableWidth).toBe(220);
    component.columnWidths.set(column, 80);
    component.resizeColumnKey(new KeyboardEvent('keydown', { key: 'ArrowLeft' }), column);
    expect(component.resizedTableWidth).toBe(80);
    component.experience.isNew.set(false);
    component.resizeColumnKey(new KeyboardEvent('keydown', { key: 'ArrowRight' }), column);
    expect(component.columnWidths.get(column)).toBe(80);
    expect(component.resizedTableWidth).toBeNull();
    component.experience.isNew.set(true);
    component.resizeColumnKey(new KeyboardEvent('keydown', { key: 'Home' }), column);
    expect(component.resizedTableWidth).toBeNull();
    component.experience.isNew.set(originalMode);
    component.ngOnDestroy();
  });
  it('groups existing filters and combines selections without changing default placement', () => {
    TestBed.configureTestingModule({ providers: [
      { provide: LiveAnnouncer, useValue: { announce: () => {} } },
      { provide: MatDialog, useValue: {} }
    ] });
    const component = TestBed.runInInjectionContext(() => new DetailListComponent());
    const columns = ['node', 'role', 'health', 'status'].map(name => new ListColumnSettingWithFilter(name, name));
    component.listSettings = new ListSettings(100, [], 'replicas', columns);
    component.list = [
      { node: 'SF_0', role: 'Primary', health: 'OK', status: 'Ready' },
      { node: 'SF_1', role: 'Secondary', health: 'OK', status: 'Ready' },
      { node: 'SF_2', role: 'Secondary', health: 'Warning', status: 'Down' }
    ];
    expect(component.toolbarFilterColumns).toEqual([]);
    component.toolbarFilterProperties = ['node', 'role', 'health', 'status'];
    expect(component.toolbarFilterColumns).toEqual(columns);
    expect(component.hasToolbarFilterOptions).toBeTrue();
    columns[1].filterValues.find(value => value.value === 'Primary')!.isChecked = false;
    columns[2].filterValues.find(value => value.value === 'Warning')!.isChecked = false;
    component.updateList();
    expect(component.sortedFilteredList.map(item => item.node)).toEqual(['SF_1']);
    expect(component.toolbarFiltersActive).toBeTrue();
    component.resetAll();
    component.updateList();
    expect(component.sortedFilteredList.length).toBe(3);
    component.toolbarFilterProperties = [];
    expect(component.toolbarFilterColumns).toEqual([]);
    component.ngOnDestroy();
  });
});
