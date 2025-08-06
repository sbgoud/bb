import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [manualNavigationHandled, setManualNavigationHandled] = useState(false);
  return (
    <AppContext.Provider value={{ manualNavigationHandled, setManualNavigationHandled }}>
      {children}
    </AppContext.Provider>
  );
};
