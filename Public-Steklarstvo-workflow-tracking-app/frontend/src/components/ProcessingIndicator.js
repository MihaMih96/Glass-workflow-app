import React from "react";
import processingImage from "../assets/sara-goodjob.png";

const ProcessingIndicator = () => {
  return (
    <div className="processing-container">
      <img src={processingImage} alt="Processing" className="processing-image" />
    </div>
  );
};

export default ProcessingIndicator;
