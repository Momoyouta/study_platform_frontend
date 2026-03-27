import { makeAutoObservable } from "mobx";
import { BaseUserInfo } from "@/type/user";

export class User {
    userInfo: BaseUserInfo | null = localStorage.getItem('user_base_info') ? JSON.parse(localStorage.getItem('user_base_info')!) : null;
    token: string | null = localStorage.getItem('access_token');

    constructor() {
        makeAutoObservable(this);
    }

    setUserInfo(info: BaseUserInfo) {
        this.userInfo = info;
        localStorage.setItem('user_base_info', JSON.stringify(info));
    }

    setToken(token: string) {
        this.token = token;
        localStorage.setItem('access_token', token);
    }

    clearToken() {
        this.token = null;
        this.userInfo = null;
        localStorage.removeItem('access_token');
    }
}