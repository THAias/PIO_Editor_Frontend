import {
    CheckOutlined,
    DeleteOutlined,
    DownloadOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { Button, Popconfirm, Popover, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { IValidationResult, IValidatorModalProps } from "../../../@types/FurtherTypes";
import { AppDispatch } from "../../../@types/ReduxTypes";
import navigationActions from "../../../redux/actions/NavigationActions";
import { reduxStore } from "../../../redux/store";
import { VALIDATOR_SERVICE } from "../../../services/GlobalVariables";
import toastHandler from "../../ToastHandler";

/**
 * TabMenu component for search, download and submit functionality of PIO-ULB-Editor
 * @param {() => void} exportPio function to export the PIO
 * @param {IValidatorModalProps} validatorModalProps Setter & getter for handling validation modal
 * @param {boolean} runningExport Is true, if an export is running at the moment
 * @returns {React.JSX.Element} React element
 */
const TabMenu = (
    exportPio: (type: string | undefined) => Promise<void>,
    validatorModalProps: IValidatorModalProps,
    runningExport: boolean
): React.JSX.Element => {
    const [validationResult, setValidationResult] = useState<
        "loading" | "success" | "error" | "warning" | "notInitializedYet"
    >("notInitializedYet");
    const dispatch: AppDispatch = useDispatch();

    //Will update the validationResult state
    useEffect((): void => {
        if (validatorModalProps.validationResult?.data) {
            const result: IValidationResult = validatorModalProps.validationResult.data as object as IValidationResult;
            if (result.numberOfErrors === 0 && result.numberOfWarnings === 0) {
                setValidationResult("success");
            } else if (result.numberOfErrors === 0 && result.numberOfWarnings > 0) {
                setValidationResult("warning");
            } else if (result.numberOfErrors > 0) {
                setValidationResult("error");
            } else {
                setValidationResult("loading");
            }
        } else if (validatorModalProps.validationResult && !validatorModalProps.validationResult.data) {
            setValidationResult("error");
        } else {
            setValidationResult("notInitializedYet");
        }
    }, [validatorModalProps.validationResult]);

    //Opens the validation modal if patient data are missing due to xml structure errors
    useEffect(() => {
        const errMess: string | undefined = validatorModalProps.validationResult?.message;
        if (
            validationResult === "error" &&
            errMess &&
            /start tag on line \d+ position \d+ does not match the end tag of/.test(errMess)
        ) {
            validatorModalProps.setModalOpen(true);
        }
    }, [validationResult, validatorModalProps.validationResult?.message]);

    /**
     * Returns the icon for the validation button depending on the validation result.
     * @returns {React.JSX.Element} a loading, error, warning or success icon.
     */
    const getValidatorButtonIcon = (): React.JSX.Element => {
        if (validationResult === "error") return <WarningOutlined />;
        else if (validationResult === "success") return <CheckOutlined />;
        else if (validationResult === "warning") return <InfoCircleOutlined />;
        else return <Spin tip="Loading" size="small" />;
    };

    /**
     * Returns the className for the validator button depending on the validation result.
     * @returns {string} a string with the className.
     */
    const getValidatorButtonType = (): string => {
        if (validationResult === "error") return "show-validation-result-button-red";
        else if (validationResult === "success") return "show-validation-result-button-green";
        else if (validationResult === "warning") return "show-validation-result-button-orange";
        else return "show-validation-result-button-blue";
    };

    /**
     * Delete function to delete the PIO
     */
    const deletePio = async (): Promise<void> => {
        dispatch(await navigationActions.closePioRedux());
        dispatch(navigationActions.exportPioRedux(undefined));
        dispatch(navigationActions.setOpenPioType(undefined));
        toastHandler.dismissAll();
    };

    /**
     * Function which returns a button.
     * @returns {React.JSX.Element} the button to open the validation modal.
     */
    const getValidationButton = (): React.JSX.Element => {
        if (VALIDATOR_SERVICE) {
            return (
                <Button
                    className={getValidatorButtonType()}
                    id={"pio-validation-button"}
                    onClick={() => validatorModalProps.setModalOpen(true)}
                    icon={getValidatorButtonIcon()}
                />
            );
        } else {
            return (
                <Button
                    style={{ color: "#cccccc" }}
                    type={"text"}
                    onClick={() => {
                        toastHandler.info(
                            "In Zukunft wird hier das Validierungsergebnis von importierten PIOs angezeigt. Validiert wird die xml-Struktur der importierten Datei."
                        );
                    }}
                >
                    Validator Service coming soon ...
                </Button>
            );
        }
    };

    return (
        <div className={"tab-menu-wrapper"}>
            <div className={"tab-menu-wrapper"}>
                {reduxStore.getState().navigationState.openPioType === "imported" ? getValidationButton() : undefined}
                <Popover
                    title="In welcher Form möchten Sie den Überleitungsbericht herunterladen?"
                    trigger="click"
                    placement="bottomRight"
                    content={
                        <div className={`download-popover ${runningExport && "disable-events"}`}>
                            <div className={"download-popover-right-border"}>
                                <div className={"download-popover-header"}>XML:</div>
                                PIO-ULB Export als XML-Datei im FHIR-Standard.
                            </div>
                            <div>
                                <div className={"download-popover-header"}>PDF:</div>
                                Export des Überleitungsbogens als PDF-Datei, inklusive angehängten Dokumenten.
                            </div>
                            <div className={"download-popover-right-border"}>
                                <Button
                                    id={"pio-export-button-xml"}
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    onClick={() => exportPio("xml")}
                                >
                                    XML
                                </Button>
                            </div>
                            <div>
                                <Button
                                    id={"pio-export-button-pdf"}
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    onClick={() => exportPio("pdf")}
                                >
                                    PDF
                                </Button>
                            </div>
                        </div>
                    }
                >
                    {runningExport ? (
                        <Button className={"download-button-running-export"} icon={<Spin />} />
                    ) : (
                        <Button className={"download-button"} id={"pio-export-button"} icon={<DownloadOutlined />}>
                            Export
                        </Button>
                    )}
                </Popover>
                <Popconfirm
                    title="Löschen bestätigen"
                    description="Sollen wirklich alle Daten gelöscht werden?"
                    onConfirm={deletePio}
                    placement="bottomRight"
                    icon={<ExclamationCircleOutlined style={{ color: "var(--color-red)" }} />}
                    okText="Ja"
                    cancelText="Nein"
                >
                    <Button className={"delete-button"} type={"primary"} icon={<DeleteOutlined />}>
                        Löschen
                    </Button>
                </Popconfirm>
            </div>
        </div>
    );
};

export default TabMenu;
