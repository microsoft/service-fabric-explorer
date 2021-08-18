import { Component, OnInit, Input, ViewChild, ComponentFactoryResolver, ChangeDetectorRef } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ResolverDirective } from '../resolver.directive';
import { Type } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';

@Component({
  selector: 'app-detail-table-resolver',
  templateUrl: './detail-table-resolver.component.html',
  styleUrls: ['./detail-table-resolver.component.scss']
})
export class DetailTableResolverComponent implements OnInit {
  @Input() cache: Record<string, any>;

  @Input() item: any;
  @Input() setting: ListColumnSetting;
  @Input() template: Type<any>;
  @Input() itemValue: any;

  @ViewChild(ResolverDirective, {static: true}) templateHost: ResolverDirective;


  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    this.loadComponent();
  }


  loadComponent() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.template);

    const viewContainerRef = this.templateHost.viewContainerRef;
    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent(componentFactory);
    (componentRef.instance as DetailBaseComponent).item = this.item;
    (componentRef.instance as DetailBaseComponent).listSetting = this.setting;
    (componentRef.instance as DetailBaseComponent).cache = this.cache;
    componentRef.injector.get(ChangeDetectorRef).detectChanges(); // or detectChanges()

  }
}
