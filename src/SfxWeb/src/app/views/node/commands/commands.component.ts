import { Component, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { NodeBaseControllerDirective } from '../NodeBase';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends NodeBaseControllerDirective {
  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup() {
  }


}
