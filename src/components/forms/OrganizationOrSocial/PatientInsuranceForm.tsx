import { BooleanPIO, CodePIO, IResponse, StringPIO, SubTree, UriPIO, UuidPIO } from "@thaias/pio_editor_meta";
import { Coding, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect, useState } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { checkCoding, clearSubTree, writeCodingToSubTree } from "../../../services/HelperService";
import { helperTextPatientInsuranceForm } from "../../../services/HelperTextService";
import PIOService from "../../../services/PIOService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputDropDown from "../../basic/InputDropDown";
import InputTextField from "../../basic/InputTextField";
import RadioButton from "../../basic/RadioButton";

/**
 * This form contains information about patient insurance data from three different FHIR resources:
 * - KBV_PR_MIO_ULB_Patient.identifier
 * - KBV_PR_MIO_ULB_Observation_Health_Insurance_Card_Given
 * - KBV_PR_MIO_ULB_Observation_Copayment_Exemption
 *
 * PIO-Small:
 * - Number of KBV_PR_MIO_ULB_Patient.identifier reduced to one
 * - KBV_PR_MIO_ULB_Patient.identifier.use ignored
 * - KBV_PR_MIO_ULB_Observation_Health_Insurance_Card_Given.effective ignored
 * - KBV_PR_MIO_ULB_Observation_Health_Insurance_Card_Given.performer ignored
 * - KBV_PR_MIO_ULB_Observation_Copayment_Exemption.effective ignored
 * - KBV_PR_MIO_ULB_Observation_Copayment_Exemption.performer ignored
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const PatientInsuranceForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets
    const copaymentExemptionValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Payment_Exemption"
    );
    const copaymentExemptionOptions: SelectOptions = copaymentExemptionValueSet.getOptionsSync;
    const insuranceTypeValueSet: ValueSets = new ValueSets("http://fhir.de/ValueSet/identifier-type-de-basis");

    //Paths for SubTrees (without uuid)
    const insuranceSubTreePath = "KBV_PR_MIO_ULB_Patient.identifier";
    const insuranceCardSubTreePath = "KBV_PR_MIO_ULB_Observation_Health_Insurance_Card_Given";
    const copaymentExemptionSubTreePath = "KBV_PR_MIO_ULB_Observation_Copayment_Exemption";

    //Uuids of resources
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const insuranceCardUUID: string = UUIDService.getUUID(insuranceCardSubTreePath);
    const copaymentExemptionUUID: string = UUIDService.getUUID(copaymentExemptionSubTreePath);

    //React states
    const [insuranceSubTree, setInsuranceSubTree] = useState<SubTree>();
    const [insuranceCardSubTree, setInsuranceCardSubTree] = useState<SubTree>();
    const [copaymentExemptionSubTree, setCopaymentExemptionSubTree] = useState<SubTree>();
    const [insuranceNumberDisabled, setInsuranceNumberDisabled] = useState<boolean>(true);

    //Forms & watcher
    const form = props.form;
    const insuranceTypeWatcher = Form.useWatch("typeOfInsurance", form);

    //Handling dynamic disabled filed "typeOfInsurance"
    useEffect((): void => {
        if (!insuranceTypeWatcher) {
            form.setFieldValue("insuranceNumber", undefined);
            setInsuranceNumberDisabled(true);
        } else {
            setInsuranceNumberDisabled(false);
        }
    }, [insuranceTypeWatcher]);

    useEffect((): void => {
        form.validateFields(["insuranceNumber"]);
    }, [insuranceNumberDisabled]);

    /** Initialize SubTrees and ValueSets. */
    useEffect((): void => {
        //Get SubTrees
        PIOService.getSubTrees([
            patientUUID + "." + insuranceSubTreePath,
            insuranceCardUUID + "." + insuranceCardSubTreePath,
            copaymentExemptionUUID + "." + copaymentExemptionSubTreePath,
        ]).then((result: IResponse): void => {
            if (result.success) {
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    switch (subTree.absolutePath) {
                        case patientUUID + "." + insuranceSubTreePath:
                            setInsuranceSubTree(subTree);
                            return;
                        case insuranceCardUUID + "." + insuranceCardSubTreePath:
                            setInsuranceCardSubTree(subTree);
                            return;
                        case copaymentExemptionUUID + "." + copaymentExemptionSubTreePath:
                            setCopaymentExemptionSubTree(subTree);
                            return;
                        default:
                            return;
                    }
                });
            }
        });
    }, [copaymentExemptionUUID, insuranceCardUUID, patientUUID]);

    /** Reads SubTrees and initializes input fields. */
    useEffect(() => {
        if (insuranceSubTree && insuranceCardSubTree && copaymentExemptionSubTree) {
            const insuranceTypeCode: string | undefined = insuranceSubTree
                .getSubTreeByPath("identifier[0].type.coding.code")
                .getValueAsString();
            if (insuranceTypeCode) setInsuranceNumberDisabled(false);
            const hasInsuranceCard: string | undefined = insuranceCardSubTree
                .getSubTreeByPath("valueBoolean")
                .getValueAsString();

            form.setFieldsValue({ typeOfInsurance: insuranceTypeCode });
            form.setFieldsValue({
                insuranceNumber: insuranceSubTree.getSubTreeByPath("identifier[0].value").getValueAsString(),
            });
            form.setFieldsValue({ insuranceCard: hasInsuranceCard });
            form.setFieldsValue({
                copaymentExemption: checkCoding(
                    copaymentExemptionSubTree,
                    "valueCodeableConcept.coding",
                    copaymentExemptionOptions
                ),
            });
        }
    }, [form, insuranceSubTree, insuranceCardSubTree, copaymentExemptionSubTree]);

    const saveInsurance = (value: IFormFinishObject): void => {
        //Clear subTree
        insuranceSubTree?.deleteSubTreeByPath("");

        //Write insurance number
        if (value.insuranceNumber)
            insuranceSubTree?.setValue(
                "identifier[0].value",
                StringPIO.parseFromString(value.insuranceNumber as string)
            );

        //Write insurance type as Coding
        if (value.typeOfInsurance && typeof value.typeOfInsurance === "string") {
            const coding: Coding | undefined = insuranceTypeValueSet.getObjectByCodeSync(value.typeOfInsurance);
            // workaround to get the english value
            if (coding && coding.code === "MR") {
                coding.display = "Medical record number";
            }
            writeCodingToSubTree(insuranceSubTree as SubTree, "identifier[0].type.coding", coding);
        }

        //Write identifier system
        if (value.tyoeOfInsurance === "GKV") {
            insuranceSubTree?.setValue(
                "identifier[0].system",
                UriPIO.parseFromString("http://fhir.de/sid/gkv/kvid-10")
            );
        }
    };

    const saveInsuranceCardGiven = (value: IFormFinishObject): void => {
        if (value.insuranceCard) {
            (insuranceCardSubTree as SubTree).setValue("status", CodePIO.parseFromString("final"));
            writeCodingToSubTree(insuranceCardSubTree as SubTree, "code.coding", {
                system: "https://fhir.kbv.de/CodeSystem/KBV_CS_MIO_ULB_Health_Insurance_Card",
                version: "1.0.0",
                code: "krankenkassenkarte_mitgegeben",
                display: "Krankenkassenkarte mitgegeben",
            });
            (insuranceCardSubTree as SubTree).setValue("subject.reference", UuidPIO.parseFromString(patientUUID));
            (insuranceCardSubTree as SubTree).setValue(
                "valueBoolean",
                BooleanPIO.parseFromString((value.insuranceCard as string)?.toLowerCase())
            );
        } else {
            clearSubTree(insuranceCardSubTree as SubTree);
        }
    };

    const saveCopaymentExemption = (value: IFormFinishObject): void => {
        //If unsupported code -> save nothing
        if (
            value.copaymentExemption &&
            !copaymentExemptionValueSet.getObjectByCodeSync(value.copaymentExemption as string)
        ) {
            return;
        }

        //Save copayment exemption code
        (copaymentExemptionSubTree as SubTree).setValue("status", CodePIO.parseFromString("final"));
        //fixedCoding
        writeCodingToSubTree(copaymentExemptionSubTree as SubTree, "code.coding", {
            system: "http://snomed.info/sct",
            version: "http://snomed.info/sct/900000000000207008/version/20220331",
            code: "363787002:704326004=308315007",
            display:
                "Observable entity (observable entity): Precondition (attribute) = Prescription payment exemption status (finding)",
        });
        (copaymentExemptionSubTree as SubTree).setValue("subject.reference", UuidPIO.parseFromString(patientUUID));
        const copaymentExemptionCoding: Coding | undefined = copaymentExemptionValueSet.getObjectByCodeSync(
            value.copaymentExemption as string
        );
        if (copaymentExemptionCoding)
            writeCodingToSubTree(
                copaymentExemptionSubTree as SubTree,
                "valueCodeableConcept.coding",
                copaymentExemptionCoding
            );
        else clearSubTree(copaymentExemptionSubTree as SubTree);
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        PIOService.deleteGivenDevice("3075dee8-21ac-41b9-bfb4-7f6069fc8786", "KBV_PR_MIO_ULB_Device").then((): void => {
            PIOService.getAllGivenDevices().then((result: IResponse) => {
                if (!result.success) console.warn(result.message);
            });
        });

        // Write data
        saveInsurance(value);
        saveInsuranceCardGiven(value);
        saveCopaymentExemption(value);

        //Send to backend
        PIOService.saveSubTrees([insuranceSubTree, insuranceCardSubTree, copaymentExemptionSubTree] as SubTree[]).then(
            (result: IResponse): void => {
                if (!result) console.debug(result);
            }
        );
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"PatientInsuranceForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <RadioButton
                            label={"Versicherungsart"}
                            name={"typeOfInsurance"}
                            options={[
                                { label: "Privat", value: "PKV" },
                                { label: "Gesetzlich", value: "GKV" },
                                { label: "Unbekannt", value: "MR" },
                            ]}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextField
                            label={"Versichertennummer"}
                            name={"insuranceNumber"}
                            placeholder={"Versichertennummer"}
                            helpText={helperTextPatientInsuranceForm.insuranceNumber}
                            disabled={insuranceNumberDisabled}
                            rules={[
                                {
                                    required: !insuranceNumberDisabled,
                                    message: "Bitte ausfüllen, da eine Versicherungsart ausgewählt ist.",
                                },
                            ]}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <RadioButton
                            label={"Krankenkassenkarte vorhanden?"}
                            name={"insuranceCard"}
                            options={[
                                { label: "Ja", value: "true" },
                                { label: "Nein", value: "false" },
                            ]}
                        />
                    </div>
                    <div className={"right"}>
                        <InputDropDown
                            label={"Zuzahlungsbefreiung"}
                            name={"copaymentExemption"}
                            options={copaymentExemptionOptions}
                            placeholder={"Zuzahlungsbefreiung"}
                        />
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default PatientInsuranceForm;
