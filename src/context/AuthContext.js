import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        // --- FIX START: Ensure parsedUser is an object before accessing properties ---
        if (typeof parsedUser === 'object' && parsedUser !== null) {
          // If profilePicture is missing or null, set it to a default (null or a default image path)
          if (!parsedUser.profilePicture) {
            parsedUser.profilePicture = null; // Or a default image URL if you have one
          }
          setUser(parsedUser);
          setIsLoggedIn(true);
        } else {
          // If sessionStorage contains non-object data (like a plain string '123'), clear it
          console.warn("Invalid user data found in sessionStorage. Clearing...");
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setUser(null);
          setIsLoggedIn(false);
        }
        // --- FIX END ---
      } catch (error) {
        console.error("Failed to parse user from sessionStorage", error);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }
  }, []);

  // Login function
  const login = async (fetchedToken, fetchedUser) => {
    setToken(fetchedToken);
    // --- FIX START: Ensure fetchedUser is an object before setting properties ---
    if (typeof fetchedUser === 'object' && fetchedUser !== null) {
      if (!fetchedUser.profilePicture) {
        fetchedUser.profilePicture = null; // Or default image
      }
      setUser(fetchedUser);
      setIsLoggedIn(true);
      sessionStorage.setItem('token', fetchedToken);
      sessionStorage.setItem('user', JSON.stringify(fetchedUser));
    } else {
      console.error("Login received non-object user data:", fetchedUser);
      // Fallback: Clear any potentially corrupt data
      setUser(null);
      setIsLoggedIn(false);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      throw new Error("Invalid user data received from login. Please try again."); // Re-throw to handle in LoginPage
    }
    // --- FIX END ---
  };

  // Logout function
  const logout = async () => {
    try {
      // Import api dynamically or at the top if possible
      // For now, let's just clear local state first for better UX, then notify backend
      const api = (await import('../utils/api')).default;
      await api.post('/users/logout');
    } catch (error) {
      console.error("Backend logout failed:", error);
    } finally {
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
  };

  // Function to update user data in context and sessionStorage
  const updateUser = (updatedUserData) => {
    setUser(prevUser => {
      // Ensure prevUser is an object before spreading its properties
      const currentPrevUser = (typeof prevUser === 'object' && prevUser !== null) ? prevUser : {};

      const newUserState = {
        ...currentPrevUser, // Keep existing fields not explicitly updated
        ...updatedUserData // Overlay with new data from backend response
      };

      // If profilePicture in updatedUserData is explicitly null (e.g., user removed it)
      // or if it's not provided in updatedUserData, but exists in prevUser, keep prevUser's picture.
      if (updatedUserData.profilePicture === undefined && currentPrevUser.profilePicture) {
        newUserState.profilePicture = currentPrevUser.profilePicture;
      }
      return newUserState;
    });

    const currentsessionStorageUser = JSON.parse(sessionStorage.getItem('user'));
    // Ensure currentsessionStorageUser is an object before spreading its properties
    const parsedsessionStorageUser = (typeof currentsessionStorageUser === 'object' && currentsessionStorageUser !== null) ? currentsessionStorageUser : {};

    const newsessionStorageUser = {
      ...parsedsessionStorageUser,
      ...updatedUserData
    };
    if (updatedUserData.profilePicture === undefined && parsedsessionStorageUser.profilePicture) {
      newsessionStorageUser.profilePicture = parsedsessionStorageUser.profilePicture;
    }
    sessionStorage.setItem('user', JSON.stringify(newsessionStorageUser));
  };

  const authContextValue = {
    user,
    token,
    isLoggedIn,
    login,
    logout,
    updateUser,
    maintenanceMode,
    setMaintenanceMode
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};