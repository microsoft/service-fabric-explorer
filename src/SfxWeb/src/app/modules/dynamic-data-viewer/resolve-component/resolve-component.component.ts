import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, ComponentFactoryResolver, ComponentRef, Input, OnDestroy, OnInit, Type, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize, last } from 'rxjs/operators';
import { RefreshService } from 'src/app/services/refresh.service';
import { BadConfigurationComponent } from '../bad-configuration/bad-configuration.component';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { ChartRefDirective } from '../chart-ref.directive';
import { ChartComponent } from '../chartComponent.interface';
import { ChartConfiguration, ChartConfigurationType } from '../chartConfig.interface';

@Component({
  selector: 'app-resolve-component',
  templateUrl: './resolve-component.component.html',
  styleUrls: ['./resolve-component.component.scss']
})
export class ResolveComponentComponent implements OnInit, OnDestroy {
  @Input() configuration: ChartConfiguration;

  @ViewChild(ChartRefDirective, { static: true }) ref: ChartRefDirective;

  sub: Subscription = new Subscription();
  componentRef: ComponentRef<ChartComponent>;

  refreshingState: "In Progress" | "Loaded" | "Failed" = "In Progress";
  refreshingTimeStamp: string = new Date().toUTCString();
  lastError: HttpErrorResponse;
  lastErrorTimeStamp: string;

  dataLoadError: string = "";

  constructor(private componentFactoryResolver: ComponentFactoryResolver,
    private refreshService: RefreshService,
    private httpClient: HttpClient) { }

  ngOnInit(): void {
    this.loadComponent();
    this.sub.add(this.refreshService.refreshSubject.subscribe(tick => {
      this.loadData();
    }))
    // this.loadData();

  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  loadComponent() {
    let comp: Type<ChartComponent>;
    switch (this.configuration.type) {
      case ChartConfigurationType.barChart:
        comp = BarChartComponent;
        break;
      default:
        comp = BadConfigurationComponent;
        break;
    }

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(comp);

    const viewContainerRef = this.ref.viewContainerRef;
    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent(componentFactory);
    (componentRef.instance as ChartComponent).configuration = this.configuration;
    this.componentRef = componentRef;

    componentRef.changeDetectorRef.detectChanges(); // ngOnInit will be called

  }

  loadData() {
    this.refreshingState = "In Progress"
    this.refreshingTimeStamp = new Date().toUTCString();

    this.httpClient.get(this.configuration.url).pipe(finalize(() => {
      this.refreshingTimeStamp = new Date().toUTCString();
    })).subscribe(data => {
      this.refreshingState = "Loaded";
      console.log(data)

      this.dataLoadError = this.componentRef.instance.validateData(data);
      if(this.dataLoadError.length === 0) {
        this.componentRef.instance.setData(data);
      }

    }, (err: HttpErrorResponse) => {
      this.lastError = err;
      this.lastErrorTimeStamp = new Date().toUTCString();
      this.refreshingState = "Failed";
    })
  }
}
