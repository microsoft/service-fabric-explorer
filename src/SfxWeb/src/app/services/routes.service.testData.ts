// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
@Component({
    template: `Search`
})
export class SearchComponent {}

@Component({
    template: `Home`
})
export class HomeComponent {}

@Component({
    template: `<router-outlet></router-outlet>`
  })
export class NestedComponent {}

const routes: Routes = [{
    path: '', component: NestedComponent, children: [
        { path: '', component: HomeComponent },
        { path: 'details', component: SearchComponent }
      ]
    }];

@NgModule({
    declarations: [SearchComponent, HomeComponent, NestedComponent],
    imports: [RouterModule.forChild(routes)]
})
export class ApplicationModule { }


@Component({
    template: `Search`
})
export class Search2Component {}

@Component({
    template: `Home`
})
export class Home2Component {}

@Component({
    template: `<router-outlet></router-outlet>`
  })
export class Nested2Component {}

const routes2: Routes = [{
    path: '', component: Nested2Component, children: [
        { path: '', component: Home2Component },
        { path: 'details', component: Search2Component }
      ]
    }];

@NgModule({
    declarations: [Search2Component, Home2Component, Nested2Component],
    imports: [RouterModule.forChild(routes2)]
})
export class ApplicationModule2 { }
