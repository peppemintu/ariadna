// User picker + user creation. No passwords on pick — choose who you are and
// we remember it for the session. Creating a user hits the real backend
// endpoint (password is stored hashed there, just never checked yet).

import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useUsers } from "@/hooks/queries";
import { useCreateUser } from "@/hooks/mutations";
import { useCurrentUser } from "@/lib/currentUser";
import { Avatar, Badge, Button, Input, useToast } from "@/ui";
import type { UserResponse, UserRole } from "@/api/types";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, setUser } = useCurrentUser();
  const { data: users, isLoading, isError, error } = useUsers();
  const createUser = useCreateUser();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("USER");

  if (user) return <Navigate to="/boards" replace />;

  const pick = (u: UserResponse) => {
    setUser(u);
    navigate("/boards", { replace: true });
  };

  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const passwordOk = password.length >= 8 && password.length <= 72;
  const canCreate = name.trim().length > 0 && emailOk && passwordOk;

  const handleCreate = async () => {
    if (!canCreate) return;
    try {
      const created = await createUser.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      pick(created);
    } catch (err) {
      toast({
        title: "Couldn't create user",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Ariadna</p>
        <h1 className={styles.title}>Who's working?</h1>
        <p className={styles.sub}>Pick your profile to continue.</p>

        {isLoading && <p className={styles.note}>Loading people…</p>}
        {isError && (
          <p className={styles.error}>
            Can't load users{error instanceof Error ? ` — ${error.message}` : ""}. Is the backend up?
          </p>
        )}
        {users && users.length === 0 && !formOpen && (
          <p className={styles.note}>No users yet — create the first one below.</p>
        )}

        {users && users.length > 0 && (
          <ul className={styles.list}>
            {users.map((u) => (
              <li key={u.id}>
                <button className={styles.userBtn} onClick={() => pick(u)}>
                  <Avatar name={u.name} size={40} />
                  <span className={styles.userText}>
                    <span className={styles.userName}>{u.name}</span>
                    <span className={styles.userEmail}>{u.email}</span>
                  </span>
                  {u.role === "ADMIN" && <Badge tone="ink">Admin</Badge>}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.divider} aria-hidden />

        {!formOpen ? (
          <Button variant="default" fullWidth onClick={() => setFormOpen(true)}>
            + New user
          </Button>
        ) : (
          <div className={styles.form}>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={email && !emailOk ? "Doesn't look like an email" : undefined}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="8–72 characters. Stored on the backend; not checked at login yet."
              error={password && !passwordOk ? "8–72 characters" : undefined}
            />
            <div className={styles.formActions}>
              <Button onClick={handleCreate} disabled={!canCreate || createUser.isPending}>
                {createUser.isPending ? "Creating…" : "Create & sign in"}
              </Button>
              <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
