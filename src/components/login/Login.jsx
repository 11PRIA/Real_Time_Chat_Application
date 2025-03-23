import "./login.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState } from "react";
import { createUserWithEmailAndPassword ,signInWithEmailAndPassword} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const Login = () => {
  // const [avatar, setAvatar] = useState({
  //   file: null,
  //   url: "",
  // });

  const [loading, setLoading] = useState(false);

  // const handleAvatar = (e) => {
  //   if (e.target.files[0]) {
  //     setAvatar({
  //       file: e.target.files[0],
  //       url: URL.createObjectURL(e.target.files[0]),
  //     });
  //   }
  // };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);
  
    // Validate inputs
    if (!username || !email || !password) {
      toast.error("All fields are required!");
      setLoading(false); // Stop loading spinner
      return;
    }
  
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      setLoading(false); // Stop loading spinner
      return;
    }
  
    try {
      // Create the user with email and password
      const res = await createUserWithEmailAndPassword(auth, email, password);
  
      // Create user data to save in Firestore
      const userData = {
        username,
        email,
        id: res.user.uid,
        blocked: [],
      };
  
      // Save the user data to Firestore
      await setDoc(doc(db, "users", res.user.uid), userData);
  
      // Initialize an empty chats document for the user
      await setDoc(doc(db, "userChats", res.user.uid), { chats: [] });
  
      // Show success toast
      toast.success("Account created successfully!");
    } catch (err) {
      console.error("Error during registration:", err.code, err.message);
  
      // Show error toast if something fails
      toast.error(err.message || "Failed to create account.");
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };
  
  

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!");
    } catch (err) {
      console.error("Error during login:", err);
      toast.error(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    } 
  };

  return (
    <div className="login">
      <div className="item">
        <h2>Welcome back,</h2>
        <form onSubmit={handleLogin}>
          <input type="text" name="email" placeholder="Email" />
          <input type="password" name="password" placeholder="Password" />
          <button disabled={loading}>{loading? "Loading":"Sign In"}</button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
  <input type="text" name="username" placeholder="Username" />
  <input type="email" name="email" placeholder="Email" />
  <input type="password" name="password" placeholder="Password" />
  <button type="submit" disabled={loading}>{loading? "Loading":"Sign Up"}</button>
</form>

      </div>
    </div>
  );
};

export default Login;
