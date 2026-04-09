// Login / Register screen.
// Toggles between login and sign-up mode via `isLogin` state.
// On successful login, saves the JWT to localStorage and redirects to home.

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {

  // true = login mode | false = register mode
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // ── Submit handler ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {

    const url = isLogin
      ? "http://localhost:5000/api/login"
      : "http://localhost:5000/api/register";

    const body = isLogin
      ? { email, password }
      : { name, email, password };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Logo / Branding */}
        <div style={styles.brand}>
          <span style={styles.brandIcon}>📚</span>
          <h1 style={styles.brandName}>FindBook AI</h1>
        </div>

        <h2 style={styles.title}>
          {isLogin ? "Welcome back" : "Create an account"}
        </h2>
        <p style={styles.subtitle}>
          {isLogin
            ? "Login to access your saved books and recommendations"
            : "Sign up to start discovering books"}
        </p>

        {/* Name field — only visible during registration */}
        {!isLogin && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Your name"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button style={styles.button} onClick={handleSubmit}>
          {isLogin ? "Login" : "Sign Up"}
        </button>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Toggle between login and register */}
        <p style={styles.toggleText}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          {" "}
          <button style={styles.switchBtn} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>

      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {

  container: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f0f0f",
  },

  card: {
    width: "380px",
    padding: "40px 36px",
    borderRadius: "16px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
  },

  // Branding at top of card
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "28px",
    justifyContent: "center",
  },

  brandIcon: {
    fontSize: "28px",
  },

  brandName: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "0.4px",
  },

  title: {
    margin: "0 0 8px",
    fontSize: "22px",
    fontWeight: "600",
    color: "#f0f0f0",
    textAlign: "center",
  },

  subtitle: {
    margin: "0 0 28px",
    fontSize: "13px",
    color: "#666",
    textAlign: "center",
    lineHeight: "1.5",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px",
  },

  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#aaa",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#111",
    color: "#f0f0f0",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: "12px",
    marginTop: "8px",
    background: "#fff",
    color: "#111",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
  },

  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "24px 0 8px",
  },

  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#2a2a2a",
    display: "block",
  },

  dividerText: {
    fontSize: "12px",
    color: "#555",
  },

  toggleText: {
    textAlign: "center",
    fontSize: "13px",
    color: "#666",
    margin: "8px 0 0",
  },

  switchBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    padding: 0,
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },

};

export default Login;
