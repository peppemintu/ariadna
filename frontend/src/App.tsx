import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { RequireUser } from "@/features/auth/RequireUser";
import { BoardsPage } from "@/features/board/BoardsPage";
import { BoardView } from "@/features/board/BoardView";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireUser />}>
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/board/:boardId" element={<BoardView />} />
        </Route>
        <Route path="*" element={<Navigate to="/boards" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
