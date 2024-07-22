import { IResponse, StringPIO, SubTree } from "@thaias/pio_editor_meta";
import { Form } from "antd";
import React, { useEffect } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import PIOService from "../../../services/PIOService";
import { writeStaticFields } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import InputTextArea from "../../basic/InputTextArea";

/**
 * This form contains information about pains. Following FHIR resource is used:
 * - KBV_PR_MIO_ULB_Observation_Wish
 *
 * PIO-Small excludes following values:
 * - extension:naehereInformationen
 * - effectiveDateTime
 * - performer.reference
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const PatientWishForm = (props: IFormProps): React.JSX.Element => {
    //UUIDs of the SubTree
    const wishSubTreePath: string = "KBV_PR_MIO_ULB_Observation_Wish";
    const wishUUID: string = UUIDService.getUUID(wishSubTreePath);
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    //SubTree State
    const [wishSubTree, setWishSubTree] = React.useState<SubTree>();
    const form = props.form;

    /** Initialize SubTrees */
    useEffect(() => {
        PIOService.getSubTrees([wishUUID + "." + wishSubTreePath]).then((result: IResponse): void => {
            if (result.success)
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    setWishSubTree(subTree);
                    const patientWish: string | undefined = subTree
                        .getSubTreeByPath("valueCodeableConcept.text")
                        .getValueAsString();
                    form.setFieldValue("patientWish", patientWish);
                });
        });
    }, []);

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        wishSubTree?.deleteSubTreeByPath("");
        if (value.patientWish !== undefined && value.patientWish !== "") {
            console.log(value);
            wishSubTree?.setValue("valueCodeableConcept.text", StringPIO.parseFromString(value.patientWish as string));
            // Setting general values
            writeStaticFields(
                wishSubTree as SubTree,
                patientUUID,
                {
                    system: "http://snomed.info/sct",
                    version: "http://snomed.info/sct/900000000000207008/version/20220331",
                    code: "1186606009",
                    display: "Patient request observable (observable entity)",
                },
                true
            );
        }

        PIOService.saveSubTrees([wishSubTree as SubTree]).then((result: IResponse): void => {
            if (!result) console.debug(result);
        });
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"PatientWishForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <InputTextArea
                        name={["patientWish"]}
                        label={"Patientenwunsch"}
                        placeholder={"Ggf. Angaben zu Patientenwunsch..."}
                    />
                </div>
            </Form>
        </div>
    );
};
export default PatientWishForm;
