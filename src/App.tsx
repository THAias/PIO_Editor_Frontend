import { IResponse } from "@thaias/pio_editor_meta";
import { ConfigProvider, ThemeConfig } from "antd";
import "antd/dist/reset.css";
import de_DE from "antd/locale/de_DE";
import axios, { AxiosResponse } from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { IValidationObject, IValidatorModalProps } from "./@types/FurtherTypes";
import { IAuthenticationState, INavigationProps, RootState } from "./@types/ReduxTypes";
import AddressBook from "./components/AddressBook";
import ErrorPage from "./components/ErrorPage";
import Home from "./components/Home";
import Login from "./components/Login";
import ValidatorModal from "./components/ValidatorModal";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import TabView from "./components/layout/Tabs/TabView";
import { closeSession } from "./services/LoginService";
import PIOService from "./services/PIOService";
import "./styles/app.scss";
import "./styles/basic/input.scss";
import "./styles/layout/layoutForm.scss";

const App = (): React.JSX.Element => {
    //Get redux state
    const { isLoggedIn }: IAuthenticationState = useSelector((state: RootState) => state.authState);
    const { screen }: INavigationProps = useSelector((state: RootState) => state.navigationState);
    const [dbConnected, setDbConnected] = React.useState<boolean>();
    const [backendConnected, setBackendConnected] = React.useState<boolean>(true);

    //Validator states
    const [validationModalOpen, setValidationModalOpen] = useState<boolean>(false);
    const [validationResult, setValidationResult] = useState<IResponse | undefined>(undefined);
    const [xmlObjectForValidation, setXmlObjectForValidation] = useState<IValidationObject | undefined>(undefined);
    const validatorProps: IValidatorModalProps = {
        modalOpen: validationModalOpen,
        setModalOpen: setValidationModalOpen,
        validationXmlObject: xmlObjectForValidation,
        setValidationXmlObject: setXmlObjectForValidation,
        validationResult: validationResult,
        setValidationResult: setValidationResult,
    };

    const pioTheme: ThemeConfig = {
        token: {
            colorPrimary: "rgb(7, 78, 232)",
            colorPrimaryHover: "rgb(7, 78, 232)",
            colorError: "#e74c3c",
            colorInfo: "rgb(7, 78, 232)",
            colorSuccess: "#07bc0c",
            colorWarning: "#f1c40f",
            borderRadius: 2,
            colorBorder: "rgb(28, 28, 30)",
            colorText: "rgb(28, 28, 30)",
            colorTextBase: "rgb(28, 28, 30)",
            colorTextHeading: "rgb(28, 28, 30)",
            wireframe: false,
            fontFamily: "Roboto, sans-serif",
        },
    };

    //For "webVersion": Show prompt before reloading or closing the page (just when logged in)
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent): string => {
            if (process.env.REACT_APP_VERSION_ENV === "webVersion") {
                event.preventDefault();
                event.returnValue = "";
            }
            return "";
        };

        if (isLoggedIn) {
            window.addEventListener("beforeunload", handleBeforeUnload);
        } else {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        }

        return (): void => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isLoggedIn]);

    //For "webVersion": Close session (and further clean up) when page is refreshed or closed
    useEffect(() => {
        const handleUnload = (): void => {
            if (process.env.REACT_APP_VERSION_ENV === "webVersion") {
                localStorage.removeItem("fingerPrint");
                localStorage.removeItem("token");

                //Work around: Block page closing until session is closed
                closeSession().then();
                let determineLoop: number = 0;
                while (determineLoop < 1000) {
                    console.debug("Waiting for backend to close the session");
                    determineLoop++;
                }
            }
        };

        window.addEventListener("unload", handleUnload);
        return (): void => {
            window.removeEventListener("unload", handleUnload);
        };
    }, []);

    // remove loader animation & initialize UUIDService & initialize redux
    useEffect((): void => {
        if (process.env.NODE_ENV === "development") console.info("Development mode");
        console.info(`Started in ${process.env.REACT_APP_VERSION_ENV}`);
        const removeLoader = (): void => {
            const loaderElement: Element | null = document.querySelector(".loader-container");
            if (loaderElement) {
                loaderElement.remove();
            }
        };
        const checkDbConnection = async (): Promise<boolean> => {
            const response: IResponse = await PIOService.checkConnectionDB();
            return response.success;
        };
        checkDbConnection()
            .then((result: boolean): void => {
                setBackendConnected(true);
                setDbConnected(result);
                removeLoader();
            })
            .catch((error: Error): void => {
                console.error(error);
                setBackendConnected(false);
                removeLoader();
            });
    }, []);

    const getContent = (): React.JSX.Element => {
        switch (screen) {
            case "1":
                return <Home validatorModalProps={validatorProps} />;
            case "2":
                return <TabView validatorModalProps={validatorProps} />;
            case "3":
                return <AddressBook />;
            case "0":
            default:
                return <Login autoLogin={dbConnected === true && backendConnected} />;
        }
    };

    axios.defaults.headers.post["Content-Type"] = "application/json";
    axios.defaults.headers.get["Content-Type"] = "application/json";
    axios.interceptors.response.use(
        (response: AxiosResponse) => {
            const responseData: IResponse = response.data as IResponse;
            if (responseData.token) {
                localStorage.setItem("token", responseData.token);
                axios.defaults.headers.common.Authorization = responseData.token;
            }
            return response;
        },
        (error) => Promise.reject(error)
    );

    return (
        <ConfigProvider theme={pioTheme} componentSize={"middle"} locale={de_DE} space={{ size: "middle" }}>
            {backendConnected && dbConnected && isLoggedIn && <Header />}
            {backendConnected && dbConnected && getContent()}
            {backendConnected && dbConnected === false && <ErrorPage errorCode={"500"} />}
            {!backendConnected && <ErrorPage errorCode={"503"} />}
            {backendConnected && dbConnected !== undefined && (screen === "0" || screen === "1") && <Footer />}
            {backendConnected && dbConnected !== undefined && (screen === "1" || screen === "2") && (
                <ValidatorModal validatorModalProps={validatorProps} />
            )}
        </ConfigProvider>
    );
};

export default App;
