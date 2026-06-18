import { useState } from "react";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import StudentForm from "./pages/StudentForm";
import { InsiderCollege, InsiderProfile, InsiderPayout } from "./pages/InsiderFlow";
import { MentorCompany, MentorProfile, MentorPayout } from "./pages/MentorFlow";
import Success from "./pages/Success";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");
  const [skipHero, setSkipHero] = useState(false);

  const go = (r) => {
    if (r === "admin") { setScreen("admin"); return; }
    const mapped = (r === "Learner" || r === "learner") ? "student" : r;
    setRole(mapped);
    setSkipHero(true);
    setScreen("signin");
  };

  const afterSignIn = (data) => {
    setUserId(data.id);
    setEmail(data.email);
    if (role === 'student') {
      setScreen("student-form");
    } else if (role === 'insider') {
      setScreen("insider-college");
    } else if (role === 'mentor') {
      setScreen("mentor-company");
    }
  };

  const handleExplore = () => {
    setSkipHero(true);
    setScreen("landing");
    setTimeout(() => document.getElementById("problem-section")?.scrollIntoView({behavior: "smooth"}), 100);
  };

  switch (screen) {
    case "landing":
      return <Landing go={go} skipHero={skipHero} />;
    case "admin":
      return <AdminDashboard onBack={() => { setSkipHero(true); setScreen("landing"); }} />;
    case "signin":
      return <SignIn role={role} onDone={afterSignIn} onBack={() => { setSkipHero(true); setScreen("landing"); }} />;
    case "student-form":
      return <StudentForm userId={userId} onDone={() => setScreen("success")} onBack={() => setScreen("signin")} onExplore={handleExplore} />;
    case "insider-college":
      return <InsiderCollege userId={userId} onNext={() => setScreen("insider-profile")} onBack={() => setScreen("signin")} onExplore={handleExplore} />;
    case "insider-profile":
      return <InsiderProfile userId={userId} onNext={() => setScreen("insider-payout")} onBack={() => setScreen("insider-college")} onExplore={handleExplore} />;
    case "insider-payout":
      return <InsiderPayout userId={userId} onDone={() => setScreen("success")} onBack={() => setScreen("insider-profile")} onExplore={handleExplore} />;
    case "mentor-company":
      return <MentorCompany userId={userId} onNext={() => setScreen("mentor-profile")} onBack={() => setScreen("signin")} onExplore={handleExplore} />;
    case "mentor-profile":
      return <MentorProfile userId={userId} onNext={() => setScreen("mentor-payout")} onBack={() => setScreen("mentor-company")} onExplore={handleExplore} />;
    case "mentor-payout":
      return <MentorPayout userId={userId} onDone={() => setScreen("success")} onBack={() => setScreen("mentor-profile")} onExplore={handleExplore} />;
    case "success":
      return <Success role={role} email={email} onExplore={handleExplore} />;
    default:
      return <Landing go={go} skipHero={skipHero} />;
  }
}
