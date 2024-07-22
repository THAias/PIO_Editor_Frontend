import { EditOutlined, HomeOutlined, ReadOutlined, RetweetOutlined, UserOutlined } from "@ant-design/icons";
import { IResponse, IUserData } from "@thaias/pio_editor_meta";
import { Button, Divider, Layout, Menu, MenuProps, Popover, Tooltip } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppDispatch, INavigationProps, RootState } from "../../@types/ReduxTypes";
import authenticationActions from "../../redux/actions/AuthenticationActions";
import navigationActions from "../../redux/actions/NavigationActions";
import { closeSession, renewSessionTime, runLogoutTasks } from "../../services/LoginService";
import PIOService from "../../services/PIOService";
import "../../styles/layout/header.scss";
import toastHandler from "../ToastHandler";

const { Header } = Layout;

/**
 * The header button from the upper status bar
 * @returns {React.JSX.Element} React element
 */
const HeaderBar = (): React.JSX.Element => {
    const [userData, setUserData] = useState<IUserData>();
    const [userDataPopoverOpen, setUserDataPopoverOpen] = useState<string>("closed"); //closed | open | blocked
    const { screen, openPio }: INavigationProps = useSelector((state: RootState) => state.navigationState);
    const dispatch: AppDispatch = useDispatch();
    const logoutWarning: string =
        process.env.REACT_APP_VERSION_ENV === "webVersion"
            ? "Beim Abmelden gehen alle eingetragenen Daten verloren!"
            : "Beim Abmelden sind Daten für oben angegebene Zeit gespeichert. Für erneuten Zugriff mit dem selben Namen anmelden.";

    useEffect((): void => {
        PIOService.isSessionOpen().then((result: IResponse): void => {
            if (result.success) {
                const resultUserData: IUserData = result.data?.userData as IUserData;
                setUserData(resultUserData);
            } else {
                toastHandler.error("Etwas ist bei der Anmeldung schief gelaufen, bitte erneut anmelden");
                //Clear user data in redux
                dispatch(authenticationActions.logoutRedux());

                //Clear axios header for all further requests
                axios.defaults.headers.common.Authorization = undefined;
                localStorage.removeItem("token");
            }
        });
    }, [dispatch]);

    const formatTime = (seconds: number): string => {
        const hours: number = Math.floor(seconds / 3600);
        const minutes: number = Math.floor((seconds % 3600) / 60);
        const remainingSeconds: number = seconds % 60;

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    const useSessionTimer = (token: string) => {
        const [remainingSessionTime, setRemainingSessionTime] = useState<string | null>(null);

        useEffect(() => {
            const decodedTokenPayload: string = atob(token.split(".")[1]);
            const decodedJwtToken: { exp: number } = JSON.parse(decodedTokenPayload);
            const currentTime: number = Math.floor(Date.now() / 1000);
            const initialRemainingTime: number = decodedJwtToken.exp - currentTime;
            setRemainingSessionTime(formatTime(initialRemainingTime));

            const intervalId: NodeJS.Timeout = setInterval((): void => {
                const updatedRemainingTime: number = decodedJwtToken.exp - Math.floor(Date.now() / 1000);
                setRemainingSessionTime(formatTime(updatedRemainingTime));

                if (updatedRemainingTime <= 0) {
                    clearInterval(intervalId);
                    setRemainingSessionTime("00:00:00");
                    // Handle token expiration here, e.g., log the user out.
                }
            }, 1000);

            return () => clearInterval(intervalId);
        }, [token]);

        return remainingSessionTime;
    };

    const logout = (): void => {
        closeSession().then((result: IResponse): void => {
            if (result.success) {
                setUserDataPopoverOpen("closed");
                runLogoutTasks();
            } else console.error(result.message + " (Error code: " + result.errorCode + ")");
        });
    };

    /** Renews the session time in backend. */
    const renewSessionTimeFunc = (): void => {
        renewSessionTime().then((result: IResponse) => {
            if (result.success) {
                console.info("Session time successfully renewed");
            }
        });
    };

    const userContent: React.JSX.Element = (
        <div className={"logout-content"}>
            <div className={"logout-content-name"}>
                <b>Angemeldet als:</b> {userData?.firstName} {userData?.lastName}
            </div>
            <div className={"logout-remaining-time"}>
                <b>Autom. Logout in:</b> {useSessionTimer(axios.defaults.headers.common.Authorization as string)}{" "}
                Stunden <RetweetOutlined onClick={renewSessionTimeFunc} />
            </div>
            <Divider />
            <div className={"logout-warning"}>
                <b className={"logout-warning-label"}>Warnung:</b> {logoutWarning}
            </div>
            <Button onClick={logout}>Logout</Button>
        </div>
    );

    const menuItems: MenuProps["items"] = [
        {
            key: "1",
            icon: (
                <Tooltip title={"Hauptmenü"}>
                    <HomeOutlined />
                </Tooltip>
            ),
        },
        {
            key: "2",
            icon: (
                <Tooltip title={"PIO PÜB Editor"}>
                    <EditOutlined />
                </Tooltip>
            ),
            disabled: !openPio,
        },
        {
            key: "3",
            icon: (
                <Tooltip title={"Adressbuch"}>
                    <ReadOutlined />
                </Tooltip>
            ),
        },
        {
            key: "4",
            icon: (
                <Tooltip title={"Anmeldedaten"}>
                    <Popover
                        content={userContent}
                        trigger={"click"}
                        onOpenChange={() => {
                            setUserDataPopoverOpen((oldState: string) => {
                                if (oldState === "open") {
                                    window.setTimeout(() => setUserDataPopoverOpen("closed"), 500);
                                    return "blocked";
                                }
                                return oldState;
                            });
                        }}
                        open={userDataPopoverOpen === "open"}
                        rootClassName={"logout-popover"}
                        overlayStyle={{ maxWidth: "400px" }}
                    >
                        <UserOutlined />
                    </Popover>
                </Tooltip>
            ),
        },
    ];

    return (
        <div className={"header-wrapper"}>
            <Header className={"global-header"}>
                <div className={"header-title"}>PIO-ULB Editor & Viewer</div>
                <div className={"header-menu-wrapper"}>
                    <Menu
                        mode="horizontal"
                        multiple={false}
                        selectedKeys={[screen]}
                        theme="dark"
                        items={menuItems}
                        disabledOverflow={true}
                        onClick={async ({ key }: { key: string }): Promise<void> => {
                            if (key !== "4") dispatch(await navigationActions.changeScreenRedux(key));
                            else
                                setUserDataPopoverOpen((oldState: string) => {
                                    if (oldState == "closed") return "open";
                                    else return oldState;
                                });
                        }}
                    />
                </div>
            </Header>
        </div>
    );
};

export default HeaderBar;
