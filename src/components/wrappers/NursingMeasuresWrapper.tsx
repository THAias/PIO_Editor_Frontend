import { IPractitionerObject } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form, FormInstance, Input, Select } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 } from "uuid";

import { ISingleWrapperProps } from "../../@types/FormTypes";
import { AppDispatch, RootState } from "../../@types/ReduxTypes";
import practitionerActions from "../../redux/actions/PractitionerActions";
import { getFullPath, getNameLabel } from "../../services/HelperService";
import { helperTextNursingMeasuresWrapper } from "../../services/HelperTextService";
import ValueSets from "../../services/ValueSetService";
import CustomModal from "../basic/CustomModal";
import InputDropDown from "../basic/InputDropDown";
import InputTextArea from "../basic/InputTextArea";
import InputTextField from "../basic/InputTextField";
import InputTimePeriod from "../basic/InputTimePeriod";
import Label from "../basic/Label";
import PractitionerWrapper from "./PractitionerWrapper";

/**
 * This component wraps the form fields for a single care problem.
 * @param {ISingleWrapperProps} props ISingleWrapperProps props interface
 * @returns {React.JSX.Element} React element
 */
const NursingMeasuresWrapper = (props: ISingleWrapperProps): React.JSX.Element => {
    // ValueSets and Options
    const nursingMeasuresValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Interventions_ICNP"
    );
    const nursingMeasuresOptions: SelectOptions = nursingMeasuresValueSet.getOptionsSync;
    const timeInstanceValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Event_Timing");
    const timeInstanceOptions: SelectOptions = timeInstanceValueSet.getOptionsSync;
    const timeUnitValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/units-of-time");
    const timeUnitOptions: SelectOptions = timeUnitValueSet.getOptionsSync.map((option: SelectOption) => {
        switch (option.label) {
            case "s":
                option.label = "Sekunde";
                break;
            case "min":
                option.label = "Minute";
                break;
            case "h":
                option.label = "Stunde";
                break;
            case "d":
                option.label = "Tag";
                break;
            case "wk":
                option.label = "Woche";
                break;
            case "mo":
                option.label = "Monat";
                break;
            case "a":
                option.label = "Jahr";
                break;
        }
        return option;
    });
    const durationOptions: SelectOptions = [
        { label: "Minuten", value: "min" },
        { label: "Stunden", value: "h" },
        { label: "Tage", value: "d" },
    ];

    const practitionerReduxState: IPractitionerObject[] = useSelector((state: RootState) => state.practitionerState);
    const practitionerOptions: SelectOptions = [
        { label: "Durchführende Person hinzufügen", value: "addPractitioner" },
        ...practitionerReduxState.map(
            (practitioner: IPractitionerObject): SelectOption => ({
                label: getNameLabel(practitioner.practitionerName),
                value: practitioner.id,
            })
        ),
    ];

    const form: FormInstance = Form.useFormInstance();
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [durationRequired, setDurationRequired] = useState<boolean>(false);
    const [periodRequired, setPeriodRequired] = useState<boolean>(false);

    const fullPath: string[] = getFullPath(props);
    const performer = Form.useWatch(fullPath.concat("performer"), form);
    const dispatch: AppDispatch = useDispatch();

    //Forms & watcher
    const durationValueWatcher = Form.useWatch(fullPath.concat("durationValue"), form);
    const durationUnitWatcher = Form.useWatch(fullPath.concat("durationUnit"), form);
    const frequencyWatcher = Form.useWatch(fullPath.concat("frequency"), form);
    const periodWatcher = Form.useWatch(fullPath.concat("period"), form);
    const periodUnitWatcher = Form.useWatch(fullPath.concat("periodUnit"), form);

    //Hook for duration required field handling
    useEffect((): void => {
        setDurationRequired(
            (durationValueWatcher !== undefined && durationValueWatcher !== "") || durationUnitWatcher !== undefined
        );
    }, [durationUnitWatcher, durationValueWatcher]);

    useEffect((): void => {
        form.validateFields([fullPath.concat("durationValue")]);
        form.validateFields([fullPath.concat("durationUnit")]);
    }, [durationRequired]);

    //Hook for period required field handling
    useEffect((): void => {
        setPeriodRequired(
            (frequencyWatcher !== undefined && frequencyWatcher !== "") ||
                (periodWatcher !== undefined && periodWatcher !== "") ||
                periodUnitWatcher !== undefined
        );
    }, [frequencyWatcher, periodWatcher, periodUnitWatcher]);

    useEffect((): void => {
        form.validateFields([fullPath.concat("frequency")]);
        form.validateFields([fullPath.concat("period")]);
        form.validateFields([fullPath.concat("periodUnit")]);
    }, [periodRequired]);

    // Hook to open modal for new contact person
    useEffect((): void => {
        if (performer === "addPractitioner") setModalOpen(true);
    }, [performer]);

    const saveNewPractitioner = (practitionerObject: IPractitionerObject): void => {
        setModalOpen(false);
        dispatch(practitionerActions.addPractitionerRedux(practitionerObject));
        form.setFieldValue(fullPath.concat("performer"), practitionerObject.id);
    };

    return (
        <>
            <Form.Item name={props.name !== undefined ? [props.name, "id"] : "id"} hidden={true} initialValue={v4()}>
                <div style={{ display: "hidden" }} />
            </Form.Item>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        name={props.name !== undefined ? [props.name, "measure"] : "measure"}
                        label={"Maßnahme"}
                        placeholder={"Maßnahme wählen"}
                        options={nursingMeasuresOptions}
                        rules={[{ required: true, message: "Bitte wählen Sie eine Maßnahme aus!" }]}
                    />
                </div>
                <div className={"right"}>
                    <InputTimePeriod
                        parentName={props.parentName}
                        name={props.name !== undefined ? [props.name, "timePeriod"] : "timePeriod"}
                        label={"Zeitraum der Maßnahme (von/bis)"}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        options={timeInstanceOptions}
                        name={props.name !== undefined ? [props.name, "timeInstance"] : "timeInstance"}
                        label={"Zeitpunkt"}
                        placeholder={"Zeitpunkt wählen"}
                        wide={false}
                        helpText={helperTextNursingMeasuresWrapper.timeInstance}
                    />
                </div>
                <div className={"right"}>
                    <InputTextField
                        name={props.name !== undefined ? [props.name, "durationValue"] : "durationValue"}
                        label={"Dauer"}
                        placeholder={"Dauer eintragen"}
                        wide={false}
                        helpText={helperTextNursingMeasuresWrapper.durationValue}
                        rules={[{ required: durationRequired, message: "Bitte ausfüllen!" }]}
                    />
                    <InputDropDown
                        options={durationOptions}
                        name={props.name !== undefined ? [props.name, "durationUnit"] : "durationUnit"}
                        label={"Einheit"}
                        placeholder={"Einheit wählen"}
                        wide={false}
                        rules={[{ required: durationRequired, message: "Bitte ausfüllen!" }]}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <div className={"frequency"}>
                        <Label
                            title={"Häufigkeit der Durchführungen"}
                            required={periodRequired}
                            helperText={helperTextNursingMeasuresWrapper.frequency}
                        />
                        <div className={"input-frequency"}>
                            <Form.Item
                                style={{ minWidth: "50px" }}
                                name={props.name !== undefined ? [props.name, "frequency"] : "frequency"}
                                rules={[{ required: periodRequired, message: "Bitte ausfüllen!" }]}
                            >
                                <Input></Input>
                            </Form.Item>
                            <div style={{ textAlign: "center", minWidth: "50px" }}>mal pro</div>
                            <Form.Item
                                style={{ minWidth: "50px" }}
                                name={props.name !== undefined ? [props.name, "period"] : "period"}
                                rules={[{ required: periodRequired, message: "Bitte ausfüllen!" }]}
                            >
                                <Input></Input>
                            </Form.Item>
                            <Form.Item
                                style={{ minWidth: "90px" }}
                                name={props.name !== undefined ? [props.name, "periodUnit"] : "periodUnit"}
                                rules={[{ required: periodRequired, message: "Bitte ausfüllen!" }]}
                            >
                                <Select options={timeUnitOptions} placeholder={"Einheit"} allowClear={true} />
                            </Form.Item>
                        </div>
                    </div>
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        options={practitionerOptions}
                        name={props.name !== undefined ? [props.name, "performer"] : "performer"}
                        label={"Durchführende Person"}
                        placeholder={"Durchführende Person auswählen"}
                    />
                </div>
                <div className={"right"}>
                    <InputTextArea
                        name={props.name !== undefined ? [props.name, "comment"] : "comment"}
                        label={"Kommentar"}
                        placeholder={"Ggf. Kommentar eingeben"}
                    />
                </div>
            </div>
            {modalOpen && (
                <CustomModal<IPractitionerObject>
                    content={<PractitionerWrapper />}
                    label={"Neue behandelnde Person hinzufügen"}
                    open={modalOpen}
                    onOK={saveNewPractitioner}
                    onCancel={(): void => {
                        setModalOpen(false);
                        form.setFieldValue(fullPath.concat("performer"), undefined);
                    }}
                />
            )}
        </>
    );
};

export default NursingMeasuresWrapper;
