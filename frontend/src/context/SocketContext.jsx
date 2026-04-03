// context/SocketContext.jsx
import { createContext, useContext, useState } from 'react';

const SocketContext = createContext({ unreadCount: 0 });

export const SocketProvider = ({ children }) => {
  const [unreadCount] = useState(0);
  return (
    <SocketContext.Provider value={{ unreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
