import React from "react";
import mrbean from "../assets/mrbean.png"; // Poskrbi, da je slika v src/assets/mrbean.png
import "./Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <h2>Steklarstvo Kresal</h2>
      <img src={mrbean} alt="Mr Bean" className="home-image" />
    </div>
  );
};

export default Home;
