import React from "react";
import "./auth.layout.css";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      {children}
    </div>
  );
}
