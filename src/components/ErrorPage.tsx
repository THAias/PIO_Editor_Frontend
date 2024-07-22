import { Button, Result } from "antd";
import React from "react";
import { useDispatch } from "react-redux";

import { AppDispatch } from "../@types/ReduxTypes";
import navigationActions from "../redux/actions/NavigationActions";

const ErrorPage = (props: { errorCode: string }): React.JSX.Element => {
    const dispatch: AppDispatch = useDispatch();

    switch (props.errorCode) {
        case "404":
            return (
                <div className={"home-screen"}>
                    <Result
                        status="404"
                        title="404"
                        subTitle="Diese Seite existiert nicht!"
                        extra={
                            <Button
                                type="primary"
                                onClick={async (): Promise<void> => {
                                    dispatch(await navigationActions.changeScreenRedux("1"));
                                }}
                            >
                                Zurück nach Hause
                            </Button>
                        }
                    />
                </div>
            );
        case "500":
            return (
                <div className={"home-screen"}>
                    <Result
                        status="500"
                        title="Datenbankverbindung fehlgeschlagen"
                        subTitle="Bitte überprüfen Sie die Datenbankverbindung."
                        extra={
                            <Button type="primary" onClick={() => window.location.reload()}>
                                Erneut versuchen
                            </Button>
                        }
                    />
                </div>
            );
        case "503":
            return (
                <div className={"home-screen"}>
                    <Result
                        status="500"
                        title="Backend nicht erreichbar"
                        subTitle="Bitte überprüfen Sie die Backendverbindung."
                        extra={
                            <Button type="primary" onClick={() => window.location.reload()}>
                                Erneut versuchen
                            </Button>
                        }
                    />
                </div>
            );
        case "403":
            return (
                <div className={"home-screen"}>
                    <Result
                        status="403"
                        title="403"
                        subTitle="Sie haben keine Berechtigung für diese Seite!"
                        extra={
                            <Button
                                type="primary"
                                onClick={async (): Promise<void> => {
                                    dispatch(await navigationActions.changeScreenRedux("0"));
                                }}
                            >
                                Anmelden
                            </Button>
                        }
                    />
                </div>
            );
        default:
            return <div className={"home-screen"}></div>;
    }
};

export default ErrorPage;
