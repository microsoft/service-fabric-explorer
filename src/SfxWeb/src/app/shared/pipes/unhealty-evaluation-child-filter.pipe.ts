import { Pipe, PipeTransform } from '@angular/core';
import { IUnhealthyEvaluationNode } from '../component/unhealthy-evaluations-container/unhealthy-evaluations-container.component';

@Pipe({
  name: 'unhealtyEvaluationChildFilter'
})
export class UnhealtyEvaluationChildFilterPipe implements PipeTransform {

  transform(children: IUnhealthyEvaluationNode[], errorOnly: boolean): IUnhealthyEvaluationNode[] {
    if(errorOnly) {
      return children.filter(child => child.containsErrorInPath)
    }else{
      return children;
    }
  }

}
