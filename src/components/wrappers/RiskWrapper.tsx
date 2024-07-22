import { IPractitionerObject } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form, FormInstance } from "antd";
import { NamePath } from "antd/es/form/interface";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 } from "uuid";

import { ISingleWrapperProps } from "../../@types/FormTypes";
import { AppDispatch, RootState } from "../../@types/ReduxTypes";
import practitionerActions from "../../redux/actions/PractitionerActions";
import { getFullPath, getNameLabel } from "../../services/HelperService";
import { helperTextRiskWrapper } from "../../services/HelperTextService";
import ValueSets from "../../services/ValueSetService";
import CustomModal from "../basic/CustomModal";
import InputDatePicker from "../basic/InputDatePicker";
import InputDropDown from "../basic/InputDropDown";
import PractitionerWrapper from "./PractitionerWrapper";

const riskValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Risk");

/**
 * Wrapper component for Risk
 * @param {ISingleWrapperProps} props ISingleWrapperProps props interface
 * @returns {React.JSX.Element} React element
 */
const RiskWrapper = (props: ISingleWrapperProps): React.JSX.Element => {
    //ValueSets, Options, State and Form setup
    const riskOptions: SelectOptions = riskValueSet.getOptionsSync;
    const dispatch: AppDispatch = useDispatch();
    const form: FormInstance = Form.useFormInstance();
    const [modalOpen, setModalOpen] = React.useState<boolean>(false);
    const fullPath: NamePath = getFullPath(props);
    const formSelectPerformer = Form.useWatch(fullPath.concat("riskPerformer"), form);
    const practitionerReduxState: IPractitionerObject[] = useSelector((state: RootState) => state.practitionerState);
    const practitionerOptions: SelectOptions = [
        { label: "Verantwortliche Person hinzufügen", value: "addPractitioner" },
        ...practitionerReduxState.map(
            (practitionerObject: IPractitionerObject): SelectOption => ({
                label: getNameLabel(practitionerObject.practitionerName),
                value: practitionerObject.id,
            })
        ),
    ];

    //Hook for opening modal on new practitioner selection
    useEffect((): void => {
        if (formSelectPerformer === "addPractitioner") {
            setModalOpen(true);
        }
    }, [formSelectPerformer]);

    //Helper for saving modal data for a new practitioner and setting necessary field values/closing the modal
    const saveNewPractitioner = (practitionerObject: IPractitionerObject): void => {
        setModalOpen(false);
        dispatch(practitionerActions.addPractitionerRedux(practitionerObject));
        form.setFieldValue(fullPath.concat("riskPerformer"), practitionerObject.id);
    };

    return (
        <>
            <Form.Item name={props.name !== undefined ? [props.name, "id"] : "id"} hidden={true} initialValue={v4()}>
                <div style={{ display: "hidden" }} />
            </Form.Item>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        options={riskOptions}
                        name={props.name !== undefined ? [props.name, "riskValue"] : "riskValue"}
                        placeholder={"Risiko wählen"}
                        label={"Angaben zu den Risiken"}
                        rules={[{ required: true, message: "Bitte wählen Sie ein Risiko aus!" }]}
                        helpText={helperTextRiskWrapper.riskValue}
                    />
                </div>
                <div className={"right"}></div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        options={practitionerOptions}
                        name={props.name !== undefined ? [props.name, "riskPerformer"] : "riskPerformer"}
                        placeholder={"Diagnosesteller:in wählen"}
                        label={"Diagnosesteller:in"}
                    />
                </div>
                <div className={"right"}>
                    <InputDatePicker
                        name={props.name !== undefined ? [props.name, "riskEffective"] : "riskEffective"}
                        label={"Zeitpunkt der Diagnosestellung"}
                    />
                </div>
            </div>
            {modalOpen && (
                <CustomModal<IPractitionerObject>
                    label={"Neue behandelnde Person hinzufügen"}
                    content={<PractitionerWrapper />}
                    open={modalOpen}
                    onCancel={(): void => {
                        setModalOpen(false);
                        form.setFieldValue(fullPath.concat("riskPerformer"), undefined);
                    }}
                    onOK={saveNewPractitioner}
                />
            )}
        </>
    );
};

export default RiskWrapper;
