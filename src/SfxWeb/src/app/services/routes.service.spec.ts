import { TestBed, fakeAsync, async, tick } from '@angular/core/testing';
import { Location } from '@angular/common';

import { RoutesService } from './routes.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Routes, Router } from '@angular/router';
import { Component } from '@angular/core';
@Component({
  template: `<router-outlet></router-outlet>`
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
      imports: [RouterTestingModule.withRoutes(routes)],
      declarations: [AppComponent]
    });

    router = TestBed.get(Router);
    location = TestBed.get(Location);

    fixture = TestBed.createComponent(AppComponent);
    router.initialNavigation();
  });


  fit('should be created', () => {
    const service: RoutesService = TestBed.get(RoutesService);
    expect(service).toBeTruthy();
  });

  fit('start on nondefault route of entity and view different entity of same type (redirect)', async () => {
    const service: RoutesService = TestBed.get(RoutesService);

    await router.navigate(['/node/node1/details']);
    expect(location.path()).toBe('/node/node1/details');

    await router.navigate(['/node/node2']);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(location.path()).toBe('/node/node2/details');

    await router.navigate(['/node/node2']);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(location.path()).toBe('/node/node2');
  });

  fit('route to different view and back (no redirect)', async () => {
    const service: RoutesService = TestBed.get(RoutesService);

    await router.navigate(['/node/node1/details']);
    expect(location.path()).toBe('/node/node1/details');

    await router.navigate(['/']);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(location.path()).toBe('/');

    await router.navigate(['/node/node2']);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(location.path()).toBe('/node/node2');
  });


  fit('route to different subpage. (no redirect)', async () => {
    const service: RoutesService = TestBed.get(RoutesService);

    await router.navigate(['/node/node1/details']);
    expect(location.path()).toBe('/node/node1/details');

    await router.navigate(['/node/node1']);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(location.path()).toBe('/node/node1');

    await router.navigate(['/node/node1/details']);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(location.path()).toBe('/node/node1/details');
  });

  fit('route to default page of same entity type (no redirect)', async () => {
    const service: RoutesService = TestBed.get(RoutesService);

    await router.navigate(['/node/node1']);
    expect(location.path()).toBe('/node/node1');

    await router.navigate(['/node/node2']);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(location.path()).toBe('/node/node2');

    await router.navigate(['/node/node1']);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(location.path()).toBe('/node/node1');
  });
});
