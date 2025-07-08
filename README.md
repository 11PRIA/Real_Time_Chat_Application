# Real-Time Chat Application

A modern, real-time chat application built with React and Firebase, supporting instant messaging, user authentication, and a sleek, responsive UI.

**Live Demo:** [real-time-chat-application-m5c1.onrender.com](https://real-time-chat-application-m5c1.onrender.com)

---

## 🚀 Features

- 🔒 User Authentication (Firebase)
- 💬 Real-time messaging
- 🟢 Online/offline status indicators
- 🖼️ Media and file sharing
- 📝 User profile management
- 🔔 Notifications
- 🎨 Responsive and modern UI
- 🌙 Light/Dark mode (if supported)
- 🧑‍🤝‍🧑 Group and private chats

---

## 🖼️ Screenshots

> _Add your own screenshots in the `public/` folder and reference them below:_

![Chat UI](public/img.png)

---

## 🛠️ Tech Stack

- **Frontend:** React, CSS
- **Backend/Realtime:** Firebase (Firestore, Auth, Storage)
- **Build Tool:** Vite

---

## 📦 Folder Structure

```
src/
  components/
    chat/         # Chat UI and logic
    detail/       # User/chat details
    list/         # Chat list and user info
    login/        # Login and authentication
    notification/ # Notifications
  lib/
    chatStore.js  # Chat state management
    firebase.js   # Firebase config
    upload.js     # File upload logic
    userStore.js  # User state management
  App.jsx         # Main app component
  main.jsx        # Entry point
  index.css       # Global styles
```

---

## 🏁 Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm

### Installation

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
```

### Running Locally

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

---

## ⚙️ Configuration

1. **Firebase Setup:**

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Authentication, Firestore Database, and Storage.
   - Copy your Firebase config and replace it in `src/lib/firebase.js`.

2. **Environment Variables:**
   - If using environment variables, create a `.env` file and add your Firebase credentials.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

---

## 📄 License

This project is licensed under the MIT License.

---

**Feel free to customize this README further to match your project's specifics!**
