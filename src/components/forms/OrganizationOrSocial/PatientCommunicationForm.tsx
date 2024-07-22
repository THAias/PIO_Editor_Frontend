import { CodePIO, IResponse, ITelecomObject, StringPIO, SubTree } from "@thaias/pio_editor_meta";
import { Coding, SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { IExtension, RootState } from "../../../@types/ReduxTypes";
import subTreeExtensionActions from "../../../redux/actions/PatientExtensionActions";
import { reduxStore } from "../../../redux/store";
import {
    addOrDeleteExtensionInReactState,
    checkMultipleCoding,
    clearSubTree,
    getAllUnsupportedCodings,
    writeCodingToSubTree,
    writeUnsupportedCodingsToSubTree,
} from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import { extensionUrls, setValueIfExists } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputDropDown from "../../basic/InputDropDown";
import InputTextArea from "../../basic/InputTextArea";
import RadioButton from "../../basic/RadioButton";
import TelecomWrapper from "../../wrappers/TelecomWrapper";

/**
 * This form contains information about patient communication:
 * - KBV_PR_MIO_ULB_Patient.communication.language
 * - KBV_PR_MIO_ULB_Patient.extension.dolmetscher_erforderlich
 * - KBV_PR_MIO_ULB_Patient.extension.weitere_hinweise_zur_kommunikation
 * - KBV_PR_MIO_ULB_Patient.telecom
 *
 * PIO-Small:
 * - Cardinality of KBV_PR_MIO_ULB_Patient.extension.weitere_hinweise_zur_kommunikation reduced to 0..1
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const PatientCommunicationForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets
    const languageValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/languages");
    const languageOptions: SelectOptions = languageValueSet.getOptionsSync;

    //Paths for SubTrees (without uuid)
    const languageSubTreePath = "KBV_PR_MIO_ULB_Patient.communication";
    const telecomSubTreePath = "KBV_PR_MIO_ULB_Patient.telecom";

    //Uuids of resources
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");

    //SubTree states
    const [languageSubTree, setLanguageSubTree] = useState<SubTree>();
    const [telecomSubTree, setTelecomSubTree] = useState<SubTree>();
    const [extensionInterfaces, setExtensionInterfaces] = useState<IExtension[]>([]); // From Redux

    //Redux and Form Hooks
    const extensionReduxState: IExtension[] = useSelector(
        (state: RootState) => state.patientExtensionState
    ) as IExtension[];
    const form = props.form;

    const telecomTypeValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/contact-point-system");
    const telecomSystemOptions: SelectOptions = telecomTypeValueSet.getOptionsSync;

    const setLanguage = (languageTree: SubTree): void => {
        const languageCodes: string[] = checkMultipleCoding(languageTree, "language.coding", languageOptions);
        form.setFieldsValue({ language: languageCodes });
        setLanguageSubTree(languageTree);
    };

    const setTelecom = (telecomTree: SubTree): void => {
        if (telecomTree.children && telecomTree.children.length > 0) {
            const readTelecom: SelectOptions = telecomTree.children.map((subTree: SubTree) => {
                const system: string = subTree.getSubTreeByPath("system").getValueAsString() as string;
                return {
                    label: telecomSystemOptions.find((option: SelectOption) => option.value === system)?.label ?? "",
                    value: subTree.getSubTreeByPath("value").getValueAsString() as string,
                    system: system,
                };
            });
            form.setFieldsValue({ telecom: readTelecom });
        }
        setTelecomSubTree(telecomTree);
    };

    /** Initialize SubTrees. Then read SubTree data and initialize input fields. */
    useEffect(() => {
        //Get relevant SubTrees from backend
        const subTreePathArray: string[] = [
            patientUUID + "." + languageSubTreePath,
            patientUUID + "." + telecomSubTreePath,
        ];
        PIOService.getSubTrees(subTreePathArray).then((result: IResponse): void => {
            if (result.success) {
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    switch (subTree.absolutePath) {
                        case patientUUID + "." + languageSubTreePath:
                            setLanguage(subTree);
                            break;
                        case patientUUID + "." + telecomSubTreePath:
                            setTelecom(subTree);
                            break;
                        default:
                            return;
                    }
                });
            }
        });
    }, []);

    /** Separate useEffect() for redux handling. Initializes extension interfaces and their input fields. */
    useEffect((): void => {
        if (extensionReduxState) {
            //Deep clone redux state
            const extInterfaces: IExtension[] = extensionReduxState.map((item: IExtension) => {
                return { ...item };
            });

            //Get extension data
            let translatorNeededData: string | undefined = extInterfaces.find(
                (item: IExtension): boolean => item.url === extensionUrls.translatorNeeded
            )?.value;
            const notesForCommunicationData: string | undefined = extInterfaces.find(
                (item: IExtension): boolean => item.url === extensionUrls.notesForCommunication
            )?.value;

            //Set form fields and React state
            if (translatorNeededData) {
                translatorNeededData = translatorNeededData === "true" ? "Ja" : "Nein";
            }
            form.setFieldsValue({ translatorNeeded: translatorNeededData });
            form.setFieldsValue({ notesForCommunication: notesForCommunicationData });
            setExtensionInterfaces(extInterfaces);
        }
    }, [extensionReduxState]);

    /**
     * Write 'translator' and 'notes for communication' data to extension interfaces.
     * @param {IFormFinishObject} value Object which holds the input data.
     */
    const saveTranslatorAndNotesForCommunication = (value: IFormFinishObject): void => {
        //Get data
        const translatorData: string | undefined = value.translatorNeeded
            ? ((value.translatorNeeded as string) !== "Nein").toString()
            : undefined;
        const notesData: string | undefined = value.notesForCommunication
            ? (value.notesForCommunication as string)
            : undefined;
        addOrDeleteExtensionInReactState(
            extensionInterfaces,
            extensionUrls.translatorNeeded,
            "Boolean",
            translatorData
        );
        addOrDeleteExtensionInReactState(extensionInterfaces, extensionUrls.notesForCommunication, "String", notesData);
    };

    /**
     * Save language data to SubTree state.
     * @param {IFormFinishObject} value Object which holds the input data.
     */
    const saveLanguage = (value: IFormFinishObject): void => {
        const unsupportedCodings: Coding[] | undefined = getAllUnsupportedCodings(
            value.language as string[] | undefined,
            languageSubTree as SubTree,
            "language.coding",
            languageValueSet
        );

        //Write language codings to subTree
        clearSubTree(languageSubTree as SubTree);
        let nextIndex: number = 0;
        if (value.language) {
            (value.language as string[]).forEach((languageCode: string): void => {
                const coding: Coding | undefined = languageValueSet.getObjectByCodeSync(languageCode);
                writeCodingToSubTree(
                    languageSubTree as SubTree,
                    "communication[" + nextIndex + "].language.coding",
                    coding
                );
                if (coding) nextIndex++;
            });
        }

        writeUnsupportedCodingsToSubTree(
            languageSubTree as SubTree,
            "communication",
            "language.coding",
            unsupportedCodings
        );
    };

    const saveTelecom = (value: IFormFinishObject): void => {
        //Delete all telecom
        clearSubTree(telecomSubTree as SubTree);

        //Write telecom data to subTree
        let counter: number = 0;
        if (value.telecom) {
            (value.telecom as ITelecomObject[]).forEach((item: ITelecomObject): void => {
                if (item.value === undefined || item.value === "") return;
                setValueIfExists(
                    "telecom[" + counter + "].system",
                    new CodePIO(item.system),
                    telecomSubTree as SubTree
                );
                setValueIfExists(
                    "telecom[" + counter + "].value",
                    new StringPIO(item.value),
                    telecomSubTree as SubTree
                );
                counter++;
            });
        }
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        saveLanguage(value);
        saveTranslatorAndNotesForCommunication(value);
        saveTelecom(value);

        //Sending all subTrees to backend
        PIOService.saveSubTrees([languageSubTree as SubTree, telecomSubTree as SubTree]).then(
            (result: IResponse): void => {
                if (!result.success) console.debug(result.message);
            }
        );

        //Send extension interfaces to redux (redux will send data automatically to backend)
        reduxStore.dispatch(
            subTreeExtensionActions.setPatientExtensionRedux(
                extensionInterfaces.map((item: IExtension) => {
                    return { ...item }; // deep clone
                }),
                patientUUID + "." + "KBV_PR_MIO_ULB_Patient.extension"
            )
        );
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"PatientCommunicationForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"language"}
                            label={"Gesprochene Sprache"}
                            placeholder={"Wählen Sie eine Sprache aus"}
                            options={languageOptions}
                            multiple={true}
                            searchable={true}
                        />
                    </div>
                    <div className={"right"}>
                        <RadioButton
                            name={"translatorNeeded"}
                            label={"Dolmetscher erforderlich?"}
                            options={[
                                { label: "Ja", value: "Ja" },
                                { label: "Nein", value: "Nein" },
                            ]}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputTextArea
                            name={"notesForCommunication"}
                            label={"Weitere Hinweise zur Kommunikation"}
                            placeholder={"Bitte weitere Hinweise eingeben ..."}
                        />
                    </div>
                </div>
                <TelecomWrapper name={"telecom"} />
            </Form>
        </div>
    );
};

export default PatientCommunicationForm;
