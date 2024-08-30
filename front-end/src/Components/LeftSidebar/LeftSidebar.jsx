import React, { useRef, useState, useContext } from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../Context/AppContext";
import { toast } from "react-toastify";
import ChatBox from "../../Components/ChatBox/ChatBox";
import axios from "axios";
import RightSidebar from "../RightSidebar/RightSidebar";
const LeftSidebar = () => {
  const navigate = useNavigate();
  const { url, searchResults, searchUsers, logFetchData, fetchLoginData, chatVisible, setChatVisible, setSelectedUserId } =
    useContext(AppContext);
  const searchInputRef = useRef(null);


  const searchData = async (event) => {
    event.preventDefault();
    const input = event.target.value;
    if (input.trim() === "") {
      searchUsers("");
      return;
    }
    try {
      await searchUsers(input);
    } catch (error) {
      toast.error("Failed to search users");
    }
  };

  const addChat = async (userId) => {
    setSelectedUserId(userId);
    setChatVisible(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${url}/chatapp/chats/start-chat`,
        { receiverId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success("Chat initiated");
        if (searchInputRef.current) {
          searchInputRef.current.value = "";
        }
        searchUsers("");
      } else {
        toast.error(response.data.message || "Error starting chat");
      }
    } catch (error) {
      toast.error("Error starting chat: " + error.message);
    }
  };

  const handleToggleClick = async (FRIENDID) => {
    setSelectedUserId(FRIENDID);
    setChatVisible(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${url}/chatapp/chats/toggle/last/seen/logged/user`,
        { friendId: FRIENDID },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        await fetchLoginData();
      }
    } catch (error) {
      toast.error("Error toggling chat status: " + error.message);
    }
  };

  const logout = async (event) => {
    event.preventDefault();
    const logoutUrl = `${url}/chatapp/users/logout`;
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(logoutUrl, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        localStorage.removeItem("accessToken");
        navigate("/");
        toast.success("Logout successful");
      } else {
        toast.error(response.data.message || "Error during logout");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred. Please try again."
      );
    }
  };

  React.useLayoutEffect(() => {
    const fetchData = async () => {
      await fetchLoginData();
    };
    fetchData();
  }, [fetchLoginData]);

  return (
    <div className={`ls ${chatVisible ? "hidden" : ""}`}>
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} alt="Logo" className="logo" />
          <div className="menu">
            <img src={assets.menu_icon} alt="Menu Icon" />
            <div className="sub-menu">
              <p onClick={() => navigate("/profile")}>Edit Profile</p>
              <hr />
              <p onClick={logout}>Logout</p>
            </div>
          </div>
        </div>
        <div className="ls-search">
          <img src={assets.search_icon} alt="Search Icon" />
          <input ref={searchInputRef} onChange={searchData} type="text" placeholder="Search here" />
        </div>
      </div>
      <div className="ls-list">
        {
          searchResults.length > 0 ? searchResults.map((user) => (
              <div onClick={() => addChat(user._id)} key={user._id} className="friends add-user">
                <img src={user?.avatar ? user.avatar : assets.avatar_icon} alt="User Avatar" />
                <div>
                  <p>{user.name}</p>
                  <span>
                    {
                      user.bio.length <= 25 ? user.bio : `${user.bio.slice(0, 25)}...`
                    }
                  </span>
                </div>
              </div>
            )) : 
            logFetchData && logFetchData.length > 0 ? logFetchData.map((result) => (
              <div key={result._id} onClick={() => handleToggleClick(result._id)} className={`friends ${(result.messageSeen === true || result._id !== result.lastMessageSenderId) ? "" : "unseen"}`}>
                <img src={result?.avatar ? result.avatar : assets.avatar_icon} alt={result.name} />
                <div>
                  <p>{result.name}</p>
                  <span>
                    {
                      result.lastMessage ? result.lastMessage === "image" ? "image" : (result.lastMessage.length < 25 ? result.lastMessage : result.lastMessage.slice(0, 25) + "...") : (result.bio.length < 25 ? result.bio : result.bio.slice(0, 25) + "...") 
                    }
                  </span>
                </div>
              </div>
            )) : 
          null
        }
      </div>
    </div>
  );
};

export default LeftSidebar;
