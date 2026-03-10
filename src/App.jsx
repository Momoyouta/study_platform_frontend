import { observer } from 'mobx-react-lite'
import { Outlet } from 'react-router-dom'
import Store, { StoreProvider } from "@/store/index.ts";
import './App.css'

const App = observer(() => {
  return (
    <StoreProvider value={Store}>
      <Outlet />
    </StoreProvider>
  )
})

export default App
