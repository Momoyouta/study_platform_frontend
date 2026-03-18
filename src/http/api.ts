import http from "./http.js";

export const login = (account: string, pwd: string) => {
    return http.post('/auth/login', {
        account,
        pwd
    });
}