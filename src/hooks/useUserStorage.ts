import { useEffect, useState } from "react";

const STORAGE_KEY = "invested_user";


export function useUserStorage() {

  const [user, setUser] = useState<any>(() => {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    return saved
      ? JSON.parse(saved)
      : null;

  });


  useEffect(() => {

    if(user) {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(user)
      );

    }

  }, [user]);


  function saveUser(data:any){

    setUser(data);

  }


  function clearUser(){

    localStorage.removeItem(STORAGE_KEY);
    setUser(null);

  }


  return {
    user,
    saveUser,
    clearUser
  };

}