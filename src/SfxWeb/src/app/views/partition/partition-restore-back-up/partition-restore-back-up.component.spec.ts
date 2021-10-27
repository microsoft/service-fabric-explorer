import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PartitionRestoreBackUpComponent } from './partition-restore-back-up.component';

describe('PartitionRestoreBackUpComponent', () => {
  let component: PartitionRestoreBackUpComponent;
  let fixture: ComponentFixture<PartitionRestoreBackUpComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PartitionRestoreBackUpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartitionRestoreBackUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
