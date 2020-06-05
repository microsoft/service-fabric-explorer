import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardTextTileComponent } from './dashboard-text-tile.component';

describe('DashboardTextTileComponent', () => {
  let component: DashboardTextTileComponent;
  let fixture: ComponentFixture<DashboardTextTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardTextTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardTextTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
