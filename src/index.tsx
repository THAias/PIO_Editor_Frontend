import { Root, createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

import App from "./App";
import { reduxStore } from "./redux/store";
import "./styles/colorsAndFonts.scss";

const root: Root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
    <Provider store={reduxStore}>
        <App />
        <ToastContainer />
    </Provider>
);
