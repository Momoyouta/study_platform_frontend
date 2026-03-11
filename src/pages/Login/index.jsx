import { observer } from 'mobx-react-lite'
import Store from "@/store/index.ts";
import http from "@/http/http.js";

const Login = observer(() => {

    const test = async () => {
        await http.get('/test',{params: {a:'1'}})
            .then(res => console.log(res))
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

