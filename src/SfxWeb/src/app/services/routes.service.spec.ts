import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';

import { RoutesService } from './routes.service';
import { provideRouter, Routes, Router } from '@angular/router';
import { Component, ChangeDetectionStrategy } from '@angular/core';
@Component({
    template: `<router-outlet></router-outlet>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent {
}
const routes: Routes = [
  { path: 'node/:nodeName', loadChildren: () => import(`./routes.service.testData`).then(m => m.ApplicationModule) },
  { path: '', loadChildren: () => import(`./routes.service.testData`).then(m => m.ApplicationModule2) },
  ];

describe('RoutesService', () => {
  let location: Location;
  let router: Router;
  let fixture;

  beforeEach(() => {

    TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [provideRouter(routes)]
    });

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);

    fixture = TestBed.createComponent(AppComponent);
    router.initialNavigation();
  });

  afterEach(async () => {
    // RoutesService schedules redirect navigations via setTimeout(...,1). Let any pending
    // redirect settle while the injector is alive; otherwise it runs after teardown (NG0205).
    await new Promise(resolve => setTimeout(resolve, 50));
  });


  it('should be created', () => {
    const service: RoutesService = TestBed.inject(RoutesService);
    expect(service).toBeTruthy();
  });

  it('start on nondefault route of entity and view different entity of same type (redirect)', async () => {
    const service: RoutesService = TestBed.inject(RoutesService);

    await router.navigate(['/node/node1/details']);
    expect(location.path()).toBe('/node/node1/details');

    await router.navigate(['/node/node2']);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(location.path()).toBe('/node/node2/details');

    await router.navigate(['/node/node2']);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(location.path()).toBe('/node/node2');
  });

  it('route to different view and back (no redirect)', async () => {
    const service: RoutesService = TestBed.inject(RoutesService);

    await router.navigate(['/node/node1/details']);
    expect(location.path()).toBe('/node/node1/details');

    await router.navigate(['/']);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(location.path()).toBe('');

    await router.navigate(['/node/node2']);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(location.path()).toBe('/node/node2');
  });


  it('route to different subpage. (no redirect)', async () => {
    const service: RoutesService = TestBed.inject(RoutesService);

    await router.navigate(['/node/node1/details']);
    expect(location.path()).toBe('/node/node1/details');

    await router.navigate(['/node/node1']);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(location.path()).toBe('/node/node1');

    await router.navigate(['/node/node1/details']);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(location.path()).toBe('/node/node1/details');
  });

  it('route to default page of same entity type (no redirect)', async () => {
    const service: RoutesService = TestBed.inject(RoutesService);

    await router.navigate(['/node/node1']);
    expect(location.path()).toBe('/node/node1');

    await router.navigate(['/node/node2']);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(location.path()).toBe('/node/node2');

    await router.navigate(['/node/node1']);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(location.path()).toBe('/node/node1');
  });
});
