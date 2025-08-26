import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesTileComponent } from './resources-tile.component';

describe('ResourcesTileComponent', () => {
  let component: ResourcesTileComponent;
  let fixture: ComponentFixture<ResourcesTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourcesTileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourcesTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
