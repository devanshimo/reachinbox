import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import Scheduled from "./pages/Scheduled";
import "./App.css";
import Sent from "./pages/Sent";
import EmailDetail from "./pages/EmailDetail";
import Compose from "./pages/Compose";  


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<DashboardLayout />}>
          <Route
            path="/scheduled"
            element={<Scheduled />}
          />

          <Route
            path="/sent"
            element={<Sent />}
          />
        </Route>
        <Route
          path="/compose"
          element={<Compose />}
          />
          <Route
  path="/email/:id"
  element={<EmailDetail />}
/>

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;