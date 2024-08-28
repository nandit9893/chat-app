import React, { useContext, useEffect, useState } from "react";
import "./ProfileUpdate.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../Context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const ProfileUpdate = () => {
  const { url, userDataLogin, fetchData } = useContext(AppContext);
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
  });

  const [image, setImage] = useState(null);
  const [initialAvatar, setInitialAvatar] = useState(""); 

  useEffect(() => {
    const initializeProfileData = async () => {
      if (!userDataLogin) {
        await fetchData(); 
      } else {
        setProfileData({
          name: userDataLogin.name || "",
          bio: userDataLogin.bio || "Hey, there I'm using this chat.",
        });
        setInitialAvatar(userDataLogin.avatar || assets.avatar_icon);
      }
    };
    initializeProfileData();
  }, [userDataLogin, fetchData]);

  const onChangeHandler = (event) => {
    const { name, value, files } = event.target;
    if (name === "avatar") {
      setImage(files[0]);
    } else {
      setProfileData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    let newUrl = url + "/chatapp/users/profileupdate";
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      if (profileData.name) {
        formData.append("name", profileData.name);
      } else {
        toast.error("Please enter your name");
      }
      if (profileData.bio) {
        formData.append("bio", profileData.bio);
      } 
      if (image) {
        formData.append("avatar", image);
      }
      const response = await axios.patch(newUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success("Profile updated successfully");
        await fetchData();
        navigate("/chat");
      } else {
        toast.error(response.data.message || "Error updating profile");
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
    <div className="profile">
      <div className="profile-container">
        <form onSubmit={onSubmitHandler}>
          <h3>Profile Details</h3>
          <label htmlFor="avatar">
            <input onChange={onChangeHandler} name="avatar" type="file" id="avatar" accept=".png, .jpg, .jpeg" hidden />
            <img src={image ? URL.createObjectURL(image) : initialAvatar} alt="Profile" />
            Upload profile image
          </label>
          <input onChange={onChangeHandler} name="name" value={profileData.name} type="text" placeholder="Your name" required />
          <textarea onChange={onChangeHandler} name="bio" value={profileData.bio} placeholder="Write profile bio" required></textarea>
          <button type="submit">Save</button> 
        </form>
        <div className="profile-pic">
          <img src={image ? URL.createObjectURL(image) : initialAvatar} alt="Profile Preview" />
          <button onClick={()=>navigate("/chat")}>Home</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileUpdate;
