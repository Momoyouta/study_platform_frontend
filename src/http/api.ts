import http from "./http.js";

export const login = (account: string, pwd: string) => {
    return http.post('/auth/login', {
        account,
        pwd
    });
}

export const register = (data: any) => {
    return http.post('/auth/register', data);
}

export const jwtAuth = (accessToken: string) => {
    return http.post('/auth/jwtAuth', {
        accessToken
    });
}

export const getUserProfile = (id: string) => {
    return http.get(`/user/profile/${id}`);
}

export const applySchool = (data: any) => {
    return http.post('/school/applySchool', data);
}

export const uploadImageTemp = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return http.post('/file/upload/imageTemp', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}