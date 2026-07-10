// Sign in / register. Real JWT auth now: login exchanges email+password for a
// token; register creates the account then signs in. On success we land on the
// boards. (Register requires a role because the backend's create DTO does —
// defaults to USER.)

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/lib/currentUser";
import { Button, Input, Tabs, useToast } from "@/ui";
import styles from "./LoginPage.module.css";

type Mode = "login" | "register";

export function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { status, login, register } = useCurrentUser();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "authed") return <Navigate to="/boards" replace />;

  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const passwordOk = password.length >= 8 && password.length <= 72;
  const canSubmit =
    emailOk && passwordOk && (mode === "login" || name.trim().length > 0) && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      if (mode === "login") {
        await login({ email: email.trim(), password });
      } else {
        await register({ name: name.trim(), email: email.trim(), password });
      }
      navigate("/boards", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast({
        title: mode === "login" ? "Couldn't sign in" : "Couldn't register",
        description:
          mode === "login"
            ? "Check your email and password."
            : msg ?? "Please try again.",
        tone: "flare",
      });
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Ariadna</p>
        <h1 className={styles.title}>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className={styles.sub}>
          {mode === "login" ? "Sign in to your boards." : "Register to get started."}
        </p>

        <div className={styles.tabs}>
          <Tabs
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            tabs={[
              { value: "login", label: "Sign in" },
              { value: "register", label: "Register" },
            ]}
          />
        </div>

        <div className={styles.form}>
          {mode === "register" && (
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            error={email && !emailOk ? "Doesn't look like an email" : undefined}
            autoFocus={mode === "login"}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            hint={mode === "register" ? "8–72 characters." : undefined}
            error={password && !passwordOk ? "8–72 characters" : undefined}
          />
          <Button fullWidth onClick={submit} disabled={!canSubmit}>
            {busy
              ? mode === "login"
                ? "Signing in…"
                : "Creating account…"
              : mode === "login"
                ? "Sign in"
                : "Create account & sign in"}
          </Button>
        </div>
      </div>
    </main>
  );
}
