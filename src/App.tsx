// src/App.tsx
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import PhotoWall from "./components/PhotoWall";
import Upload from "./components/Upload";
import AuthProvider from "./auth/AuthProvider";
import { useAuth } from "./auth/useAuth";

function MainArea() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="spinner" aria-hidden="true" />
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="m-auto px-2 w-full">
      <div className="m-auto flex flex-col justify-center items-center gap-3">
        <Upload />
      </div>
      <PhotoWall />
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
