import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.less";
import { ModalProvider } from "./components/Modal";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <ModalProvider>
    <App />
  </ModalProvider>
);
