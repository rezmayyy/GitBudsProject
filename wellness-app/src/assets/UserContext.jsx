import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged} from 'firebase/auth';

const UserContext = createContext();

export function UserProvider ({ children })  {
    const [user, setUser] = useState(null);
    useEffect(() => {
        const auth = getAuth();
        const whenAuthChanged = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                setUser(null);
                localStorage.removeItem('user');
            }
        });

        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && !user) {
            setUser(storedUser);
        }

        return () => whenAuthChanged();
    }, [user]);
    
    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
