import { createContext, useContext } from "react";
import { User } from "./user";

const Store = {
    UserStore: new User(),
}

const StoreContext = createContext(Store);

export const useStore = () => useContext(StoreContext);
export const StoreProvider = StoreContext.Provider;

export default Store;