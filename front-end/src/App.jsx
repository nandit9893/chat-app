import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './Pages/Login/Login'
import Chat from './Pages/Chat/Chat'
import ProfileUpdate from './Pages/ProfileUpdate/ProfileUpdate'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ForgotPassword from './Pages/ForgotPassword/ForgotPassword'
const App = () => {
  return (
    <>
    <ToastContainer/>
    <Routes>
      <Route path="/" element={<Login/>} />
      <Route path="/chat" element={<Chat/>} />
      <Route path="/profile" element={<ProfileUpdate/>} />
      <Route path="/forgot-password" element={<ForgotPassword/>} />
    </Routes>
    </>
  )
}

export default App