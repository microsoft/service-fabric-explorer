import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StorageFormComponent } from './storage-form.component';

describe('StorageFormComponent', () => {
  let component: StorageFormComponent;
  let fixture: ComponentFixture<StorageFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StorageFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StorageFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
