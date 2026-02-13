import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ManifestComponent } from './manifest.component';

describe('ManifestComponent', () => {
  let component: ManifestComponent;
  let fixture: ComponentFixture<ManifestComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ManifestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManifestComponent);
    component = fixture.componentInstance;
    component.manifest = '<Root><Child attr="value">text</Child></Root>';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should syntax highlight XML manifest', () => {
    expect(component.highlightedManifest).toContain('hljs-tag');
    expect(component.highlightedManifest).toContain('hljs-attr');
  });

  it('should handle empty manifest', () => {
    const emptyFixture = TestBed.createComponent(ManifestComponent);
    const emptyComponent = emptyFixture.componentInstance;
    emptyFixture.detectChanges();
    expect(emptyComponent.highlightedManifest).toBe('');
  });
});
