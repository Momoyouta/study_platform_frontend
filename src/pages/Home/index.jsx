import { observer } from 'mobx-react-lite'
import reactLogo from '../../assets/react.svg'
import viteLogo from '/vite.svg'
import '../../App.css'
import Store from "@/store/index.ts";
import ProfileCard from "@/components/profileCard.tsx";
import { Button } from 'antd';
import http from "@/http/http.js";

const Home = observer(() => {
  const test = async () => {
      await http.get('/user/roles/1')
          .then(res => console.log(res))
          .catch(err => console.log(err));
  }
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => Store.UserStore.addCount()}>
          count is {Store.UserStore.count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <ProfileCard></ProfileCard>
      <Button type="primary" onClick={test}>
        test button
      </Button>
    </>
  )
})

export default Home

