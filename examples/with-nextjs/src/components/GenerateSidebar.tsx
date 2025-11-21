import React from "react";
import { TTDDialog, TTDDialogTrigger, Sidebar } from "@excalidraw/excalidraw";

const handleTextSubmit = async (prompt: string) => {
  try {
    const res = await fetch("/api/ai/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, target_format: "mermaid" }),
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.code;
  } catch (error) {
    console.error("Failed to generate diagram:", error);
    throw error;
  }
};

const GenerateSidebar: React.FC<{ excalidrawAPI: any }> = ({ excalidrawAPI }) => {
  return (
    <>
      <Sidebar.Trigger name="generate" icon={<div>🤖</div>} title="Generate" />

      <Sidebar name="generate" className="generate-sidebar">
        <Sidebar.Tabs>
          <Sidebar.Header>
            <Sidebar.TabTriggers>
              <Sidebar.TabTrigger tab="ai">
                🤖 AI
              </Sidebar.TabTrigger>
              <Sidebar.TabTrigger tab="code">
                💻 Code
              </Sidebar.TabTrigger>
            </Sidebar.TabTriggers>
          </Sidebar.Header>

          <Sidebar.Tab tab="ai">
            <div style={{ padding: "16px" }}>
              <h4>AI - Text to Diagram</h4>
              <p style={{ fontSize: "14px", marginBottom: "16px" }}>
                使用 AI 将自然语言描述转换为图表
              </p>
              <TTDDialogTrigger>
                <button style={{
                  width: "100%",
                  padding: "8px",
                  background: "#228be6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}>
                  打开 Text to Diagram
                </button>
              </TTDDialogTrigger>
            </div>
          </Sidebar.Tab>

          <Sidebar.Tab tab="code">
            <div style={{ padding: "16px" }}>
              <h4>Code - Mermaid</h4>
              <p style={{ fontSize: "14px", marginBottom: "16px" }}>
                将 Mermaid 代码转换为 Excalidraw 图表
              </p>
              <TTDDialogTrigger>
                <button style={{
                  width: "100%",
                  padding: "8px",
                  background: "#40c057",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}>
                  打开 Mermaid 转换
                </button>
              </TTDDialogTrigger>
            </div>
          </Sidebar.Tab>
        </Sidebar.Tabs>

        <TTDDialog onTextSubmit={handleTextSubmit} />
      </Sidebar>
    </>
  );
};

export default GenerateSidebar;
