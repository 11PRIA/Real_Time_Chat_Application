import React, { useEffect, useState } from 'react';
import './chatList.css';
import AddUser from './addUser/AddUser';
import { useUserStore } from '../../../lib/userStore';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useChatStore } from '../../../lib/chatStore';

const Chatlist = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
      if (res.exists()) {
        const items = res.data().chats || [];
        if (items.length === 0) {
          console.log("No chats found");
          setChats([]);
          return;
        }

        const promises = items.map(async (item) => {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);
          const user = userDocSnap.exists() ? userDocSnap.data() : null;
          return { ...item, user };
        });

        const chatData = await Promise.all(promises);
        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      } else {
        console.log("No chats found");
        setChats([]);
      }
    });

    return () => {
      unsub();
    };
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);
    if (chatIndex !== -1) {
      userChats[chatIndex].isSeen = true;

      // Update lastMessage with the actual last message from chat if available
      const chatDocRef = doc(db, "chats", chat.chatId);
      const chatDocSnap = await getDoc(chatDocRef);

      if (chatDocSnap.exists()) {
        const chatData = chatDocSnap.data();
        const lastMessage = chatData.messages?.[chatData.messages.length - 1]?.text || "No messages yet";
        userChats[chatIndex].lastMessage = lastMessage;
      }

      const userChatsRef = doc(db, "userchats", currentUser.id);

      try {
        await updateDoc(userChatsRef, {
          chats: userChats,
        });
        changeChat(chat.chatId, chat.user);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const filteredChats = chats.filter((c) => c.user.username.toLowerCase().includes(input.toLowerCase()));

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="Search Icon" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? './minus.png' : './plus.png'}
          alt="Toggle Add Mode"
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{ backgroundColor: chat?.isSeen ? "transparent" : "#5183fe" }}
        >
          <img src="./avatar.png" alt="Avatar" />
          <div className="texts">
            <span>{chat.user.blocked.includes(currentUser.id) ? "User" : chat.user.username}</span>
            <p>{chat.lastMessage || "No messages yet"}</p>
          </div>
        </div>
      ))}
      {addMode && <AddUser />}
    </div>
  );
};

export default Chatlist;
