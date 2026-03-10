import {makeAutoObservable} from "mobx";

export class User {
    count:number = 0;

    constructor() {
        makeAutoObservable(this);
    }

    addCount() {
        this.count += 1;
    }
}