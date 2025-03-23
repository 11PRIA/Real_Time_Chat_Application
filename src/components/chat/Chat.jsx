import { useRef, useEffect, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, storage } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const [openReactionPicker, setOpenReactionPicker] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null); // Track selected message for reaction
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isRinging, setIsRinging] = useState(false); // New state for ringing status

  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
  const { currentUser } = useUserStore();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    if (!chatId) return;
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });
    return () => {
      unSub();
    };
  }, [chatId]);

  const handleEmoji = (e) => {
    if (selectedMessage) {
      handleAddReaction(selectedMessage.createdAt, e.emoji);
      setOpen(false);
      setSelectedMessage(null); // Reset selected message after reaction
    } else {
      setText((prev) => prev + e.emoji);
      setOpen(false);
    }
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleSend = async () => {
    if (text === "" && !img.file && !capturedImage) return;

    let imgUrl = null;

    try {
      const chatDocRef = doc(db, "chats", chatId);

      if (img.file) {
        const storageRef = ref(storage, `chatImages/${new Date().getTime()}_${img.file.name}`);
        const uploadResult = await uploadBytes(storageRef, img.file);
        imgUrl = await getDownloadURL(uploadResult.ref);
      } else if (capturedImage) {
        const storageRef = ref(storage, `chatImages/${new Date().getTime()}_captured.png`);
        const uploadResult = await uploadBytes(
          storageRef,
          await (await fetch(capturedImage)).blob()
        );
        imgUrl = await getDownloadURL(uploadResult.ref);
      }

      await updateDoc(chatDocRef, {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date().toISOString(),
          reactions: {},
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      console.log("Message sent successfully!");
    } catch (err) {
      console.error("Error sending message:", err);
    }

    setImg({ file: null, url: "" });
    setCapturedImage(null);
    setText("");
  };

  const handleAddReaction = async (messageCreatedAt, emoji) => {
    try {
      const chatDocRef = doc(db, "chats", chatId);

      const updatedMessages = chat.messages.map((msg) => {
        if (msg.createdAt === messageCreatedAt) {
          return {
            ...msg,
            reactions: {
              ...msg.reactions,
              [currentUser.id]: emoji,
            },
          };
        }
        return msg;
      });

      await updateDoc(chatDocRef, { messages: updatedMessages });
      console.log("Reaction added successfully!");
    } catch (err) {
      console.error("Error adding reaction:", err);
    }
  };

  const openCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    console.log(video.videoWidth, video.videoHeight); // Log the video dimensions

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    setCapturedImage(dataUrl);

    video.srcObject.getTracks().forEach((track) => track.stop());
    setCameraActive(false);
  };

  const closeCamera = () => {
    const video = videoRef.current;
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    setCapturedImage(null); // Reset captured image
  };

  const startVoiceCall = () => {
    setIsVoiceCallActive(true);
    setIsRinging(true); // Set ringing to true when the call starts
  };

  const endVoiceCall = async () => {
    try {
      setIsVoiceCallActive(false);
      setIsRinging(false); // Stop ringing when the call ends

      const chatDocRef = doc(db, "chats", chatId);

      // Construct the message for the current user
      const currentUserMessage = {
        senderId: currentUser.id,
        text: "The call has ended.",
        createdAt: new Date().toISOString(),
        reactions: {},
      };

      // Construct the message for the other user (missed call)
      const otherUserMessage = {
        senderId: user?.id, // This is the other user's ID
        text: "You have missed the audio call.",
        createdAt: new Date().toISOString(),
        reactions: {},
      };

      // Update the chat with both messages
      await updateDoc(chatDocRef, {
        messages: arrayUnion(currentUserMessage, otherUserMessage),
      });

      console.log("Call ended messages sent successfully!");
    } catch (err) {
      console.error("Error sending call ended message:", err);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    setIsSpeaker(!isSpeaker);
  };

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setOpen(true); // Open the emoji picker when a message is clicked
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <span>{user?.username}</span>
          </div>
        </div>
        <div className="icons">
          <img
            src="./phone.png"
            alt="Voice Call"
            onClick={startVoiceCall}
          />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>
      <div className="center">
        {chat?.messages?.map((message) => (
          <div
            className={message.senderId === currentUser?.id ? "message own" : "message"}
            key={message?.createdAt}
            onClick={() => handleMessageClick(message)} // Add onClick event here
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="Message Attachment" />}
              <p>{message.text}</p>
              <div className="reactions">
                {message.reactions &&
                  Object.entries(message.reactions).map(([userId, reaction]) => (
                    <span key={userId}>{reaction}</span>
                  ))}
              </div>
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}
        {capturedImage && (
          <div className="message own">
            <div className="texts">
              <img src={capturedImage} alt="Captured" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>

      {/* Ringing message */}
      {isRinging && (
        <div className="ringing-message">
          <span>Ringing...</span>
        </div>
      )}

      {/* Voice Call UI */}
      {isVoiceCallActive && (
        <div className="voice-call-container active">
          <div className="call-info">
            <img src="./avatar.png" alt="User Avatar" />
            <span>{user?.username}</span>
          </div>
          <div className="call-actions">
            <img
              src={isMuted ? "./unmute.png" : "./mute.png"}
              alt="Mute"
              className={isMuted ? "unmute" : "mute"}
              onClick={toggleMute}
            />
            <img
              src={isSpeaker ? "./speaker-on.png" : "./speaker-off.png"}
              alt="Speaker"
              className={isSpeaker ? "active" : ""}
              onClick={toggleSpeaker}
            />
            <div className="end-call" onClick={endVoiceCall}>
              <img src="./end-call.png" alt="End Call" />
            </div>
          </div>
        </div>
      )}

      {/* Camera Container */}
      {cameraActive && (
        <div className="camera-container">
          <video ref={videoRef} autoPlay></video>
          <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
          <div className="controls">
            <button onClick={captureImage}>Capture</button>
            <button className="close" onClick={closeCamera}>Close</button>
          </div>
        </div>
      )}

      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input type="file" id="file" style={{ display: "none" }} onChange={handleImg} />
          <img src="./camera.png" alt="" onClick={openCamera} />
          <img src="./mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img src="./emoji.png" alt="" onClick={() => setOpen((prev) => !prev)} />
          {open && (
            <div className="picker">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
