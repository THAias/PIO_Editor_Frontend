import { IResponse, IUserData, capitalize } from "@thaias/pio_editor_meta";
import { Button, Card, Form } from "antd";
import FormItem from "antd/es/form/FormItem";
import axios from "axios";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";

import { IFormFinishObject } from "../@types/FormTypes";
import { AppDispatch, IAuthenticationState, RootState } from "../@types/ReduxTypes";
import authenticationActions from "../redux/actions/AuthenticationActions";
import { initialMockedDataBase } from "../redux/initializeRedux";
import { checkSession, closeSession, openSession, runLogoutTasks } from "../services/LoginService";
import "../styles/login.scss";
import toastHandler from "./ToastHandler";
import InputTextField from "./basic/InputTextField";

const Login = (props: { autoLogin: boolean }): React.JSX.Element => {
    const dispatch: AppDispatch = useDispatch();
    const authState: IAuthenticationState = useSelector((state: RootState) => state.authState);
    const [form] = Form.useForm();
    const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(authState.isLoggedIn);

    //useEffect for localVersion: ReLogin user automatically
    // eslint-disable-next-line sonarjs/cognitive-complexity
    useEffect((): void => {
        if (process.env.REACT_APP_VERSION_ENV !== "webVersion") {
            //Check if user is already logged in (token is stored in local storage)
            const token: string | null = localStorage.getItem("token");
            if (token && authState.autoLogin && props.autoLogin) {
                //Check if token is valid
                checkSession(token).then((result: IResponse): void => {
                    if (result.success) {
                        if (result.data?.userData) {
                            dispatch(authenticationActions.disclaimerAccepted());
                            const userData: IUserData = result.data?.userData as IUserData;
                            //Set user data in redux store
                            dispatch(
                                authenticationActions.loginRedux(
                                    capitalize(userData.firstName),
                                    capitalize(userData.lastName)
                                )
                            );
                            toastHandler.success("Willkommen zurück " + userData.firstName + " " + userData.lastName);
                        }
                        const newToken: string | undefined = result.token;
                        if (newToken) {
                            axios.defaults.headers.common.Authorization = newToken;
                            localStorage.setItem("token", newToken);
                        }
                    } else {
                        console.info(result.message + " (Error code: " + result.errorCode + ")");
                    }
                });
            }
        }
    }, []);

    //Generate a unique fingerPrint (just used in webVersion)
    useEffect((): void => {
        if (localStorage.getItem("fingerPrint") === null) {
            localStorage.setItem("fingerPrint", uuidv4());
        }
    }, []);

    /**
     * Submit function for the login form.
     * @param {IFormFinishObject} values Object with input filed names as keys and their content as values
     */
    const onFinish = (values: IFormFinishObject): void => {
        openSession(
            capitalize(values.firstName as string),
            capitalize(values.lastName as string),
            localStorage.getItem("fingerPrint") as string
        ).then((result: IResponse): void => {
            if (result.success && result.token) {
                //Update user data in redux store
                dispatch(
                    authenticationActions.loginRedux(
                        capitalize(values.firstName as string),
                        capitalize(values.lastName as string)
                    )
                );

                //Fill mocked database with example data requested from backend
                if (process.env.REACT_APP_VERSION_ENV === "webVersion") {
                    initialMockedDataBase().then();
                }

                //Set axios header for all further requests
                axios.defaults.headers.common.Authorization = result.token;
                axios.defaults.headers.post["Content-Type"] = "application/json";
                axios.defaults.headers.get["Content-Type"] = "application/json";
                localStorage.setItem("token", result.token);

                //For "webVersion":Renew fingerPrint (needed for case that user logs-in in new tab with same name)
                localStorage.setItem("fingerPrint", uuidv4());
            } else {
                console.error(result.message + " (Error code: " + result.errorCode + ")");
                toastHandler.error("Fehler beim Anmelden");
            }
        });
    };

    /**
     * Logout function for the logout button.
     */
    const logout = (): void => {
        setIsLoggedIn(false);
        form.resetFields();
        closeSession().then((result: IResponse): void => {
            if (result.success) {
                runLogoutTasks();
            } else console.error(result.message + " (Error code: " + result.errorCode + ")");
        });
    };

    return (
        <div className={"login-screen"}>
            <Card title={"Erstellerinformationen"} className={"login-card"}>
                <Form layout={"vertical"} onFinish={onFinish} className={"login-form"} name={"login"} form={form}>
                    <InputTextField
                        disabled={isLoggedIn}
                        name={"firstName"}
                        label={"Vorname"}
                        rules={[{ required: true, message: "Bitte gib deinen Vornamen ein" }]}
                    />
                    <InputTextField
                        disabled={isLoggedIn}
                        name={"lastName"}
                        label={"Nachname"}
                        rules={[{ required: true, message: "Bitte gib deinen Nachnamen ein" }]}
                    />
                    <FormItem className={"button-container"}>
                        {isLoggedIn ? (
                            <Button className={"logout-button"} onClick={logout}>
                                Abmelden
                            </Button>
                        ) : (
                            <Button type={"primary"} htmlType={"submit"} className={"login-button"}>
                                Anmelden
                            </Button>
                        )}
                    </FormItem>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
