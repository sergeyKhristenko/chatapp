import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Room from "./components/Room";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/test",
    element: <App />,
  },
  {
    path: "/room/:id",
    element: <Room />,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<RouterProvider router={router} />);
