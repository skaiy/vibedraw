"use client";
import { Excalidraw, DefaultSidebar } from "@excalidraw/excalidraw";
import GenerateSidebar from "./components/GenerateSidebar";
import { useState } from "react";
import "@excalidraw/excalidraw/index.css";

const ExcalidrawWrapper: React.FC = () => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Excalidraw 
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
      >
        <DefaultSidebar.Trigger />
        <DefaultSidebar />
        <GenerateSidebar excalidrawAPI={excalidrawAPI} />
      </Excalidraw>
    </div>
  );
};

export default ExcalidrawWrapper;
