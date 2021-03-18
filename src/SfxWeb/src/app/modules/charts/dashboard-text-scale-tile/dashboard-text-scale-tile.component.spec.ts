import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardTextScaleTileComponent } from './dashboard-text-scale-tile.component';

describe('DashboardTextScaleTileComponent', () => {
  let component: DashboardTextScaleTileComponent;
  let fixture: ComponentFixture<DashboardTextScaleTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DashboardTextScaleTileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardTextScaleTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
