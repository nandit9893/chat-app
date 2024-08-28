import React, { useContext, useCallback, useEffect, useState } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import axios from "axios";
import { AppContext } from "../../Context/AppContext";
import { toast } from "react-toastify";
let userData = {};
let messageContainer = [];
let newID;
let userOnline = null;
let newImage = {};
const ChatBox = ({ selectedUserId }) => {
  const { url, userDataLogin, fetchData, fetchLoginData, newName, chatVisible, setChatVisible } = useContext(AppContext);
  const [sendMessage, setSendMessage] = React.useState({
    messageContent: "",
  });

  useEffect(() => {
    const fetchedData = async () => {
      if (!userDataLogin) {
        await fetchData();
      }
    };
    fetchedData();
  }, [userDataLogin, fetchData]);
  

  const inputHandler = (event) => {
    const { name, value, files } = event.target;
    if (name === "imageUrl") {
      newImage = files[0];
    } else {
      setSendMessage((prev) => ({ ...prev, [name]: value }));
    }
  };

  const sendMessagesToReceiver = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("content", sendMessage.messageContent);
      if (newImage) {
        formData.append("imageUrl", newImage);
      }
  
      const response = await axios.post(
        `${url}/chatapp/chats/send-messagesby-loggedinuser?_id=${newID}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.data.success) {
        fetchMessages(newID);
        setSendMessage({ messageContent: "" });
        newImage = null;
        await fetchLoginData();
      }
    } catch (error) {
      toast.error("Error sending message:", error);
    }
  };

  const fetchMessages = useCallback(
    async (userId) => {
      if (userId) {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await axios.get(
            `${url}/chatapp/chats/message-by-current-chat-user?_id=${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data.success) {
            messageContainer = response.data.message.messages.reverse();
          }
        } catch (error) {
          toast.error(error);  //errr
        }
      }
    },
    [url]
  );

  const fetchUserData = useCallback(
    async (userId) => {
      if (userId) {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await axios.get(
            `${url}/chatapp/chats/friend-data-with-loggedin-user-profile?_id=${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data.success) {
            userData = response.data.user;
            const lastSeen = new Date(response.data.user.lastSeen).getTime();
            const currentTime = Date.now();
            userOnline = currentTime - lastSeen < 70000 ? "true" : "false";
          } else {
            console.log("Failed to fetch user data");
          }
        } catch (error) {
          toast.error(
            "Error fetching user data:",
            error.response || error.message
          );
        }
      }
    },
    [url]
  );

  const manageChat = () => {
    if(chatVisible === true)
    {
      setChatVisible(false);
    }
    else {
      setChatVisible(true);
    }
  }


  const convertTimeStamp = (timestamp) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const minute = date.getMinutes();
    const formattedMinute = minute < 10 ? `0${minute}` : minute;
    if (hour > 12) {
      return hour - 12 + ":" + formattedMinute + " pm";
    } else {
      return hour + ":" + formattedMinute + " am";
    }
  };

  React.useLayoutEffect(() => {
    if (selectedUserId) {
      fetchUserData(selectedUserId);
      fetchMessages(selectedUserId);
      newID = selectedUserId;
    } else {
      userData = null;
      messageContainer = [];
    }
  }, [selectedUserId, fetchUserData, fetchMessages]);

  return (
    <div className={`chat-box ${chatVisible ? "": "hidden"}`}>
      {userData ? (
        <>
          <div className="chat-user">
            <img src={userData?.avatar ? userData.avatar : assets.avatar_icon} alt="" />
            <p>
              {userData.name}{" "}
              {userOnline === "true" ? ( <img className="dot" src={assets.green_dot} alt="Online" /> ) : null}
            </p>
            <img src={assets.help_icon} alt="" className="help"/>
            <img src={assets.arrow_icon} onClick={manageChat} className="arrow" alt="" />
          </div>
          <div className="chat-msg">
            {messageContainer.map((msg) => (
              <div key={msg._id} className={msg.senderId === userData._id ? "r-msg" : "s-msg"}>
                {
                  msg.imageUrl ? ( <img className="msg-img" src={msg.imageUrl} alt="image" /> ) : ( <p className="msg">{msg.content}</p> )
                }
                <div>
                  <img src={msg.senderId === userData._id ? (userData?.avatar ? userData.avatar : assets.avatar_icon) : (userDataLogin?.avatar ? userDataLogin.avatar : assets.avatar_icon)} alt="" />
                  <p>{convertTimeStamp(msg.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input onChange={inputHandler} type="text" name="messageContent" value={sendMessage.messageContent} placeholder="Send a message"/>
            <label htmlFor="sendimage">
              <input onChange={inputHandler} name="imageUrl" type="file" id="sendimage" accept="image/png, image/jpeg, image/jpg" hidden />
              <img src={assets.gallery_icon} alt="" />
            </label>
            <img className={sendMessage.messageContent.trim() === "" || newImage === null ? "send-button" : "active"} disabled={sendMessage.messageContent.trim() === "" || newImage === null} onClick={sendMessagesToReceiver} src={assets.send_button} alt="" />
          </div>
        </>
      ) : (
        <>
          <div className={`default-container ${chatVisible ? "": "hidden"}`}>
            <img src={assets.logo_icon} alt="Default chat app" id="default-logo" />
            <div className="text-container">
              <p className="para">Welcome <span>{newName?.split(" ")[0]}</span></p>
              <p className="para">Your friends are waiting for you!!</p>
            </div>
            <div className="footer">
              <p>Chat any where, any time!!</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBox;
