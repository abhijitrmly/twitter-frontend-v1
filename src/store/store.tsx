import React, {
    useMemo,
    createContext,
    useContext,
    useState,
    useEffect,
  } from "react";
  import axios, { AxiosInstance } from "axios";
  import LocalForage from 'localforage';
  
  const StoreContext = createContext({});
  const AuthContext = createContext({});
  
  import { ChildrenProps, LoginFunction, RegisterFunction } from '../types/sharedTypes';
  
  /**
   * @function ApiProvider API route provider
   */
  export function ApiProvider({ children }: ChildrenProps) {
    // The query string parsed to an object.
    // It will be an empty object during prerendering if the
    // page doesn't have data fetching requirements.
  
    const apiClient: AxiosInstance = useMemo(() => {
      return axios.create({
        baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }, []);
  
    return (
      <StoreContext.Provider value={apiClient}>{children}</StoreContext.Provider>
    );
  }
  
  /**
   * @method useApi hook for using api
   */
  export function useApi() {
    return useContext(StoreContext);
  }
  
  // /**
  //  * @function AuthProvider Auth store provider
  //  */
  export function AuthProvider({ children }: ChildrenProps) {
    const [token, setToken] = useState<string | null>(null);
    /* decoded jwt to use while user auth hydration is still in flight */
    const [jwt, setJwt] = useState(null);
    const [user, setUser] = useState(null);
  
    const ISSERVER = typeof window === "undefined";
  
    useEffect(() => {
      const setTokenFromLocalStorage = async() => {
        const value: string | null = await LocalForage.getItem('token');
        setToken(value);
      }
      if (!ISSERVER) {
        setTokenFromLocalStorage();
      }
    }, [ISSERVER]);
  
    const apiClient = useApi() as AxiosInstance;
  
    useEffect(() => {
      const handleTokenChange = () => {
        LocalForage.setItem('token', token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        apiClient.get("auth/me").then((res) => {
          const { data = {} } = res;
          const { data: userData = {} } = data;
  
          if (userData._id) {
            setUser(userData);
          }
        });
      }
  
      if (token) {
        handleTokenChange();
      } else {
        // @ts-ignore
        delete apiClient.defaults.headers.authorization;
      }
    }, [apiClient, token]);
  
    const register = async ({ name, email, password, companyName }: RegisterFunction) => {
      const config = {
      };
  
      const body = JSON.stringify({ name, email, password, company: companyName });
  
      try {
        const registerResponse = await apiClient
          .post("auth/register", body, config)
          .then((res) => res.data);
        setToken(registerResponse.token);
      } catch (err) {
        setToken(null);
        setUser(null);
      }
    };
  
    const login = async ({ email, password }: LoginFunction) => {
      // do login LoginFunction
      const config = {
      };
  
      const body = JSON.stringify({ email, password });
  
      try {
        const registerResponse = await apiClient
          .post("auth/login", body, config)
          .then((res) => res.data);
        setToken(registerResponse.token);
      } catch (err) {
        setToken(null);
        setUser(null);
      }
      // set token
    };
  
    const logout = () => {
      setToken(null);
      setUser(null);
      LocalForage.removeItem('token');
    }
  
    return (
      <AuthContext.Provider value={{ register, user, login, logout }}>{children}</AuthContext.Provider>
    );
  }
  
  /**
   * @method useApi hook for using api
   */
  export function useAuth() {
      return useContext(AuthContext);
  }
    
  
  /**
   * @method StoreProvider providers single store
   */
  export default function StoreProvider({ children }: ChildrenProps) {
    return (
      <ApiProvider>
        <AuthProvider>{children}</AuthProvider>
      </ApiProvider>
    );
  }
  