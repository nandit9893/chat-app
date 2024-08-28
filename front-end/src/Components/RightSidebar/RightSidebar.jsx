import React, { useContext, useEffect } from "react";
import "./RightSidebar.css";
import { useNavigate } from "react-router-dom";
import assets from "../../assets/assets";
import { AppContext } from "../../Context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
let newDataReceiver = {};
let IMAGE_URL = [];
let userOnline = null;
const RightSidebar = ({ selectedUserId }) => {
  const navigate = useNavigate();
  const { url, userDataLogin, fetchData } = useContext(AppContext);

  useEffect(() => {
    const fetchedData = async () => {
      if (!userDataLogin) {
        await fetchData();
      }
    };
    fetchedData();
  }, [userDataLogin, fetchData]);

  useEffect(() => {
    const dataForRightSide = async () => {
      if (selectedUserId) {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await axios.get(
            `${url}/chatapp/chats/friend/data/for/right/side?friendId=${selectedUserId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data.success) {
            newDataReceiver = response.data.data;
            IMAGE_URL = newDataReceiver.images;
            const currentTime = Date.now();
            const lastSeen = new Date(response.data.data.lastSeen).getTime();
            userOnline = currentTime - lastSeen < 70000 ? "true" : "false";
          }
        } catch (error) {
        }
      }
    };

    dataForRightSide();
  }, [selectedUserId, url]);

  const logout = async (event) => {
    event.preventDefault();
    const newUrl = `${url}/chatapp/users/logout`;
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        newUrl,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        localStorage.removeItem("accessToken");
        navigate("/");
        toast.success("Logout successful");
      } else {
        toast.error(response.data.message || "Error during logout");
      }
    } catch (error) {
      if (error.response) {
        toast.error(
          error.response.data.message || "An error occurred. Please try again."
        );
      } else if (error.request) {
        toast.error("No response from server. Please try again.");
      } else {
        toast.error("Error in setting up the request. Please try again.");
      }
    }
  };

  return (
    <div className="rs">
      <div className="rs-profile">
        <img src={newDataReceiver?.avatar ? newDataReceiver.avatar : (userDataLogin?.avatar ? userDataLogin.avatar : assets.avatar_icon)} alt="Profile" />
        <h3>
          {
            userOnline === "true" ? ( <img className="dot" src={assets.green_dot} alt="Online" />) : null
          }
          {
            newDataReceiver?.name ? newDataReceiver.name : userDataLogin?.name
          }
        </h3>
        <p>{newDataReceiver?.bio ? newDataReceiver.bio : userDataLogin?.bio}</p>
      </div>
      <hr />
      <div className="rs-media">
        <p>Media</p>
        <div>
          {
            IMAGE_URL.map((url, index) => (
              <img onClick={() => window.open(url)} key={index} src={url} alt="" />
            ))
          }
        </div>
      </div>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default RightSidebar;
