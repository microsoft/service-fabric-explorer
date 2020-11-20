import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ImagestoreComponent } from './imagestore.component';

describe('ImagestoreComponent', () => {
  let component: ImagestoreComponent;
  let fixture: ComponentFixture<ImagestoreComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ImagestoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImagestoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
