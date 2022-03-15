export type SubjectCallBack<T> = (event: T) => void;

export class Subject<T> {
    obs: SubjectCallBack<T>[] = [];
    public lastValue: T;
  
    subscribe(cb: SubjectCallBack<T>) {
      this.obs.push(cb)
    };
  
    emit(value: T) {
      this.lastValue = value;
      this.obs.forEach(ob => ob(value));
    }
  }
  