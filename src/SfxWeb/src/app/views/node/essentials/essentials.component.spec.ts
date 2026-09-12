import { CommonModule } from '@angular/common';
import { Component, Input, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { DeployedApplicationCollection } from 'src/app/Models/DataModels/collections/DeployedApplicationCollection';
import { Node } from 'src/app/Models/DataModels/Node';
import { ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { ExperienceService } from 'src/app/services/experience.service';
import { MessageService } from 'src/app/services/message.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { SettingsService } from 'src/app/services/settings.service';
import { StorageService } from 'src/app/services/storage.service';
import { EssentialsComponent } from './essentials.component';

@Component({ selector: 'app-detail-list', template: '', standalone: false })
class DetailListStubComponent {
  @Input() list: unknown[] = [];
  @Input() listSettings!: ListSettings;
  @Input() toolbarFilterProperties: string[] = [];
}

describe('Node Essentials deployed applications filters', () => {
  it('groups only existing filter columns in New and restores Classic placement', async () => {
    const experience = { isNew: signal(false) };
    await TestBed.configureTestingModule({
      declarations: [EssentialsComponent, DetailListStubComponent],
      imports: [CommonModule],
      providers: [
        SettingsService,
        { provide: StorageService, useValue: { getValueNumber: () => 10 } },
        { provide: ExperienceService, useValue: experience },
        { provide: DataService, useValue: {} },
        { provide: ActivatedRoute, useValue: { params: EMPTY } },
        { provide: Router, useValue: {} },
        { provide: RefreshService, useValue: {} },
        { provide: MessageService, useValue: {} }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    const fixture = TestBed.createComponent(EssentialsComponent);
    const component = fixture.componentInstance;
    component.setup();
    component.node = { health: { healthEvents: [], unhealthyEvaluations: [] } } as unknown as Node;
    component.deployedApps = { collection: [] } as unknown as DeployedApplicationCollection;
    const columns = component.listSettings.columnSettings;
    expect(columns.map(column => [column.propertyPath, column.displayName])).toEqual([
      ['name', 'Name'], ['raw.TypeName', 'Application Type'],
      ['health.healthState', 'Health State'], ['raw.Status', 'Status']
    ]);
    const filterProperties = columns.filter(column => column.config!.enableFilter).map(column => column.propertyPath);
    expect(filterProperties).toEqual(['health.healthState', 'raw.Status']);

    for (const isNew of [false, true, false]) {
      experience.isNew.set(isNew);
      fixture.detectChanges();
      const table = fixture.debugElement.query(By.directive(DetailListStubComponent)).componentInstance as DetailListStubComponent;
      expect(table.list).toBe(component.deployedApps.collection);
      expect(table.listSettings).toBe(component.listSettings);
      expect(table.toolbarFilterProperties).toEqual(isNew ? filterProperties : []);
      expect(columns[1].config!.enableFilter).toBeFalse();
    }
    fixture.destroy();
  });
});
