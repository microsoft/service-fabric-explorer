import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicaTileComponent } from './replica-tile.component';

describe('ReplicaTileComponent', () => {
  let component: ReplicaTileComponent;
  let fixture: ComponentFixture<ReplicaTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReplicaTileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplicaTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
