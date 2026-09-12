import { TestBed } from '@angular/core/testing';
import { ManifestDocumentComponent } from './manifest-document.component';

describe('ManifestDocumentComponent', () => {
  it('renders XML as text and updates when the manifest changes', () => {
    TestBed.configureTestingModule({ imports: [ManifestDocumentComponent] });
    const fixture = TestBed.createComponent(ManifestDocumentComponent);
    fixture.componentRef.setInput('xml', '<Cluster>\n<script>alert(1)</script>\n</Cluster>');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(3);
    fixture.componentInstance.query = 'cluster';
    expect(fixture.componentInstance.matchCount).toBe(2);
    fixture.componentRef.setInput('xml', '<Updated/>');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(1);
  });
});
