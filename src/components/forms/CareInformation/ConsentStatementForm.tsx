import {
    CodePIO,
    DateTimePIO,
    IContactPersonObject,
    IResponse,
    StringPIO,
    SubTree,
    UuidPIO,
} from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import { Dayjs } from "dayjs";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { validate } from "uuid";

import { IConsentStatement, IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { RootState } from "../../../@types/ReduxTypes";
import {
    checkCoding,
    convertDateJsToString,
    convertStringToDayJs,
    getNameLabel,
    writeCodingToSubTree,
} from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import {
    getUuidFromValue,
    onFinishMulti,
    setValueIfExists,
    updateFindingState,
} from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import ConsentStatementWrapper from "../../wrappers/ConsentStatementWrapper";
import MultiWrapper from "../../wrappers/MultiWrapper";

/**
 * This form contains information about the care problems. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Consent_Statement
 * - KBV_PR_MIO_ULB_Observation_Personal_Statement (handled in Backend)
 *
 * PIO-Small exclusions:
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const ConsentStatementForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const policyRuleValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Health_Care_Proxy_Type"
    );
    const policyCodeOptions: SelectOptions = policyRuleValueSet.getOptionsSync;

    // UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const consentStatementPath: string = "KBV_PR_MIO_ULB_Consent_Statement";
    const consentStatementUUIDs: string[] | undefined = UUIDService.getUUIDs(consentStatementPath);

    // States
    const [consentStatementSubTrees, setConsentStatementSubTrees] = React.useState<Record<string, SubTree>>({});
    const form = props.form;
    const contactPersonReduxState: IContactPersonObject[] = useSelector((state: RootState) => state.contactPersonState);

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect((): void => {
        if (!consentStatementUUIDs || consentStatementUUIDs.length === 0) return;

        const subTreePaths: string[] = consentStatementUUIDs.map(
            (uuid: string): string => `${uuid}.${consentStatementPath}`
        );
        PIOService.getSubTrees(subTreePaths)
            .then((result: IResponse): void => {
                if (!result.success || !result.data) return;

                const subTrees: SubTree[] = result.data?.subTrees as SubTree[];
                const fieldValues: IConsentStatement[] = subTrees.map((subTree: SubTree): IConsentStatement => {
                    const id: string = subTree.absolutePath.split(".")[0];
                    const policyRule: string | undefined = checkCoding(subTree, "policyRule.coding", policyCodeOptions);
                    const comment: string | undefined = subTree
                        .getSubTreeByPath("sourceReference.display")
                        ?.getValueAsString();
                    const dateValue: string | undefined = subTree.getSubTreeByPath("dateTime")?.getValueAsString();
                    const dateTime: Dayjs | undefined = dateValue ? convertStringToDayJs(dateValue) : undefined;
                    const proxy: string | undefined = getUuidFromValue(
                        subTree.getSubTreeByPath("provision.actor.reference.reference")?.getValueAsString()
                    );
                    const proxyObj: IContactPersonObject | undefined = contactPersonReduxState.find(
                        (contactPerson: IContactPersonObject): boolean => contactPerson.id === proxy
                    );
                    return {
                        id: id,
                        policyRule: policyRule || "",
                        comment: comment,
                        dateTime: dateTime,
                        proxy: proxyObj?.id,
                    };
                });
                form.setFieldValue(["consentStatement"], fieldValues);
                updateFindingState(subTrees, setConsentStatementSubTrees);
            })
            .catch((error): void => {
                console.error("Error fetching subTrees:", error);
            });
    }, []);

    /**
     * Saves the data from the input fields and general values to the SubTree.
     * @param {SubTree} subTree SubTree to save the data to
     * @param {IConsentStatement} finding Object which holds the input data
     * @returns {SubTree} The modified SubTree
     */
    const updateSubTree = (subTree: SubTree, finding: IConsentStatement): SubTree => {
        const { policyRule, dateTime, comment, proxy }: IConsentStatement = finding;
        subTree.deleteSubTreeByPath("");

        if (policyRule && policyRuleValueSet.getObjectByCodeSync(policyRule))
            writeCodingToSubTree(subTree, "policyRule.coding", policyRuleValueSet.getObjectByCodeSync(policyRule));
        setValueIfExists("sourceReference.display", StringPIO.parseFromString(comment), subTree);
        setValueIfExists("dateTime", DateTimePIO.parseFromString(dateTime && convertDateJsToString(dateTime)), subTree);
        if (proxy) {
            writeCodingToSubTree(subTree, "provision.actor.role.coding", {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "54056000",
                display: "Trustee (person)",
            });
            if (validate(proxy))
                setValueIfExists("provision.actor.reference.reference", UuidPIO.parseFromString(proxy), subTree);
        }
        // General values
        if (policyRule || dateTime || comment || proxy) {
            setValueIfExists("patient.reference", UuidPIO.parseFromString(patientUUID), subTree);
            writeCodingToSubTree(subTree, "scope.coding", {
                system: "http://terminology.hl7.org/CodeSystem/consentscope",
                version: "4.0.1",
                code: "adr",
                display: "Advanced Care Directive",
            });
            writeCodingToSubTree(subTree, "category.coding", {
                system: "http://loinc.org",
                version: "2.72",
                code: "59284-0",
                display: "Patient Consent",
            });
            subTree.setValue("status", CodePIO.parseFromString("active"));
        }

        return subTree;
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        const findings: IConsentStatement[] = value.consentStatement as IConsentStatement[];
        onFinishMulti(
            consentStatementSubTrees,
            findings,
            updateSubTree,
            consentStatementPath,
            setConsentStatementSubTrees
        );
    };

    const getItemLabel = (obj: IConsentStatement): string => {
        const proxyName: string | undefined = getNameLabel(
            contactPersonReduxState.find(
                (contactPerson: IContactPersonObject): boolean => contactPerson.id === obj.proxy
            )?.name
        );
        return (
            (policyCodeOptions.find((problem: SelectOption): boolean => problem.value === obj?.policyRule)?.label ??
                obj?.policyRule ??
                "Persönliche Erklärung") + (proxyName ? ` (${proxyName})` : "")
        );
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"ConsentStatementForm"} onFinish={onFinish} form={form}>
                <MultiWrapper<IConsentStatement>
                    componentName={"consentStatement"}
                    SingleWrapper={ConsentStatementWrapper}
                    addText={"Neue persönliche Erklärung hinzufügen"}
                    label={getItemLabel}
                />
            </Form>
        </div>
    );
};

export default ConsentStatementForm;
