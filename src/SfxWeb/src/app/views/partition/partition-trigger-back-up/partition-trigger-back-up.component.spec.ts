import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PartitionTriggerBackUpComponent } from './partition-trigger-back-up.component';

describe('PartitionTriggerBackUpComponent', () => {
  let component: PartitionTriggerBackUpComponent;
  let fixture: ComponentFixture<PartitionTriggerBackUpComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PartitionTriggerBackUpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartitionTriggerBackUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
