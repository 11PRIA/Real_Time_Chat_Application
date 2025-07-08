import React, { useState } from "react";
import "./addUser.css";
import { db } from "../../../../lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = () => {
  const [user, setUser] = useState(null);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username").trim();

    if (!username) {
      console.error("Username input is empty.");
      return;
    }

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        setUser(querySnapShot.docs[0].data());
      } else {
        console.log("No user found.");
        setUser(null);
      }
    } catch (err) {
      console.error("Error while searching:", err);
    }
  };

  const handleAdd = async () => {
    const chatRef = collection(db, "chats"); // Reference to 'chats' collection
    const userChatsRef = collection(db, "userchats"); // Reference to 'userchats' collection

    try {
      // Generate a new document reference for a chat
      const newChatRef = doc(chatRef); // Creates a valid DocumentReference for the new chat
      console.log("Generated new chat reference:", newChatRef);

      // Create the new chat document
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });
      console.log("Chat document created with ID:", newChatRef.id);

      const updatedAt = Date.now(); // Timestamp for updates
      const chatDataForUser = {
        chatId: newChatRef.id,
        lastMessage: "",
        receiverId: currentUser.id,
        updatedAt,
      };
      const chatDataForCurrentUser = {
        chatId: newChatRef.id,
        lastMessage: "",
        receiverId: user.id,
        updatedAt,
      };

      // Update or create the document for the other user
      const userDocRef = doc(db, "userchats", user.id); // Correct DocumentReference
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // Update the existing document
        await updateDoc(userDocRef, {
          chats: arrayUnion(chatDataForUser),
        });
      } else {
        // Create a new document if it doesn't exist
        await setDoc(userDocRef, {
          chats: [chatDataForUser],
        });
      }
      console.log("Updated/created userChats for:", user.id);

      // Update or create the document for the current user
      const currentUserDocRef = doc(db, "userchats", currentUser.id); // Correct DocumentReference
      const currentUserDocSnap = await getDoc(currentUserDocRef);

      if (currentUserDocSnap.exists()) {
        // Update the existing document
        await updateDoc(currentUserDocRef, {
          chats: arrayUnion(chatDataForCurrentUser),
        });
      } else {
        // Create a new document if it doesn't exist
        await setDoc(currentUserDocRef, {
          chats: [chatDataForCurrentUser],
        });
      }
      console.log(
        "Updated/created userChats for current user:",
        currentUser.id
      );

      console.log("Chat and userChats updated successfully.");
    } catch (err) {
      console.error(
        "Error while creating chat document:",
        err.message,
        err.code,
        err.details
      );
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button type="submit">Search</button>
      </form>
      {user && (
        <div className="user">
          <div className="detail">
            <img src="/avatar.png" alt="User Avatar" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
