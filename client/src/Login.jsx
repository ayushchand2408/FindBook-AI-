// Login / Register screen.
// Toggles between login and sign-up mode via `isLogin` state.
// On successful login, cookie is set by server automatically — no localStorage needed.

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLogin }) {

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // prevent double submit
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ── Submit handler ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    // Basic validation
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    if (!isLogin && !name) {
      alert("Please enter your name");
      return;
    }

    const url = isLogin
      ? `${BASE_URL}/api/login`
      : `${BASE_URL}/api/register`;

    const body = isLogin
      ? { email, password }
      : { name, email, password };

    try {
      setLoading(true);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // required so browser stores the cookie the server sets
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong");
        return;
      }

      if (isLogin) {
        // No localStorage — cookie is already set by the server automatically
        alert("Login successful 🎉");
        onLogin();
        navigate("/");
      } else {
        alert("Account created successfully 🎉");
        setIsLogin(true);
      }

    } catch (err) {
      console.error("Auth error:", err);
      alert("Network error, please try again");
    } finally {
      setLoading(false);
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
              value={name}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
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