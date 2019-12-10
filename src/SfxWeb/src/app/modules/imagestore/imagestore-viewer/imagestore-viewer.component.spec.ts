import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagestoreViewerComponent } from './imagestore-viewer.component';

describe('ImagestoreViewerComponent', () => {
  let component: ImagestoreViewerComponent;
  let fixture: ComponentFixture<ImagestoreViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImagestoreViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImagestoreViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
