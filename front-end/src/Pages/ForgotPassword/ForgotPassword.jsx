import React, { useContext, useState } from 'react';
import './ForgotPassword.css';
import assets from "../../assets/assets";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../Context/AppContext';
import { toast } from 'react-toastify';
const ForgotPassword = () => {
  const navigate = useNavigate(null);
  const { url } = useContext(AppContext);
  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
    newPasswordAgain: "",
  });

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (formData.newPassword !== formData.newPasswordAgain) {
      toast.error("Passwords do not match");
      return; 
    }
    const response = await axios.post(
      `${url}/chatapp/users/forgot/password`,
      {
        email: formData.email,
        newPassword: formData.newPassword,
        newPasswordAgain: formData.newPasswordAgain,
      }
    );
    if (response.data.success) {
      navigate("/");
      toast.success("Password reset successfully");
    } else {
      if (response.data.message === "Enter email") {
        toast.error("Enter email");
      } else if (response.data.message === "User not found") {
        toast.error("Invalid email");
      } else {
        toast.error("An unknown error occurred");
      }
    }
  };

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setFormData((prev) => {
      return { ...prev, [name]: value };
    });
  };

  return (
    <div className="forgot">
      <img src={assets.logo_big} alt="" className="logo" />
      <div className="forgot-div">
        <form onSubmit={onSubmitHandler} className="forgot-form">
          <h2>Reset Password</h2>
          <input onChange={onChangeHandler} name="email" value={formData.email} type="email" className="form-input" placeholder="Enter your email or user name" required />
          <input onChange={onChangeHandler} name="newPassword" value={formData.newPassword} type="password" className="form-input" placeholder="Enter new password" required />
          <input onChange={onChangeHandler} name="newPasswordAgain" value={formData.newPasswordAgain} type="password" className="form-input" placeholder="Enter again new password" required />
          <button type="submit">Reset Password</button>
        </form>
        <button id="home-button" onClick={() => navigate("/")}>Back to Home</button>
      </div>
    </div>
  );
};

export default ForgotPassword;
