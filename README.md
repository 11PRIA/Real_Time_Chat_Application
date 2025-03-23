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
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

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
    setText((prev) => prev + e.emoji);
    setOpen(false);
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

      // Update the reactions in the specific message
      const updatedMessages = chat.messages.map((msg) => {
        if (msg.createdAt === messageCreatedAt) {
          return {
            ...msg,
            reactions: {
              ...msg.reactions,
              [currentUser.id]: emoji, // Add or update the reaction for the current user
            },
          };
        }
        return msg;
      });

      // Update Firestore with the new messages array
      await updateDoc(chatDocRef, { messages: updatedMessages });
      console.log("Reaction added successfully!");
    } catch (err) {
      console.error("Error adding reaction:", err);
    }
  };

  const openCamera = async () => {
    setCameraActive(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    setCapturedImage(dataUrl);

    video.srcObject.getTracks().forEach((track) => track.stop());
    setCameraActive(false);
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
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>
      <div className="center">
        {chat?.messages?.map((message) => (
          <div
            className={message.senderId === currentUser?.id ? "message own" : "message"}
            key={message?.createdAt}
            onClick={() => setOpenReactionPicker(message.createdAt)}
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
              {openReactionPicker === message.createdAt && (
                <div className="picker">
                  <EmojiPicker
                    onEmojiClick={(emojiObject) => {
                      handleAddReaction(message.createdAt, emojiObject.emoji);
                      setOpenReactionPicker(null);
                    }}
                  />
                </div>
              )}
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
      {cameraActive && (
        <div className="camera">
          <video ref={videoRef} autoPlay></video>
          <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
          <button onClick={captureImage}>Capture</button>
          <button onClick={() => setCameraActive(false)}>Close</button>
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
