import { Component, Input } from '@angular/core';

@Component({
  selector: 'fails',
  templateUrl: './fails.component.html',
  styleUrls: ['./fails.component.scss']
})
export class Fails {
  @Input() fails;

  problem_index;
  // !!!!!!!!!!!!!!!!!!!!!!!! change later
  private static readonly numShowedProblems=5; // chunk size for showing more and less fails

  constructor() {
    this.problem_index = Fails.numShowedProblems;
  }

  NumShowedProblems() {return Fails.numShowedProblems;}

  showProblems() {
    this.problem_index += Fails.numShowedProblems;
  }

  hideProblems() {
    this.problem_index = Fails.numShowedProblems;
  }

}