import { observer } from 'mobx-react-lite'
import Store from "@/store/index.ts";
import http from "@/http/http.js";

const Login = observer(() => {

    const test = async () => {
        await http.get('/test',{params: {a:'1'}})
            .then(res => {
                let a;
                if(res.data) {
                    console.log(res.data);
                    a = res.data
                }
                console.log(a);
                const { b } = a;
                console.log(b);
            })
            .catch(err => console.log(err));
    }

    return (
        <div>
            <h1>Login Page</h1>
            <button onClick={() => Store.UserStore.addCount()}>
                count is {Store.UserStore.count}
            </button>
            <button onClick={test}>
                HTTP
            </button>
        </div>
    )
})

export default Login

