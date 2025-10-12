import { useState, useEffect } from "react";
import upArrow from "../assets/upArrow.png";

export default function Footer() {
  const [isTop, setIsTop] = useState<boolean>(false);
  //console.log(isTop);
  useEffect(() => {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        setIsTop(true);
      } else {
        setIsTop(false);
      }
    });
  }, []);

  function goTop() {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  return (
    <footer className=" w-full h-16 flex flex-col items-center justify-center space-y-2 relative">
      {isTop && (
        <img
          src={upArrow}
          className="w-10 z-40 fixed bottom-8 right-10 xl:right-17 xl:bottom-17 drop-shadow-lg hover:-translate-y-1"
          onClick={goTop}
          alt="toTop"
        />
      )}

      {/* <h5 className="text-sm text-center w-fit h-fit bg-[#ddc783]  text-white mx-auto rounded-full py-0 px-4 drop-shadow-md hover:bg-[#F74211] transition duration-700 ease-in-out">
        {" "}
        © {new Date().getFullYear()} by{" "}
        <a
          href="https://www.yanqin.de"
          target="_blank"
          rel="noopener noreferrer"
        >
          QIN's code
        </a>
      </h5> */}
    </footer>
  );
}
