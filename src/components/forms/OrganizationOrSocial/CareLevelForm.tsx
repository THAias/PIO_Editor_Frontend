import {
    CodePIO,
    DateTimePIO,
    IResponse,
    ITimePeriodObject,
    PrimitiveDataTypes,
    SubTree,
    UriPIO,
    UuidPIO,
} from "@thaias/pio_editor_meta";
import { Coding, SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Divider, Form } from "antd";
import { Dayjs } from "dayjs";
import React, { useEffect, useState } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import {
    checkCoding,
    convertDateJsToString,
    convertStringToDayJs,
    writeCodingToSubTree,
} from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import {
    deleteChildrenFromSubTree,
    extensionUrls,
    getChildrenFromSubTree,
    setValueIfExists,
} from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputDatePicker from "../../basic/InputDatePicker";
import InputDropDown from "../../basic/InputDropDown";
import InputTimePeriod from "../../basic/InputTimePeriod";
import RadioButton from "../../basic/RadioButton";

/**
 * This form contains information about the care level. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Care_Level (0..1)
 *
 * PIO-Small:
 * - KBV_PR_MIO_ULB_Observation_Care_Level.extension:empfehlung is not implemented
 * - KBV_PR_MIO_ULB_Observation_Care_Level.performer is not implemented
 * - KBV_PR_MIO_ULB_Observation_Care_Level.dataAbsentReason is not implemented
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const CareLevelForm = (props: IFormProps): React.JSX.Element => {
    //ValueSets
    const careLevelValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Level_of_Care");
    const careLevelOptions: SelectOptions = careLevelValueSet.getOptionsSync.map((option: SelectOption) => {
        switch (option.value) {
            case "9-984.6":
                option.label = "1";
                break;
            case "9-984.7":
                option.label = "2";
                break;
            case "9-984.8":
                option.label = "3";
                break;
            case "9-984.9":
                option.label = "4";
                break;
            case "9-984.a":
                option.label = "5";
                break;
        }
        return option;
    });
    const careLevelStatusValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Grade_of_Care_Status"
    );
    const careLevelStatusOptions: SelectOptions = careLevelStatusValueSet.getOptionsSync.map((option: SelectOption) => {
        if (option.value === "Pflegegrad_bewilligt") {
            option.label = "Bewilligt";
        } else {
            option.label = "Vorläufig";
        }
        return option;
    });
    const requestStatusValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Request_Status"
    );
    const requestStatusOptions: SelectOptions = requestStatusValueSet.getOptionsSync;

    //Paths for SubTrees (without uuid)
    const careLevelSubTreePath = "KBV_PR_MIO_ULB_Observation_Care_Level";

    //Uuids of resources
    const careLevelUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Observation_Care_Level");
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");

    //React states
    const [careLevelSubTree, setCareLevelSubTree] = useState<SubTree>();
    const [required, setRequired] = useState<boolean>();

    //Form hooks & watchers
    const form = props.form;
    const careLevelWatcher = Form.useWatch("careLevel", form);
    const careLevelStatusWatcher = Form.useWatch("careLevelStatus", form);

    //Handling dynamic required fields
    useEffect((): void => {
        if (careLevelStatusWatcher || careLevelWatcher) {
            setRequired(true);
        } else {
            setRequired(false);
        }
    }, [careLevelStatusWatcher, careLevelWatcher]);

    //Validate fields again, if required flag changes
    useEffect((): void => {
        if (!required) form.validateFields(["careLevel", "careLevelStatus"]);
    }, [required]);

    /**
     * Function for writing care level extension data to input fields.
     * @param {SubTree} extensionSubTrees SubTree cut out from KBV_PR_MIO_ULB_Observation_Care_Level resource
     */
    const setExtensions = (extensionSubTrees: SubTree[]): void => {
        extensionSubTrees.forEach((subTree: SubTree) => {
            if (subTree.data?.toString() === extensionUrls.careLevel.pflegegradstatus) {
                const code: string | undefined = subTree
                    .getSubTreeByPath("valueCodeableConcept.coding.code")
                    .getValueAsString();
                form.setFieldsValue({ careLevelStatus: code });
            } else if (subTree.data?.toString() === extensionUrls.careLevel.beantragungsstatus) {
                subTree.children.forEach((subSubTree: SubTree) => {
                    if (subSubTree.data?.toString() === extensionUrls.careLevel.beantragungsdatum) {
                        const date: string | undefined = subSubTree
                            .getSubTreeByPath("valueDateTime")
                            .getValueAsString()
                            ?.split("T")[0];
                        const dayJsObject: Dayjs | undefined = date ? convertStringToDayJs(date) : undefined;
                        form.setFieldsValue({ dateOfRequest: dayJsObject });
                    } else if (subSubTree.data?.toString() === extensionUrls.careLevel.antragsstatus) {
                        const code2: string | undefined = checkCoding(
                            subSubTree,
                            "valueCodeableConcept.coding",
                            requestStatusOptions
                        );
                        form.setFieldsValue({ requestStatus: code2 });
                    }
                });
            }
        });
    };

    /**
     * Function for writing care level value (1-5) to input field.
     * @param {SubTree} levelSubTree SubTree cut out from KBV_PR_MIO_ULB_Observation_Care_Level resource
     */
    const setCareLevel = (levelSubTree: SubTree): void => {
        const code: string | undefined = levelSubTree.getSubTreeByPath("code").getValueAsString();
        form.setFieldsValue({ careLevel: code });
    };

    /**
     * Function for writing time period to input fields.
     * @param {SubTree} timePeriodSubTree SubTree cut out from KBV_PR_MIO_ULB_Observation_Care_Level resource
     */
    const setTimePeriod = (timePeriodSubTree: SubTree): void => {
        const startString: string | undefined = timePeriodSubTree.getSubTreeByPath("start").getValueAsString();
        const endString: string | undefined = timePeriodSubTree.getSubTreeByPath("end").getValueAsString();
        const startDayJs: Dayjs | undefined = startString ? convertStringToDayJs(startString) : undefined;
        const endDayJs: Dayjs | undefined = endString ? convertStringToDayJs(endString) : undefined;
        form.setFieldsValue({
            timePeriod: {
                start: startDayJs,
                end: endDayJs,
            },
        });
    };

    /** Initialize careLevelSubTree. Then read SubTree data and initialize input fields. */
    useEffect(() => {
        //Get relevant SubTree from backend
        PIOService.getSubTrees([careLevelUUID + "." + careLevelSubTreePath]).then((result: IResponse): void => {
            if (result.success) {
                const subTree: SubTree = (result.data?.subTrees as SubTree[])[0];

                //Initialize input fields
                setExtensions(getChildrenFromSubTree(subTree, "extension["));
                setCareLevel(subTree.getSubTreeByPath("valueCodeableConcept.coding"));
                setTimePeriod(subTree.getSubTreeByPath("effectivePeriod"));

                //Set react state
                setCareLevelSubTree(subTree);
            }
        });
    }, []);

    /**
     * Saves all extensions to careLevelSubTree.
     * @param {IFormFinishObject} value Return object from Ant Design Form
     * @param {SubTree} subTree SubTree cut out from KBV_PR_MIO_ULB_Observation_Care_Level resource
     */
    const saveExtensions = (value: IFormFinishObject, subTree: SubTree): void => {
        let currentExtensionIndex: number = 0;
        let currentBeantragungsstatusIndex: number = 0;
        const currentBeantragungsstatusCodingSubTree: SubTree | undefined = subTree.children
            .find((subTree1: SubTree) => subTree1.data?.toString() === extensionUrls.careLevel.beantragungsstatus)
            ?.children.find((subTree1: SubTree) => subTree1.data?.toString() === extensionUrls.careLevel.antragsstatus)
            ?.getSubTreeByPath("valueCodeableConcept.coding");
        const currentBeantragungsstatusCoding: Coding | undefined = currentBeantragungsstatusCodingSubTree
            ? ({
                  system: currentBeantragungsstatusCodingSubTree.getSubTreeByPath("system").getValueAsString(),
                  version: currentBeantragungsstatusCodingSubTree.getSubTreeByPath("version").getValueAsString(),
                  code: currentBeantragungsstatusCodingSubTree.getSubTreeByPath("code").getValueAsString(),
                  display: currentBeantragungsstatusCodingSubTree.getSubTreeByPath("display").getValueAsString(),
              } as Coding)
            : undefined;

        //Delete all extensions
        deleteChildrenFromSubTree(subTree, "extension[");

        //Write extension 'pflegegradstatus' to careLevelSubTree
        if (value.careLevelStatus) {
            const coding: Coding | undefined = careLevelStatusValueSet.getObjectByCodeSync(
                value.careLevelStatus as string
            );
            const extensionPathElement: string = "extension[" + currentExtensionIndex + "]";
            setValueIfExists(extensionPathElement, new UriPIO(extensionUrls.careLevel.pflegegradstatus), subTree);
            writeCodingToSubTree(subTree, extensionPathElement + ".valueCodeableConcept.coding", coding);
            currentExtensionIndex++;
        }

        //Write extension 'beantragungsdatum' to careLevelSubTree
        if (value.dateOfRequest) {
            setValueIfExists(
                "extension[" + currentExtensionIndex + "]",
                new UriPIO(extensionUrls.careLevel.beantragungsstatus),
                subTree
            );
            const extensionPath: string = `extension[${currentExtensionIndex}].extension[${currentBeantragungsstatusIndex}]`;
            const valueDate: PrimitiveDataTypes | undefined = value.dateOfRequest
                ? DateTimePIO.parseFromString(
                      value.dateOfRequest && convertDateJsToString(value.dateOfRequest as Dayjs)
                  )
                : undefined;
            setValueIfExists(extensionPath, new UriPIO(extensionUrls.careLevel.beantragungsdatum), subTree);
            setValueIfExists(extensionPath + ".valueDateTime", valueDate, subTree);
            currentBeantragungsstatusIndex++;
        }

        //Write extension 'antragsstatus' to careLevelSubTree
        if (value.requestStatus) {
            setValueIfExists(
                `extension[${currentExtensionIndex}]`,
                new UriPIO(extensionUrls.careLevel.beantragungsstatus),
                subTree
            );
            const coding: Coding | undefined = requestStatusValueSet.getObjectByCodeSync(value.requestStatus as string);
            const extensionPath: string = `extension[${currentExtensionIndex}].extension[${currentBeantragungsstatusIndex}]`;
            setValueIfExists(extensionPath, new UriPIO(extensionUrls.careLevel.antragsstatus), subTree);
            if (coding) {
                writeCodingToSubTree(subTree, extensionPath + ".valueCodeableConcept.coding", coding);
            } else {
                //Unsupported code
                writeCodingToSubTree(
                    subTree,
                    extensionPath + ".valueCodeableConcept.coding",
                    currentBeantragungsstatusCoding
                );
            }
        }
    };

    /**
     * Saves the care level to subTree.
     * @param {IFormFinishObject} value Return object from Ant Design Form
     * @param {SubTree} subTree SubTree cut out from KBV_PR_MIO_ULB_Observation_Care_Level resource
     */
    const saveCareLevel = (value: IFormFinishObject, subTree: SubTree): void => {
        if (value.careLevel) {
            const coding: Coding | undefined = careLevelValueSet.getObjectByCodeSync(value.careLevel as string);
            writeCodingToSubTree(subTree, "valueCodeableConcept.coding", coding);
        } else {
            careLevelSubTree?.deleteSubTreeByPath("valueCodeableConcept");
        }
    };

    /**
     * Writes all fixed values to careLevelSubTree. If no data are present in 'value' -> fixed values are deleted.
     * @param {IFormFinishObject} value Return object from Ant Design Form
     * @param {SubTree} subTree SubTree cut out from KBV_PR_MIO_ULB_Observation_Care_Level resource
     */
    const writeFixedValues = (value: IFormFinishObject, subTree: SubTree): void => {
        if (
            value.careLevel ||
            value.careLevelStatus ||
            value.dateOfRequest ||
            value.requestStatus ||
            (value.timePeriod as ITimePeriodObject).start ||
            (value.timePeriod as ITimePeriodObject).end
        ) {
            subTree.setValue("status", new CodePIO("final"));
            writeCodingToSubTree(subTree, "code.coding", {
                system: "http://loinc.org",
                version: "2.72",
                code: "80391-6",
                display: "Level of care [Type]",
            } as Coding);
            setValueIfExists("subject.reference", new UuidPIO(patientUUID), subTree);
        } else {
            careLevelSubTree?.deleteSubTreeByPath("status");
            careLevelSubTree?.deleteSubTreeByPath("code");
            careLevelSubTree?.deleteSubTreeByPath("subject");
        }
    };

    /**
     * Saves the time period to careLevelSubTree.
     * @param {IFormFinishObject} value Return object from Ant Design Form
     * @param {SubTree} subTree SubTree cut out from KBV_PR_MIO_ULB_Observation_Care_Level resource
     */
    const saveTimePeriod = (value: IFormFinishObject, subTree: SubTree): void => {
        const startDate: Dayjs | undefined = (value.timePeriod as ITimePeriodObject).start;
        const endDate: Dayjs | undefined = (value.timePeriod as ITimePeriodObject).end;
        //Write 'start' to SubTree
        if (startDate) {
            subTree.setValue("effectivePeriod.start", DateTimePIO.parseFromString(convertDateJsToString(startDate)));
        } else {
            subTree.deleteSubTreeByPath("effectivePeriod");
        }

        //Write 'end' to SubTree
        if (startDate && endDate) {
            subTree.setValue("effectivePeriod.end", DateTimePIO.parseFromString(convertDateJsToString(endDate)));
        } else {
            subTree.deleteSubTreeByPath("effectivePeriod.end");
        }
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        if (!careLevelSubTree) return;
        saveExtensions(value, careLevelSubTree);
        saveCareLevel(value, careLevelSubTree);
        saveTimePeriod(value, careLevelSubTree);
        writeFixedValues(value, careLevelSubTree);

        //Sending careLevelSubTree to backend
        PIOService.saveSubTrees([careLevelSubTree]).then((result: IResponse): void => {
            if (!result.success) console.error(result.message);
        });
    };

    return (
        <div onBlur={form.submit}>
            <Divider />
            <Form
                layout={"vertical"}
                name={"CareLevelForm"}
                onFinish={onFinish}
                form={form}
                onValuesChange={() => form.validateFields()}
            >
                <div className={"form-line"}>
                    <div className={"left"}>
                        <RadioButton
                            label={"Pflegegradstatus"}
                            name={"careLevelStatus"}
                            options={careLevelStatusOptions}
                            rules={[
                                {
                                    required: required,
                                    message: "Bitte ausfüllen, da ein Pflegegrad angegeben ist.",
                                },
                            ]}
                        />
                    </div>
                    <div className={"right"}>
                        <RadioButton
                            label={"Pflegegrad"}
                            name={"careLevel"}
                            options={careLevelOptions}
                            rules={[
                                {
                                    required: required,
                                    message: "Bitte ausfüllen, da ein Pflegegradstatus angegeben ist.",
                                },
                            ]}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            label={"Beantragungsstatus"}
                            name={"requestStatus"}
                            options={requestStatusOptions}
                            placeholder={"Beantragungsstatus wählen"}
                            rules={[{ required: true, message: "Bitte wählen Sie einen Beantragungsstatus!" }]}
                        />
                    </div>
                    <div className={"right"}>
                        <InputDatePicker name={"dateOfRequest"} label={"Beantragungsdatum"} />
                    </div>
                </div>
                <InputTimePeriod name={"timePeriod"} label={"Gültigkeitszeitraum (von/bis)"} />
            </Form>
            <Divider />
        </div>
    );
};

export default CareLevelForm;
