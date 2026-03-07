import { useState } from "react";
import {useNavigate } from "react-router-dom";

function Login() {

  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {

    const url = isLogin
      ? "http://localhost:5000/api/login"
      : "http://localhost:5000/api/register";

    const body = isLogin
      ? { email, password }
      : { name, email, password };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Something went wrong");
      return;
    }

    if (isLogin) {
      localStorage.setItem("token", data.token);
      alert("Login successful 🎉");
      navigate("/");
    } else {
      alert("Account created successfully 🎉");
      setIsLogin(true);
    }

  };

  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <h2>{isLogin ? "Login" : "Create Account"}</h2>

        {!isLogin && (
          <input
            style={styles.input}
            type="text"
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.button} onClick={handleSubmit}>
          {isLogin ? "Login" : "Sign Up"}
        </button>

        <p style={{ marginTop: "15px" }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
        </p>

        <button
          style={styles.switchBtn}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Sign Up" : "Login"}
        </button>

      </div>

    </div>
  );
}

const styles = {

  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f8"
  },

  card: {
    width: "320px",
    padding: "30px",
    borderRadius: "10px",
    background: "white",
    boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
    textAlign: "center"
  },

  input: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc"
  },

  button: {
    width: "100%",
    padding: "10px",
    marginTop: "15px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  switchBtn: {
    background: "none",
    border: "none",
    color: "#4CAF50",
    cursor: "pointer",
    fontWeight: "bold"
  }

};

export default Login;