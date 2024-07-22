import { CheckOutlined, CloseOutlined, InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { IResponse } from "@thaias/pio_editor_meta";
import { Card, Collapse, CollapseProps, List, Modal, Spin, Statistic } from "antd";
import React, { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";

import { IValidationObject, IValidationResult, IValidatorModalProps } from "../@types/FurtherTypes";
import { RootState } from "../@types/ReduxTypes";
import { reduxStore } from "../redux/store";
import { VALIDATOR_SERVICE } from "../services/GlobalVariables";
import ValidatorService from "../services/ValidatorService";
import "../styles/validationModal.scss";

const ValidatorModal = (props: { validatorModalProps: IValidatorModalProps }): React.JSX.Element => {
    const setModalOpen = useCallback(
        (newState: boolean) => props.validatorModalProps.setModalOpen(newState),
        [props.validatorModalProps.setModalOpen]
    );
    const validationIdRedux: string | undefined = useSelector((state: RootState) => state.validationId) as
        | string
        | undefined;

    /**
     * Validates a xml-string calling the validator service. After a time of 1 minute a timeout error occurs.
     * @param {IValidationObject} xmlObject The xmlObject containing xmlString and validationId
     */
    const validatePIO = async (xmlObject: IValidationObject): Promise<void> => {
        //Cancel validation after 1 minute using the timeoutPromise
        const time: number = 60000;
        const timeoutMessage: string = `Timeout after ${time / 1000} seconds! Validation service is not answering.`;
        const timeoutResponse: IResponse = {
            success: false,
            message: timeoutMessage,
        };
        const timeoutPromise: Promise<IResponse> = new Promise((resolve) =>
            setTimeout(() => resolve(timeoutResponse), time)
        );
        const validationPromise: Promise<IResponse> = ValidatorService.validatePIO(xmlObject.xmlString);
        props.validatorModalProps.setValidationXmlObject(undefined);
        const winningPromiseResult: IResponse = await Promise.race([timeoutPromise, validationPromise]);

        //Set winning promise as result
        if (xmlObject.id === reduxStore.getState().validationId) {
            props.validatorModalProps.setValidationResult(winningPromiseResult);
        }
    };

    //Starts validation process when new xmlString is present
    useEffect(() => {
        if (validationIdRedux && props.validatorModalProps.validationXmlObject) {
            validatePIO(props.validatorModalProps.validationXmlObject).then();
        }
    }, [validationIdRedux, props.validatorModalProps.validationXmlObject]);

    /**
     * Returns a spinning loading icon.
     * @returns {React.JSX.Element} JSX element
     */
    const getLoadingIcon = (): React.JSX.Element => {
        return (
            <div className={"validation-loading"}>
                <Spin className={"validation-loading-icon"} tip="Loading" size="large" />
                <div className={"validation-loading-text"}>Lade...</div>
            </div>
        );
    };

    /**
     * Function maps specific error messages to simple error messages.
     * @param {string | undefined} errMess Specific error message from validator service
     * @returns {string} Simple error text, which can be understood by the user
     */
    const getErrorText = (errMess: string | undefined): string => {
        if (errMess && errMess.includes("Data at the root level is invalid. Line 1, position 1.")) {
            return "Die Datei enthält keine XML-Daten. Ein valides PIO muss eine XML-Datei sein. Bitte lade eine valide XML-Datei hoch.";
        } else if (errMess && errMess.includes("Parsing of xml data failed. Parsed object is null")) {
            return "Die Struktur der hochgeladenen XML-Datei entspricht nicht der eines PIOs. Bitte lade eine valide XML-Datei hoch.";
        } else if (errMess && /start tag on line \d+ position \d+ does not match the end tag of/.test(errMess)) {
            try {
                const line: string = errMess.split("start tag on line ")[1].split(" position ")[0];
                return (
                    "Achtung! In der XML-Datei liegt ein struktureller Fehler in Zeile " +
                    line +
                    " vor. Alle Patientendaten unterhalb dieser Zeile, werden im Editor nicht angezeigt."
                );
            } catch {
                return "Achtung! In der XML-Datei liegt ein struktureller Fehler vor. Einige Patientendaten können unter Umständen im Editor nicht angezeigt werden.";
            }
        } else if (errMess && /Timeout after \d+ seconds! Validation service is not answering./.test(errMess)) {
            return "Während der Validierung ist ein Timeout aufgetreten. Das Validierungsergebnis der hochgeladenenen Datei kann nicht angezeigt werden.";
        } else if (errMess && errMess.includes("Network Error")) {
            return "Der Validator Service ist nicht erreichbar. Das Validierungsergebnis der hochgeladenenen Datei kann nicht angezeigt werden.";
        } else {
            return "Es ist ein unbekannter Fehler aufgetreten. Versuchen sie es bitte erneut.";
        }
    };

    /**
     * This function provides the detailed warning and error messages from validator service as collapse menu items.
     * @param {IValidationResult} result Validation response from validator service
     * @returns {CollapseProps["items"]} Collapse menu items
     */
    const getCollapseItems = (result: IValidationResult): CollapseProps["items"] => {
        const collapseItems: CollapseProps["items"] = [];
        if (result.numberOfErrors > 0) {
            collapseItems.push({
                key: 1,
                label: "Fehler",
                children: (
                    <List
                        size={"small"}
                        dataSource={result.errors}
                        renderItem={(item) => <List.Item>{item}</List.Item>}
                    />
                ),
            });
        }
        if (result.numberOfWarnings > 0) {
            collapseItems.push({
                key: collapseItems.length + 1,
                label: "Warnungen",
                children: (
                    <List
                        size={"small"}
                        dataSource={result.warnings}
                        renderItem={(item) => <List.Item>{item}</List.Item>}
                    />
                ),
            });
        }
        return collapseItems;
    };

    /**
     * This function returns design and text elements for the validation result screen.
     * @param {IValidationResult} result Validation response from validator service
     * @returns {{ overall: string; backgroundColor: string; textColor: string; text: string }} Design and text elements
     */
    const getResultData = (
        result: IValidationResult
    ): { overall: string; backgroundColor: string; textColor: string; text: string } => {
        if (result.overallResult === "SUCCESS" && result.numberOfWarnings === 0) {
            return {
                overall: "Erfolgreich",
                backgroundColor: "#e6ffe6",
                textColor: "#3f8600",
                text: "Es konnten keine Mängel am importierten PIO festgestellt werden.",
            };
        } else if (result.overallResult === "SUCCESS" && result.numberOfWarnings > 0) {
            return {
                overall: "Erfolgreich mit Warnungen",
                backgroundColor: "#fff2e6",
                textColor: "#ff8000",
                text: "Das importierte PIO ist valide. Es enthält kleine Mängel, die keinen Handlungsbedarf erfordern.",
            };
        } else {
            return {
                overall: "Fehlgeschlagen",
                backgroundColor: "#ffe6e6",
                textColor: "#cf1322",
                text: "Das importierte PIO enthält Fehler! Bitte wenden sie sich an den technischen Support ihrer Einrichtung.",
            };
        }
    };

    /**
     * Returns the validation result screen.
     * @returns {React.JSX.Element} JSX element
     */
    const getValidationResultScreen = (): React.JSX.Element => {
        if (props.validatorModalProps.validationResult?.success && props.validatorModalProps.validationResult?.data) {
            const result: IValidationResult = props.validatorModalProps.validationResult
                .data as object as IValidationResult;
            const resultData: { overall: string; backgroundColor: string; textColor: string; text: string } =
                getResultData(result);

            return (
                <>
                    <div className={"validation-result-header"}>
                        <div className={"validation-overall-result"}>
                            <Card bordered={false} style={{ backgroundColor: resultData.backgroundColor }}>
                                <Statistic
                                    title={"Ergebnis"}
                                    value={resultData.overall}
                                    valueStyle={{ color: resultData.textColor }}
                                    prefix={
                                        resultData.overall === "Fehlgeschlagen" ? <CloseOutlined /> : <CheckOutlined />
                                    }
                                ></Statistic>
                            </Card>
                        </div>
                        <div className={"validation-number-of-errors"}>
                            <Card bordered={false} style={{ backgroundColor: resultData.backgroundColor }}>
                                <Statistic
                                    title={"Anzahl der Fehler"}
                                    value={result.numberOfErrors}
                                    valueStyle={{ color: resultData.textColor }}
                                ></Statistic>
                            </Card>
                        </div>
                        <div className={"validation-number-of-warnings"}>
                            <Card bordered={false} style={{ backgroundColor: resultData.backgroundColor }}>
                                <Statistic
                                    title={"Anzahl der Warnungen"}
                                    value={result.numberOfWarnings}
                                    valueStyle={{ color: resultData.textColor }}
                                ></Statistic>
                            </Card>
                        </div>
                    </div>
                    <div className={"validation-result-info"}>
                        <div className={"validation-result-info-icon"}>
                            <InfoCircleOutlined />
                        </div>
                        <div className={"validation-result-info-text"}>
                            {resultData.text +
                                "\nAlle weiteren Änderungen im PIO-ULB-Editor werden nicht in Echtzeit validiert."}
                        </div>
                    </div>
                    {result.numberOfErrors === 0 && result.numberOfWarnings === 0 ? undefined : (
                        <div className={"validation-result-detail"}>
                            <div className={"validation-result-detail-heading"}>
                                <b>Detaillierte Informationen für den technischen Support:</b>
                            </div>
                            {result.numberOfErrors === 0 && result.numberOfWarnings === 0 ? undefined : (
                                <Collapse items={getCollapseItems(result)} />
                            )}
                        </div>
                    )}
                </>
            );
        } else {
            return (
                <>
                    <div className={"validation-error"}>
                        <div className={"validation-error-icon"}>
                            <WarningOutlined />
                        </div>
                        <div className={"validation-error-text"}>
                            {getErrorText(props.validatorModalProps.validationResult?.message)}
                        </div>
                    </div>
                    <div className={"validation-error-message"}>
                        {props.validatorModalProps.validationResult?.message ? (
                            <Collapse
                                items={[
                                    {
                                        key: "1",
                                        label: "Detaillierte Informationen für den technischen Support",
                                        children: props.validatorModalProps.validationResult?.message,
                                    },
                                ]}
                            />
                        ) : undefined}
                    </div>
                </>
            );
        }
    };

    return (
        <Modal
            open={VALIDATOR_SERVICE ? props.validatorModalProps.modalOpen : false}
            title={"PIO-ULB Validierung"}
            width={888}
            destroyOnClose={true}
            onCancel={() => {
                setModalOpen(false);
            }}
            footer={null}
        >
            {props.validatorModalProps.validationResult ? getValidationResultScreen() : getLoadingIcon()}
        </Modal>
    );
};

export default ValidatorModal;
