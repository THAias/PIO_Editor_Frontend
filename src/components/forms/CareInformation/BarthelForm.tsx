import { CodePIO, DateTimePIO, DecimalPIO, IResponse, SubTree, UuidPIO } from "@thaias/pio_editor_meta";
import { Form } from "antd";
import { Dayjs } from "dayjs";
import React, { useEffect, useState } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import {
    checkFormIsNotEmpty,
    convertDateJsToString,
    convertStringToDayJs,
    rangeOptions,
    writeCodingToSubTree,
} from "../../../services/HelperService";
import { helperTextBarthelForm } from "../../../services/HelperTextService";
import PIOService from "../../../services/PIOService";
import UUIDService from "../../../services/UUIDService";
import InputDatePicker from "../../basic/InputDatePicker";
import InputDropDown from "../../basic/InputDropDown";

/**
 * This form contains information about the barthel index. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Total_Barthel_Index
 *
 * PIO-Small:
 * - KBV_PR_MIO_ULB_Observation_Total_Barthel_Index
 *      - valueQuantity
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const BarthelForm = (props: IFormProps): React.JSX.Element => {
    const [required, setRequired] = useState<boolean>(false);
    // UUIDs
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const totalBarthelScorePath: string = "KBV_PR_MIO_ULB_Observation_Total_Barthel_Index";
    const totalBarthelScoreUUID: string = UUIDService.getUUID(totalBarthelScorePath);

    const form = props.form;

    // states
    const [barthelScoreSubTree, setBarthelScoreSubTree] = useState<SubTree>();

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect(() => {
        PIOService.getSubTrees([totalBarthelScoreUUID + "." + totalBarthelScorePath]).then(
            (result: IResponse): void => {
                if (result.success) {
                    const subTree: SubTree = (result.data?.subTrees as SubTree[])[0];
                    // Set field value
                    if (subTree) {
                        const barthelScore: string | undefined = subTree
                            .getSubTreeByPath("valueQuantity.value")
                            .getValueAsString();
                        const barthelEffectiveDateTime: string | undefined = subTree
                            .getSubTreeByPath("effectiveDateTime")
                            .getValueAsString();
                        form.setFieldsValue({
                            barthelScore: barthelScore,
                            barthelEffectiveDateTime: barthelEffectiveDateTime
                                ? convertStringToDayJs(barthelEffectiveDateTime)
                                : undefined,
                        });
                    }

                    // set states
                    setBarthelScoreSubTree(subTree);
                }
            }
        );
    }, []);

    const watchedFields = Form.useWatch([], form);
    useEffect((): void => {
        if (checkFormIsNotEmpty(watchedFields)) {
            setRequired(true);
        } else {
            setRequired(false);
            form.resetFields();
        }
    }, [watchedFields]);

    const saveBarthelScore = (barthelScore: string | undefined, date: Dayjs | undefined): void => {
        if (barthelScore && date) {
            barthelScoreSubTree?.deleteSubTreeByPath("");
            barthelScoreSubTree?.setValue("valueQuantity.value", DecimalPIO.parseFromString(barthelScore));
            barthelScoreSubTree?.setValue(
                "effectiveDateTime",
                DateTimePIO.parseFromString(convertDateJsToString(date))
            );
            // set status and patient reference
            barthelScoreSubTree?.setValue("status", new CodePIO("final"));
            barthelScoreSubTree?.setValue("subject.reference", UuidPIO.parseFromString(patientUUID));
            // Set fixed coding
            writeCodingToSubTree(barthelScoreSubTree as SubTree, "code.coding[0]", {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "725594005",
                display: "Barthel Index of Activities of Daily Living score (observable entity)",
            });
            writeCodingToSubTree(barthelScoreSubTree as SubTree, "code.coding[1]", {
                system: "http://loinc.org",
                version: "2.72,",
                code: "96761-2",
                display: "Total score Barthel Index",
            });
        } else {
            barthelScoreSubTree?.deleteSubTreeByPath("");
        }
        PIOService.saveSubTrees([barthelScoreSubTree as SubTree]).then((result: IResponse): void => {
            if (!result.success) console.error(result.message);
        });
    };
    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        saveBarthelScore(value.barthelScore as string | undefined, value.barthelEffectiveDateTime as Dayjs | undefined);
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"BarthelForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            options={rangeOptions(0, 100, 5)}
                            name={"barthelScore"}
                            label={"Index"}
                            wide={false}
                            placeholder={"Barthelgesamtindex"}
                            rules={[
                                { required: required, message: "Bitte geben Sie einen Index an!" },
                                { min: 0, max: 100, message: "Bitte geben Sie einen Index zwischen 0 und 100 an!" },
                            ]}
                            helpText={helperTextBarthelForm.barthelScore}
                        />
                        <InputDatePicker
                            wide={false}
                            name={"barthelEffectiveDateTime"}
                            label={"Festlegungsdatum"}
                            rules={[{ required: required, message: "Bitte geben Sie ein Festlegungsdatum an!" }]}
                        />
                    </div>
                    <div className={"right"}>
                        <div className={"info-card"}>
                            <div className={"info-card-content"}>
                                <b>0-30 Punkte:</b> Weitgehend pflegeabhängig
                                <br />
                                <b>35-80 Punkte:</b> Hilfsbedürftig
                                <br />
                                <b>85-95 Punkte:</b> Punktuell hilfsbedürftig
                                <br />
                                <b>100 Punkte:</b> Zustand kompletter Selbstständigkeit (bezogen auf den jeweiligen
                                Untersuchungskontext)
                            </div>
                        </div>
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default BarthelForm;
