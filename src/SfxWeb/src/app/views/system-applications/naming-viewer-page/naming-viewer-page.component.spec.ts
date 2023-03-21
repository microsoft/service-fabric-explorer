import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NamingViewerPageComponent } from './naming-viewer-page.component';

describe('NamingViewerPageComponent', () => {
  let component: NamingViewerPageComponent;
  let fixture: ComponentFixture<NamingViewerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamingViewerPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NamingViewerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
