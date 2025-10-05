import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
// import PhotoWall from "./components/PhotoWall";
// import Upload from "./components/Upload";

function App() {
  return (
    <>
      <div className="flex flex-col min-h-screen justify-between">
        <Header />
        <div>
          <Login />
          {/* <Upload />
          <PhotoWall /> */}
        </div>
        <Footer />
      </div>
    </>
  );
}

export default App;
