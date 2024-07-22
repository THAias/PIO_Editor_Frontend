import { IPractitionerObject } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form, FormInstance } from "antd";
import { Dayjs } from "dayjs";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 } from "uuid";

import { ISingleWrapperProps } from "../../@types/FormTypes";
import { AppDispatch, RootState } from "../../@types/ReduxTypes";
import practitionerActions from "../../redux/actions/PractitionerActions";
import { getFullPath, getNameLabel } from "../../services/HelperService";
import { helperTextMedicalProblemWrapper } from "../../services/HelperTextService";
import ValueSets from "../../services/ValueSetService";
import CustomModal from "../basic/CustomModal";
import InputDropDown from "../basic/InputDropDown";
import InputTextArea from "../basic/InputTextArea";
import InputTimePeriod from "../basic/InputTimePeriod";
import RadioButton from "../basic/RadioButton";
import PractitionerWrapper from "./PractitionerWrapper";

/**
 * This component wraps the form fields for a single medical problem.
 * @param {ISingleWrapperProps} props ISingleWrapperProps props interface
 * @returns {React.JSX.Element} React element
 */
const MedicalProblemWrapper = (props: ISingleWrapperProps): React.JSX.Element => {
    const medicalProblemCodeValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_Base_Diagnosis_SNOMED_CT"
    );
    const medicalProblemCodeOptions: SelectOptions = medicalProblemCodeValueSet.getOptionsSync;
    const medicalProblemSeverityValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/condition-severity");
    const medicalProblemSeverityOptions: SelectOptions = medicalProblemSeverityValueSet.getOptionsSync
        .reverse()
        .map((option: SelectOption) => {
            if (option.label === "Mild") return { label: "Leicht", value: option.value } as SelectOption;
            else if (option.label === "Moderat") return { label: "Mittel", value: option.value } as SelectOption;
            else return option;
        });
    const medicalProblemVerificationStatusValueSet: ValueSets = new ValueSets(
        "http://hl7.org/fhir/ValueSet/condition-ver-status"
    );
    const medicalProblemVerificationStatusOptions: SelectOptions =
        medicalProblemVerificationStatusValueSet.getOptionsSync;
    const medicalProblemClinicalStatusValueSet: ValueSets = new ValueSets(
        "http://hl7.org/fhir/ValueSet/condition-clinical"
    );
    const medicalProblemClinicalStatusOptions: SelectOptions = medicalProblemClinicalStatusValueSet.getOptionsSync;
    const clinicalStatusForAbatedDiagnosis: string[] = ["inactive", "resolved", "remission"];
    const clinicalStatusForActiveDiagnosis: string[] = ["active", "recurrence", "relapse"];
    const practitionerReduxState: IPractitionerObject[] = useSelector((state: RootState) => state.practitionerState);
    const practitionerOptions: SelectOptions = [
        { label: "Behandelnde Person hinzufügen", value: "addPractitioner" },
        ...practitionerReduxState.map(
            (practitionerObject: IPractitionerObject): SelectOption => ({
                label: getNameLabel(practitionerObject.practitionerName),
                value: practitionerObject.id,
            })
        ),
    ];

    const fullPath: string[] = getFullPath(props);
    const dispatch: AppDispatch = useDispatch();
    const [modalOpen, setModalOpen] = React.useState<boolean>(false);
    const [diagnosisAlreadyEnded, setDiagnosisAlreadyEnded] = React.useState<boolean>(false);

    //Forms & watcher
    const form: FormInstance = Form.useFormInstance();
    const formSelectPerformer = Form.useWatch(fullPath.concat("medicalProblemPerformer"), form);
    const endDateWatcher: Dayjs | undefined = Form.useWatch(fullPath.concat("medicalProblemPeriod", "end"), form);

    //Hook for adding new practitioner
    useEffect((): void => {
        if (formSelectPerformer === "addPractitioner") {
            setModalOpen(true);
        }
    }, [formSelectPerformer]);

    //Hook for checking end date
    useEffect((): void => {
        if (endDateWatcher && endDateWatcher.valueOf() < Date.now()) setDiagnosisAlreadyEnded(true);
        else setDiagnosisAlreadyEnded(false);
    }, [endDateWatcher]);

    useEffect((): void => {
        form.validateFields([fullPath.concat("medicalProblemClinicalStatus")]);
    }, [diagnosisAlreadyEnded]);

    /**
     * Helper for saving new practitioner
     * @param {IPractitionerObject} practitionerObject The practitioner from the modal to save
     */
    const saveNewPractitioner = (practitionerObject: IPractitionerObject): void => {
        setModalOpen(false);
        dispatch(practitionerActions.addPractitionerRedux(practitionerObject));
        form.setFieldValue(fullPath.concat("medicalProblemPerformer"), practitionerObject.id);
    };

    return (
        <>
            <Form.Item name={props.name !== undefined ? [props.name, "id"] : "id"} hidden={true} initialValue={v4()}>
                <div style={{ display: "hidden" }} />
            </Form.Item>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        label={"Diagnosebezeichnung"}
                        placeholder={"Diagnosebezeichnung wählen"}
                        name={props.name !== undefined ? [props.name, "medicalProblemCode"] : "medicalProblemCode"}
                        options={medicalProblemCodeOptions}
                        rules={[{ required: true, message: "Bitte wählen Sie eine Diagnose aus!" }]}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        label={"Diagnosesicherheit"}
                        placeholder={"Diagnosesicherheit wählen"}
                        name={
                            props.name !== undefined
                                ? [props.name, "medicalProblemVerificationStatus"]
                                : "medicalProblemVerificationStatus"
                        }
                        options={medicalProblemVerificationStatusOptions}
                    />
                </div>
                <div className={"right"}>
                    <RadioButton
                        label={"Schweregrad"}
                        name={
                            props.name !== undefined ? [props.name, "medicalProblemSeverity"] : "medicalProblemSeverity"
                        }
                        options={medicalProblemSeverityOptions}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        label={"Klinischer Status"}
                        placeholder={"Klinischen Status wählen"}
                        name={
                            props.name !== undefined
                                ? [props.name, "medicalProblemClinicalStatus"]
                                : "medicalProblemClinicalStatus"
                        }
                        options={medicalProblemClinicalStatusOptions}
                        helpText={
                            'Wenn der klinisch relevante Zeitraum der Diagnose in der Vergangenheit liegt, muss hier "Inaktiv", "Remission" oder "Behoben" ausgewählt werden'
                        }
                        rules={[
                            {
                                type: "enum",
                                enum: diagnosisAlreadyEnded
                                    ? clinicalStatusForAbatedDiagnosis
                                    : clinicalStatusForAbatedDiagnosis.concat(clinicalStatusForActiveDiagnosis),
                                message: 'Ungültiger Wert! Klicke auf "?" für mehr Infos',
                            },
                        ]}
                    />
                </div>
                <div className={"right"}>
                    <InputTimePeriod
                        parentName={props.parentName}
                        name={props.name !== undefined ? [props.name, "medicalProblemPeriod"] : "medicalProblemPeriod"}
                        label={"Klinisch relevanter Zeitraum (von/bis)"}
                        helpText={helperTextMedicalProblemWrapper.medicalProblemPeriod}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        options={practitionerOptions}
                        name={
                            props.name !== undefined
                                ? [props.name, "medicalProblemPerformer"]
                                : "medicalProblemPerformer"
                        }
                        placeholder={"Diagnosesteller:in wählen"}
                        label={"Diagnosesteller:in"}
                    />
                </div>
                <div className={"right"}>
                    <InputTextArea
                        label={"Kommentar"}
                        placeholder={"Ggf. Ergänzende Angaben zur medizinischen Diagnose..."}
                        name={
                            props.name !== undefined ? [props.name, "medicalProblemComment"] : "medicalProblemComment"
                        }
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
                        form.setFieldValue(fullPath.concat("medicalProblemPerformer"), undefined);
                    }}
                    onOK={saveNewPractitioner}
                />
            )}
        </>
    );
};

export default MedicalProblemWrapper;
