// src/App.tsx
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Logout from "./components/Logout";
import PhotoWall from "./components/PhotoWall";
import Upload from "./components/Upload";
import AuthProvider from "./auth/AuthProvider";
import { useAuth } from "./auth/useAuth";

function MainArea() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <span>Loading…</span>
      </div>
    );
  }

  if (!user) return <Login />;

  // Authenticated view: show Logout + Upload + PhotoWall
  return (
    <div className="px-2 w-[330px]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4 mr-8">
          <Logout />
        </div>
        <Upload />
        <PhotoWall />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen justify-between">
        <Header />
        <main className="flex justify-center items-center py-8">
          <MainArea />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
