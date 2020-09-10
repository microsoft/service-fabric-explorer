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
export class SearchComponent2 {}

@Component({
    template: `Home`
})
export class HomeComponent2 {}

@Component({
    template: `<router-outlet></router-outlet>`
  })
export class NestedComponent2 {}

const routes2: Routes = [{
    path: '', component: NestedComponent2, children: [
        { path: '', component: HomeComponent2 },
        { path: 'details', component: SearchComponent2 }
      ]
    }];

@NgModule({
    declarations: [SearchComponent2, HomeComponent2, NestedComponent2],
    imports: [RouterModule.forChild(routes2)]
})
export class ApplicationModule2 { }
