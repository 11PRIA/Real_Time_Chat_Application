import { useEffect, useState } from "react"; // Added useState import
import List from "./components/list/List";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase"; // Ensure this is the correct import
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";


const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const [showPreloader, setShowPreloader] = useState(true); // Corrected: Added useState here

  useEffect(() => {
    const preloaderTimeout = setTimeout(() => {
      setShowPreloader(false); // Hide preloader after 5 seconds
    }, 2000);

    const unsub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });

    return () => {
      clearTimeout(preloaderTimeout);
      unsub();
    };
  }, [fetchUserInfo]);

  console.log(currentUser);

  if (isLoading || showPreloader) {
    return (
      <div className="loading">
        <div className="blue-spinner"></div>
        Loading...
      </div>
    );
  }

  return (
    <div className="container">
      {currentUser ? (
        <>
          <List />
          {chatId && <Chat />}
          {chatId && <Detail />}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};



export default App;
