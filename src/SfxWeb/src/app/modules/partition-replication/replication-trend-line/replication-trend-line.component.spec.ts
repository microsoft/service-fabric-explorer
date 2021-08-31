import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicationTrendLineComponent } from './replication-trend-line.component';

describe('ReplicationTrendLineComponent', () => {
  let component: ReplicationTrendLineComponent;
  let fixture: ComponentFixture<ReplicationTrendLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReplicationTrendLineComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplicationTrendLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
