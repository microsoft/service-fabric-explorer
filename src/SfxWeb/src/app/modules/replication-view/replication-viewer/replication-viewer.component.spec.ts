import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicationViewerComponent } from './replication-viewer.component';

describe('ReplicationViewerComponent', () => {
  let component: ReplicationViewerComponent;
  let fixture: ComponentFixture<ReplicationViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReplicationViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplicationViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
