import {
    CodePIO,
    DateTimePIO,
    IResponse,
    ITimePeriodObject,
    MarkdownPIO,
    StringPIO,
    SubTree,
    UuidPIO,
} from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form, FormInstance } from "antd";
import { Dayjs } from "dayjs";
import React, { useEffect } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { convertDateJsToString, convertStringToDayJs, writeCodingToSubTree } from "../../../services/HelperService";
import { helperTextIsolationForm } from "../../../services/HelperTextService";
import PIOService from "../../../services/PIOService";
import { setValueIfExists, writeStaticFields } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputTextArea from "../../basic/InputTextArea";
import InputTimePeriod from "../../basic/InputTimePeriod";
import RadioButton from "../../basic/RadioButton";

/**
 * This form contains information about isolation. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Isolation_Necessary
 * - KBV_PR_MIO_ULB_Observation_Procedure_Isolation
 *
 * PIO-Small exclusions:
 * - KBV_PR_MIO_ULB_Observation_Isolation_Necessary
 *      - extension:naehereInformationen
 *      - effectiveDateTime
 *      - performer
 * - KBV_PR_MIO_ULB_Observation_Procedure_Isolation
 *      - reasonReference
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const IsolationForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const isolationValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Isolation_Necessity"
    );
    const isolationTypeValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Isolation_Type"
    );
    const isolationOptionsOrder: string[] = [
        "129125009:363589002=40174006,408730004=897015005",
        "129125009:363589002=40174006,408730004=897016006",
        "129125009:363589002=40174006,408730004=410537005",
    ];
    const isolationOptions: SelectOptions = isolationValueSet.getOptionsSync
        .map((option: SelectOption) => {
            switch (option.value) {
                case "129125009:363589002=40174006,408730004=897016006":
                    option.label = "Nicht notwendig";
                    break;
                case "129125009:363589002=40174006,408730004=410537005":
                    option.label = "Unbekannt";
                    break;
                case "129125009:363589002=40174006,408730004=897015005":
                    option.label = "Notwendig";
                    break;
            }
            return option;
        })
        .sort(
            (a: SelectOption, b: SelectOption) =>
                isolationOptionsOrder.indexOf(a.value) - isolationOptionsOrder.indexOf(b.value)
        );
    const isolationTypeOptions: SelectOptions = isolationTypeValueSet.getOptionsSync;

    // UUIDs and paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const isolationNecessityPath: string = "KBV_PR_MIO_ULB_Observation_Isolation_Necessary";
    const isolationNecessityUUID: string = UUIDService.getUUID(isolationNecessityPath);
    const isolationProcedurePath: string = "KBV_PR_MIO_ULB_Procedure_Isolation";
    const isolationProcedureUUID: string = UUIDService.getUUID(isolationProcedurePath);

    // States
    const [isolationNecessitySubTree, setIsolationNecessitySubTree] = React.useState<SubTree>();
    const [isolationProcedureSubTree, setIsolationProcedureSubTree] = React.useState<SubTree>();
    const form: FormInstance = props.form;
    const isolationRequired: boolean =
        Form.useWatch("isolation", form) === "129125009:363589002=40174006,408730004=897015005";

    /**
     * Function for writing isolation procedure values to input fields.
     * @param {SubTree} subTree SubTree to get the values for the form
     */
    const setIsolationProcedureFields = (subTree: SubTree): void => {
        const fieldValues: Record<string, string | ITimePeriodObject | undefined> = {};
        const startString: string | undefined = subTree.getSubTreeByPath("performedPeriod.start").getValueAsString();
        const endString: string | undefined = subTree.getSubTreeByPath("performedPeriod.end").getValueAsString();
        fieldValues.isolationDate = {
            start: startString ? convertStringToDayJs(startString) : undefined,
            end: endString ? convertStringToDayJs(endString) : undefined,
        };
        fieldValues.isolationReason = subTree.getSubTreeByPath("code.coding.code").getValueAsString();
        fieldValues.isolationFurtherNotes = subTree.getSubTreeByPath("note.text").getValueAsString();
        form.setFieldsValue(fieldValues);
    };

    /**
     * Sets the isolationNecessitySubTree and isolationProcedureSubTree state.
     */
    useEffect((): void => {
        PIOService.getSubTrees([
            isolationNecessityUUID + "." + isolationNecessityPath,
            isolationProcedureUUID + "." + isolationProcedurePath,
        ]).then((result: IResponse): void => {
            if (result.success)
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    switch (subTree.lastPathElement) {
                        case isolationNecessityPath:
                            setIsolationNecessitySubTree(subTree);
                            form.setFieldValue(
                                "isolation",
                                subTree.getSubTreeByPath("valueCodeableConcept.coding.code").getValueAsString()
                            );
                            break;
                        case isolationProcedurePath:
                            setIsolationProcedureSubTree(subTree);
                            setIsolationProcedureFields(subTree);
                            break;
                        default:
                            break;
                    }
                });
        });
    }, []);

    /**
     * Saves the isolation SubTree.
     * @param {IFormFinishObject} value The Form values to save into the SubTree
     */
    const saveIsolationNecessity = (value: IFormFinishObject): void => {
        const subTree: SubTree = isolationNecessitySubTree as SubTree;

        if (value.isolation) {
            writeCodingToSubTree(
                subTree,
                "valueCodeableConcept.coding",
                isolationValueSet.getObjectByCodeSync(value.isolation as string)
            );
            //Just create extension if isolation is necessary
            if (value.isolation === "129125009:363589002=40174006,408730004=897015005") {
                subTree.setValue(
                    "extension[0]",
                    new StringPIO("https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Reference_Has_Member")
                );
                subTree.setValue("extension[0].valueReference.reference", new UuidPIO(isolationProcedureUUID));
            }
            // General values
            writeStaticFields(
                subTree,
                patientUUID,
                {
                    system: "http://snomed.info/sct",
                    version: "http://snomed.info/sct/900000000000207008/version/20220331",
                    code: "363787002:704321009=40174006",
                    display:
                        "Observable entity (observable entity) : Characterizes (attribute) = Isolation procedure (procedure)",
                },
                true
            );
        }
    };

    /**
     * Saves the isolation procedure SubTree.
     * @param {IFormFinishObject} value The Form values to save into the SubTree
     */
    const saveIsolationProcedure = (value: IFormFinishObject): void => {
        //Just create subTree if isolation is necessary
        if (value.isolation === "129125009:363589002=40174006,408730004=897015005") {
            const subTree: SubTree = isolationProcedureSubTree as SubTree;
            if (value.isolationDate) {
                const startDate: Dayjs | undefined = (value.isolationDate as ITimePeriodObject).start;
                const endDate: Dayjs | undefined = (value.isolationDate as ITimePeriodObject).end;
                setValueIfExists(
                    "performedPeriod.start",
                    DateTimePIO.parseFromString(startDate && convertDateJsToString(startDate)),
                    subTree
                );
                setValueIfExists(
                    "performedPeriod.end",
                    DateTimePIO.parseFromString(endDate && convertDateJsToString(endDate)),
                    subTree
                );
            }
            if (value.isolationReason) {
                writeCodingToSubTree(
                    subTree,
                    "code.coding",
                    isolationTypeValueSet.getObjectByCodeSync(value.isolationReason as string)
                );
            }
            setValueIfExists("note.text", MarkdownPIO.parseFromString(value.isolationFurtherNotes as string), subTree);

            // General values
            writeStaticFields(subTree, patientUUID, undefined, false);
            subTree?.setValue("status", CodePIO.parseFromString("completed"));
            writeCodingToSubTree(subTree, "category.coding", {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "40174006",
                display: "Isolation procedure (procedure)",
            });
        }
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        isolationNecessitySubTree?.deleteSubTreeByPath("");
        isolationProcedureSubTree?.deleteSubTreeByPath("");
        if (value.isolation) {
            saveIsolationNecessity(value);
            saveIsolationProcedure(value);
        }

        PIOService.saveSubTrees([isolationNecessitySubTree as SubTree, isolationProcedureSubTree as SubTree]).then(
            (result: IResponse): void => {
                if (!result.success) console.error(result.message);
            }
        );
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"IsolationForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <RadioButton
                            name={"isolation"}
                            label={"Angaben zur Isolation"}
                            options={isolationOptions}
                            unknownOption={true}
                            helpText={helperTextIsolationForm.isolation}
                        />
                    </div>
                    {isolationRequired && (
                        <div className={"right"}>
                            <InputTimePeriod
                                name={"isolationDate"}
                                label={"Zeitraum der Isolation (von/bis)"}
                                rules={[{ required: isolationRequired, message: "Bitte geben Sie einen Zeitraum an!" }]}
                                helpText={helperTextIsolationForm.isolationDate}
                            />
                        </div>
                    )}
                </div>
                {isolationRequired && (
                    <div className={"form-line"}>
                        <div className={"left"}>
                            <RadioButton
                                name={"isolationReason"}
                                label={"Grund der Isolation"}
                                options={isolationTypeOptions}
                                rules={[{ required: isolationRequired, message: "Bitte geben Sie einen Grund an!" }]}
                                unknownOption={false}
                            />
                        </div>
                        <div className={"right"}>
                            <InputTextArea
                                name={"isolationFurtherNotes"}
                                label={"Kommentar"}
                                placeholder={"Ggf. Ergänzungen zur Isolation..."}
                                helpText={helperTextIsolationForm.isolationFurtherNotes}
                            />
                        </div>
                    </div>
                )}
            </Form>
        </div>
    );
};

export default IsolationForm;
