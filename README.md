# VibeDraw

<h3 align="center">
  AI-Powered Virtual Whiteboard
</h3>

VibeDraw is an enhanced virtual whiteboard based on [Excalidraw](https://excalidraw.com), integrated with multi-LLM gateway capabilities to transform natural language into diagrams.

## Key Features

- **Everything from Excalidraw**: Infinite canvas, hand-drawn style, end-to-end encryption, and local-first support.
- **AI-Powered Drawing**: Generate diagrams (Mermaid, SVG) directly from natural language prompts.
- **Multi-LLM Support**: Integrated with a flexible LLM gateway (e.g., LiteLLM) to support various models like Google Gemini, OpenAI, etc.
- **Smart Routing**: Optimize for cost, speed, or quality by routing requests to the best available model.

## Getting Started

### Prerequisites

- Node.js (18.0.0 - 22.x.x)
- Yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/skaiy/vibedraw.git
   cd vibedraw
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the development server:
   ```bash
   yarn start
   ```

## AI Configuration

To enable AI features, you need to configure the LLM gateway settings in your environment variables:

```env
GATEWAY_BASE_URL=http://localhost:4000
GATEWAY_API_KEY=your_gateway_key
DEFAULT_MODEL=gemini-3-pro-preview
```

## Roadmap

- [x] Project Initialization & Environment Setup
- [ ] Multi-LLM Gateway Integration (LiteLLM)
- [ ] Backend AI Drawing API (Text-to-Mermaid/SVG)
- [ ] Frontend AI Drawing Panel & Rendering
- [ ] End-to-End Testing & Optimization

## License

This project is licensed under the MIT License. VibeDraw is built on top of [Excalidraw](https://github.com/excalidraw/excalidraw).
