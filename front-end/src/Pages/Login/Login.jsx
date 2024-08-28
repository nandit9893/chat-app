import React, { useContext, useEffect, useState } from "react";
import "./Login.css";
import assets from "../../assets/assets";
import { AppContext } from "../../Context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const { url, userDataLogin, fetchData, newName, setNewName } = useContext(AppContext);
  const [currState, setCurrState] = useState("Sign Up");
  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    if (loginSuccess) {
      const { avatar, name, bio } = userDataLogin;
      if (!avatar || !name || !bio) {
        navigate("/profile");
      } else {
        navigate("/chat");
      }
    }
  }, [loginSuccess, userDataLogin, navigate]);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onTermsChange = () => {
    setTermsAccepted((prev) => !prev);
  };

  const handleRegistration = async (newUrl) => {
    const response = await axios.post(newUrl, data);
    if (response.data.success) {
      toast.success("Account created successfully! Please Login");
      setCurrState("Login");
      navigate("/");
    } else {
      toast.error(response.data.message || "Error during registration");
    }
  };

  const handleLogin = async (newUrl) => {
    const response = await axios.post(newUrl, data);
    if (response.data.success) {
      const { accessToken, user } = response.data.data;

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        await fetchData();
        setNewName(user.name);
        setLoginSuccess(true);
        toast.success("Login successful");
      } else {
        toast.error("Access token is missing from the response.");
      }
    } else {
      toast.error(response.data.message || "Error during login");
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    let newUrl = `${url}/chatapp/users/${
      currState === "Sign Up" ? "register" : "login"
    }`;

    if (!data.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!data.password.trim()) {
      toast.error("Password is required");
      return;
    }
    if (!termsAccepted) {
      toast.error("You must agree to the terms of use & privacy policy.");
      return;
    }

    try {
      currState === "Sign Up"
        ? await handleRegistration(newUrl)
        : await handleLogin(newUrl);
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
    <div className="login">
      <img src={assets.logo_big} alt="" className="logo" />
      <form onSubmit={onSubmitHandler} className="login-form">
        <h2>{currState}</h2>
        {
          currState === "Sign Up" && ( <input name="username" onChange={onChangeHandler} value={data.username} type="text" className="form-input" placeholder="Username" required />)
        }
        <input name="email" onChange={onChangeHandler} value={data.email} type="email" className="form-input" placeholder="Email" required />
        <input name="password" onChange={onChangeHandler} value={data.password} type="password" className="form-input" placeholder="Password" required />
        <button type="submit" disabled={!termsAccepted}>
          {
            currState === "Sign Up" ? "Create Account" : "Login now"
          }
        </button>
        <div className="login-term">
        <input type="checkbox" checked={termsAccepted} onChange={onTermsChange} />
          <p>Agree to the terms of use & privacy policy.</p>
        </div>
        <div className="login-forgot">
          {
            currState === "Sign Up" ? 
            (<p className="login-toggle">Already have an account?{" "}<span onClick={() => setCurrState("Login")}>Login here</span></p> ) :
            (<p className="login-toggle">Create an account?{" "}<span onClick={() => setCurrState("Sign Up")}>Sign Up</span></p>)
          }
          {
            currState === "Login" && (<p className="login-toggle">Forgot Password?{" "}<span onClick={() => navigate("/forgot-password")}>Click here</span></p>)
          }
        </div>
      </form>
    </div>
  );
};

export default Login;

