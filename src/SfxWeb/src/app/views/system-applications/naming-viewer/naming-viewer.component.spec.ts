import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NamingViewerComponent } from './naming-viewer.component';

describe('NamingViewerComponent', () => {
  let component: NamingViewerComponent;
  let fixture: ComponentFixture<NamingViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamingViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NamingViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
