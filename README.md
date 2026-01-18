# PingHermano - Simple Postman Clone

PingHermano is an Electron-based application that serves as a simple clone of Postman. It allows you to make HTTP requests, view responses, and manage your request history.

## Features

- **Request Methods**: Supports GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS.
- **Request Configuration**:
    - **URL**: Bidirectional synchronization with Query Params.
    - **Headers**: Key-value pair editing.
    - **Body**: Raw text/JSON support.
- **Response Viewer**:
    - View status code, time, and size.
    - View response body (pretty-printed JSON) and headers.
- **History**: Automatically saves request history to local storage.

## Tech Stack

- **Electron**: For cross-platform desktop application.
- **React**: For the user interface.
- **Vite**: For fast build and development.
- **TypeScript**: For type safety.
- **MobX**: For state management.
- **Styled Components**: For styling.
- **Postman Runtime**: Uses actual Postman libraries (`postman-runtime`, `postman-collection`) for request execution.

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm

### Installation

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

### Running the Application

To run the application in development mode (with hot-reload for Renderer):

```bash
npm run dev
```

This will start the Vite dev server and launch the Electron app.

### Building

To build the application for production:

```bash
npm run build
npm start
```
