import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DashboardTileComponent } from './dashboard-tile.component';

describe('DashboardTileComponent', () => {
  let component: DashboardTileComponent;
  let fixture: ComponentFixture<DashboardTileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
