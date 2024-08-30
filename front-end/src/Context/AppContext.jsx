import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";
const AppContext = createContext();
const AppContextProvider = ({ children }) => {
  const url = "https://chat-app-3xj0.onrender.com";
  const [userDataLogin, setUserDataLogin] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [logFetchData, setLogFetchData] = useState([]);
  const [newName, setNewName] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const fetchData = async () => {
    const newURL = `${url}/chatapp/users/getuserdataright`;
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const response = await axios.get(newURL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserDataLogin(response.data.user);
      } else {
        toast.error("No access token found");
      }
    } catch (error) {
      toast.error("Failed to fetch user data");
    }
  };

  const searchUsers = async (name) => {
    const searchURL = `${url}/chatapp/users/userdata/withname/leftside?name=${name}`;
    if (!name.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(searchURL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSearchResults(response.data.user);
        if (response.data.user.length === 0) {
          toast.info("No user found with this name");
        }
      } else {
        setSearchResults([]);
        toast.info(response.data.message || "No user found with this name");
      }
    } catch (error) {
      toast.error("User no found");
    }
  };

  const fetchLoginData = async () => {
    const newURL = `${url}/chatapp/chats/login-user-getting-friend-list`;
    const token = localStorage.getItem("accessToken");
    if (token) {
      const response = await axios.get(newURL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        if (response.data.data.length === 0) {
        }
        setLogFetchData(response.data.data);
      }
    }
  };

  const contextValues = {
    url,
    userDataLogin,
    fetchData,
    searchUsers,
    searchResults,
    logFetchData,
    fetchLoginData,
    newName,
    setNewName,
    chatVisible,
    setChatVisible,
    selectedUserId,
    setSelectedUserId
  };

  return (
    <AppContext.Provider value={contextValues}>{children}</AppContext.Provider>
  );
};

export { AppContext, AppContextProvider };
