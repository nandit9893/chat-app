import { User } from "../models/user.models.js";
import { Message } from "../models/usermessages.models.js";
import { Chat } from "../models/userchat.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import convertTimeStamp from "../utils/timestamp.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token and refresh token"
    );
  }
};

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username?.trim()) {
      return res.status(400).json({
        success: false,
        message: "User name is required",
      });
    }
    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email name is required",
      });
    }
    if (!password?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Password name is required",
      });
    }
    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existedUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }
    const user = await User.create({
      username: username.toLowerCase(),
      email,
      password,
    });
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      return res.status(404).json({
        success: false,
        message:
          "Some thing went wrong while registering please try again later",
      });
    }
    return res.status(201).json({
      success: true,
      data: createdUser,
      message: "User registered successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while registering user",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isRefreshTokenAvailable = user.refreshToken;
    if (isRefreshTokenAvailable !== null) {
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Login Attempt Notification",
        text: "Someone is trying to log in to your account. If it was you, please ignore this message. Otherwise, please secure your account.",
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error sending email", error);
        } else {
          console.log("Email sent : " + info.response);
        }
      });

      return res.status(409).json({
        success: false,
        message:
          "You are already logged in. A login attempt notification has been sent to your email.",
      });
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure cookie in production
      sameSite: "Strict",
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged in successfully"
        )
      );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while logging in",
    });
  }
};

const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: "",
        },
      },
      {
        new: true,
      }
    );
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while logging out");
  }
};

const profileUpdate = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const avtarLocalPath = req.file?.path;
    if (!name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Enter your name",
      });
    }

    const user = await User.findById(req.user?._id).select("avatar bio");
    let avatarURL = user.avatar;
    if (avtarLocalPath) {
      if (avatarURL) {
        await deleteFromCloudinary(user.avatar, "avatar");
      }
      const { url } = await uploadOnCloudinary(avtarLocalPath);
      avatarURL = url;
    }

    const updatedBio = bio ? bio : user.bio;
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          name,
          bio: updatedBio || "Hey, there I'm using this chat !!",
          avatar: avatarURL ? avatarURL : null,
        },
      },
      { new: true }
    ).select("-password");
    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating profile",
      error: error.message,
    });
  }
};

const getUserDataForRight = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid user",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error retrieving user data:", error.message);
    return res
      .status(500)
      .json(
        new ApiResponse(500, {}, "An error occurred while retrieving user data")
      );
  }
};

const userDataWithNameLeftSide = async (req, res) => {
  try {
    const { name } = req.query;
    const loggedInUser = req.user._id;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required for search",
      });
    }

    const user = await User.find({
      name: { $regex: name, $options: "i" },
      _id: { $ne: loggedInUser }, // Exclude the logged-in user
    }).select("-password -refreshToken");

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No user found with this name",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error retrieving users by name:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving users by name",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, newPassword, newPasswordAgain } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Enter email",
      });
    }

    if (!newPassword || !newPasswordAgain) {
      return res.status(400).json({
        success: false,
        message: "Please enter the new passwords",
      });
    }

    if (newPassword !== newPasswordAgain) {
      return res.status(400).json({
        success: "false",
        message: "Password not matched",
      });
    }

    const userFound = await User.findOne({ email: email });

    if (!userFound) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(userFound._id, { password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

const startChat = async (req, res) => {
  const { receiverId } = req.body;
  if (!receiverId) {
    return res
      .status(400)
      .json({ success: false, message: "Receiver ID is required" });
  }
  try {
    const existingChat = await Chat.findOne({
      senderId: req.user._id,
      receiverId: receiverId,
    });
    if (existingChat) {
      return res.status(409).json({
        success: false,
        message: "Chat already exists with this user",
        chat: existingChat,
      });
    }
    const newMessage = await Message.create({
      messages: [],
    });
    const newChatFromLoggedInUser = await Chat.create({
      senderId: req.user._id,
      receiverId,
      lastMessage: "",
      messageId: newMessage._id,
    });
    const newChatFromTheFriendWithWhomLoggedInUserChatting = await Chat.create({
      senderId: receiverId,
      receiverId: req.user._id,
      lastMessage: "",
      messageId: newMessage._id,
    });
    return res.status(201).json({
      success: true,
      message: "Chat started successfully",
      chat: newChatFromLoggedInUser,
    });
  } catch (error) {
    console.error("Error starting chat:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to start chat" });
  }
};

const loginUserFriendList = async (req, res) => {
  const loggedInUser = req.user._id;
  const chats = await Chat.find({
    $or: [
      { senderId: { $ne: loggedInUser }, receiverId: loggedInUser },
      { receiverId: { $ne: loggedInUser }, senderId: loggedInUser },
    ],
  }).sort({ updatedAt: -1 });
  const friendList = [];
  for (const chat of chats) {
    const friendId =
      chat.senderId.toString() === loggedInUser.toString()
        ? chat.receiverId
        : chat.senderId;
    const isFriendAlreadyAdded = friendList.some(
      (entry) => entry._id.toString() === friendId.toString()
    );
    if (isFriendAlreadyAdded) continue;
    const friendData = await User.findById(friendId);
    const newEntry = {
      lastMessage: chat.lastMessage,
      name: friendData.name,
      bio: friendData.bio,
      avatar: friendData.avatar,
      _id: friendId,
      messageSeen: chat.messageSeen,
      lastMessageSenderId: chat.senderId,
      receiverId: chat.loggedInUser,
    };
    friendList.push(newEntry);
  }

  return res.status(200).json({
    success: true,
    message: "User login data fetched successfully",
    data: friendList,
  });
};

const dataOfFriendWithLoggedInUserChatting = async (req, res) => {
  try {
    const { _id } = req.query;
    if (!_id) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }
    const findData = await User.findById(_id);
    if (!findData) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ success: true, user: findData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const messageFromCurrentChatUser = async (req, res) => {
  try {
    const { _id } = req.query;
    const loggedInUser = req.user._id;
    const chat = await Chat.findOne({
      $or: [
        { senderId: loggedInUser, receiverId: _id },
        { receiverId: _id, senderId: loggedInUser },
      ],
    });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "no chat found",
      });
    }
    const messageArray = await Message.findById(chat.messageId);
    if (!messageArray) {
      return res.status(404).josn({
        success: false,
        message: "no messages found",
      });
    }
    return res.status(200).json({
      success: true,
      message: messageArray,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const sendMessages = async (req, res) => {
  try {
    const { _id } = req.query;
    const loggedInUser = req.user._id;
    const { content } = req.body;
    const imageSendPath = req.file?.path;
    if (!content && !imageSendPath) {
      return res.status(400).json({
        success: false,
        message: "Please provide content or upload an image",
      });
    }

    let imageSendUrl = "";
    if (imageSendPath) {
      const uploadResponse = await uploadOnCloudinary(imageSendPath);
      if (!uploadResponse || !uploadResponse.url) {
        return res.status(409).json({
          success: false,
          message: "URL not received from Cloudinary",
        });
      }
      imageSendUrl = uploadResponse.url;
    }
    const chat = await Chat.findOne({
      $or: [
        { senderId: loggedInUser, receiverId: _id },
        { receiverId: _id, senderId: loggedInUser },
      ],
    });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "No chat found",
      });
    }
    const messageArray = await Message.findById(chat.messageId);

    if (!messageArray) {
      return res.status(404).json({
        success: false,
        message: "No message found",
      });
    }
    const newMessage = {
      senderId: loggedInUser,
      content: content || "",
      timestamp: new Date(),
      imageUrl: imageSendUrl || "",
    };

    messageArray.messages.push(newMessage);

    await messageArray.save();

    chat.messageSeen = false;
    chat.lastMessage = content || (imageSendUrl ? "image" : "");
    chat.updatedAt = new Date();
    await chat.save();
    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      chat,
      newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const lastMessageByLoggedInUserOrChatFriend = async (req, res) => {
  const loggedInUser = req.user._id;
  const { _id } = req.query;
  const chat = await Chat.findOne({
    $or: [
      { senderId: loggedInUser, receiverId: _id },
      { receiverId: _id, senderId: loggedInUser },
    ],
  });
  if (!chat) {
    return res.status(404).json({
      success: false,
      message: "no chat found",
    });
  }
  let fetchedResult = {};
  if (chat.lastMessage === "image") {
    fetchedResult.lastData = "image";
  } else {
    fetchedResult.lastData = chat.lastMessage;
  }
  let lastUpdate = chat.updatedAt;
  let lastUpdateResult = convertTimeStamp(lastUpdate);
  fetchedResult.timeUpdate = lastUpdateResult;
  return res.status(200).json({
    message: fetchedResult,
    success: true,
  });
};

const toggleMessageSeen = async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({
        success: false,
        message: "Friend ID is required.",
      });
    }
    const chats = await Chat.find({
      $or: [
        { senderId: loggedInUser, receiverId: friendId },
        { senderId: friendId, receiverId: loggedInUser },
      ],
    }).sort({ updatedAt: -1 });

    if (chats.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No chats found for the specified friend.",
      });
    }

    const friendList = [];

    for (const chat of chats) {
      if (
        chat.senderId.toString() === loggedInUser.toString() ||
        chat.receiverId.toString() === friendId.toString()
      ) {
        if (chat.messageSeen === false) {
          chat.messageSeen = true;
        }
        await chat.save();

        friendList.push({
          _id:
            chat.senderId.toString() === loggedInUser.toString()
              ? chat.receiverId
              : chat.senderId,
          messageSeen: chat.messageSeen,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Message seen status toggled successfully for the specific friend.",
      data: friendList,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while toggling the message seen status.",
    });
  }
};

const friendDataForRightSide = async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    const { friendId } = req.query;
    const selectChatFromUser = await User.findById(friendId);
    if (!selectChatFromUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const chatFromChat = await Chat.find({
      $or: [
        { senderId: loggedInUser, receiverId: friendId },
        { senderId: friendId, receiverId: loggedInUser },
      ],
    });
    if (!chatFromChat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }
    const chatFromMessage = await Message.findOne(chatFromChat.messageId);
    if (!chatFromMessage) {
      return res
        .status(404)
        .json({ success: false, message: "Messages not found" });
    }
    const messageBetweenFriends = chatFromMessage.messages;
    const filteredMessages = messageBetweenFriends.filter(
      (message) => message.imageUrl !== ""
    );
    const imageUrls = filteredMessages.map((message) => message.imageUrl);
    let newEntryFriend = {
      name: selectChatFromUser.name,
      bio: selectChatFromUser.bio,
      avatar: selectChatFromUser.avatar,
      images: imageUrls,
      lastSeen: selectChatFromUser.lastSeen,
    };
    return res.status(200).json({
      success: true,
      message: "Message fetched successfully",
      data: newEntryFriend,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occured :",
    });
  }
};

export {
  registerUser,
  login,
  logout,
  profileUpdate,
  getUserDataForRight,
  userDataWithNameLeftSide,
  forgotPassword,
  startChat,
  loginUserFriendList,
  dataOfFriendWithLoggedInUserChatting,
  messageFromCurrentChatUser,
  sendMessages,
  lastMessageByLoggedInUserOrChatFriend,
  toggleMessageSeen,
  friendDataForRightSide,
};
