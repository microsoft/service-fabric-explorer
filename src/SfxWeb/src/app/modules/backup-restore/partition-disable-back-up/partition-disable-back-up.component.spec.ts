import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PartitionDisableBackUpComponent } from './partition-disable-back-up.component';

describe('PartitionDisableBackUpComponent', () => {
  let component: PartitionDisableBackUpComponent;
  let fixture: ComponentFixture<PartitionDisableBackUpComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PartitionDisableBackUpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartitionDisableBackUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
