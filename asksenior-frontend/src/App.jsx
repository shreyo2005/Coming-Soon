import { useState } from "react";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import Onboarding from "./pages/Onboarding";
import StudentForm from "./pages/StudentForm";
import { InsiderCollege, InsiderProfile, InsiderPayout } from "./pages/InsiderFlow";
import MentorForm from "./pages/MentorForm";
import Success from "./pages/Success";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");

  const go = (r) => {
    if (r === "admin") { setScreen("admin"); return; }
    setRole(r);
    setScreen("signin");
  };

  const afterSignIn = (data) => {
    setUserId(data.id);
    setEmail(data.email);
    setScreen("onboarding");
  };

  const afterOnboarding = () => {
    if (role === "student") setScreen("student-form");
    else if (role === "insider") setScreen("insider-college");
    else if (role === "mentor") setScreen("mentor-form");
  };

  switch (screen) {
    case "landing":
      return <Landing go={go} />;
    case "admin":
      return <AdminDashboard onBack={() => setScreen("landing")} />;
    case "signin":
      return <SignIn role={role} onDone={afterSignIn} onBack={() => setScreen("landing")} />;
    case "onboarding":
      return <Onboarding role={role} userId={userId} onDone={afterOnboarding} />;
    case "student-form":
      return <StudentForm userId={userId} onDone={() => setScreen("success")} />;
    case "insider-college":
      return <InsiderCollege userId={userId} onNext={() => setScreen("insider-profile")} onBack={() => setScreen("onboarding")} />;
    case "insider-profile":
      return <InsiderProfile userId={userId} onNext={() => setScreen("insider-payout")} onBack={() => setScreen("insider-college")} />;
    case "insider-payout":
      return <InsiderPayout userId={userId} onDone={() => setScreen("success")} onBack={() => setScreen("insider-profile")} />;
    case "mentor-form":
      return <MentorForm userId={userId} onDone={() => setScreen("success")} />;
    case "success":
      return <Success role={role} email={email} />;
    default:
      return <Landing go={go} />;
  }
}
