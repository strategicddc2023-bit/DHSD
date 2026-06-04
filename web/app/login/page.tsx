"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCurrentAppUser } from "@/services/auth-session";
import { supabase } from "@/services/supabase-client";
import type { AppUserRow } from "@/types/mvp";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUserRow | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const user = await loadCurrentAppUser();
      setCurrentUser(user);
      if (user?.role === "superadmin") {
        router.replace("/");
        return;
      }
      if (user?.role === "admin" || user?.role === "user") {
        router.replace("/my-work");
      }
    };

    void loadUser();
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("กรอกอีเมลและรหัสผ่านก่อน");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSaving(false);
      setMessage(`เข้าสู่ระบบไม่สำเร็จ: ${error.message}`);
      return;
    }

    const user = await loadCurrentAppUser();
    setCurrentUser(user);
    setSaving(false);

    if (user?.role === "superadmin") {
      router.replace("/");
      return;
    }
    if (user?.role === "admin" || user?.role === "user") {
      router.replace("/my-work");
      return;
    }

    setMessage("เข้าสู่ระบบแล้ว แต่ยังไม่พบ app_users ที่ผูกสิทธิ์");
  };

  return (
    <main className="login-page">
      <div className="login-page__bg" />
      <div className="login-center">
        <section className="login-card login-card--simple">
          <div className="login-card__head">
            <div className="login-card__icon" aria-hidden="true">
              <span>⌁</span>
            </div>
            <h1>Admin User Login</h1>
            <p>Central Office เท่านั้นที่จะเข้าหน้าจัดการข้อมูลได้</p>
          </div>

          <div className="login-card__body">
            <div className="login-card__form">
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
            </div>

            <button type="button" className="cta cta--solid login-card__submit" onClick={handleLogin} disabled={saving}>
              {saving ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบผู้ดูแล"}
            </button>

            {message ? <p className="inline-message login-card__message">{message}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
