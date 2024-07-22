import {
    CodePIO,
    DatePIO,
    IAddressObject,
    IFullNameObject,
    IResponse,
    StringPIO,
    SubTree,
    UriPIO,
} from "@thaias/pio_editor_meta";
import { Coding, SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form, FormInstance } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { AppDispatch, IExtension, IPatientStateObject, RootState } from "../../../@types/ReduxTypes";
import subTreeExtensionActions from "../../../redux/actions/PatientExtensionActions";
import patientDataActions from "../../../redux/actions/PatientStateActions";
import { reduxStore } from "../../../redux/store";
import {
    addOrDeleteExtensionInReactState,
    checkCode,
    checkCoding,
    clearSubTree,
    convertDateJsToString,
    convertStringToDayJs,
    getAddressLabel,
    writeCodingToSubTree,
} from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import {
    extensionUrls,
    getAddressListFromFinishObject,
    saveAddresses,
    saveName,
} from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputDatePicker from "../../basic/InputDatePicker";
import InputDropDown from "../../basic/InputDropDown";
import InputTextField from "../../basic/InputTextField";
import AddressWrapper from "../../wrappers/AddressWrapper";
import MultiWrapper from "../../wrappers/MultiWrapper";
import NameWrapper from "../../wrappers/NameWrapper";

/**
 * This form contains general information about patient:
 * - KBV_PR_MIO_ULB_Patient.birthDate
 * - KBV_PR_MIO_ULB_Patient.gender
 * - KBV_PR_MIO_ULB_Patient.maritalStatus
 * - KBV_PR_MIO_ULB_Patient.name
 * - KBV_PR_MIO_ULB_Patient.address
 * - KBV_PR_MIO_ULB_Patient.extension.konfessionReligion
 *
 * PIO-Small:
 * - konfessionReligion cardinality reduced to 0...1
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const PatientInfoForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets
    const genderValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/administrative-gender");
    const genderOtherValueSet: ValueSets = new ValueSets("http://fhir.de/ValueSet/gender-other-de");
    const genderOptions: SelectOptions = genderValueSet.getOptionsSync
        .filter((item: SelectOption): boolean => item.value !== "other")
        .concat(genderOtherValueSet.getOptionsSync);
    const maritalStatusValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/marital-status");
    const maritalStatusOptions: SelectOptions = maritalStatusValueSet.getOptionsSync;

    //Paths for SubTrees (without uuid)
    const birthDateSubTreePath = "KBV_PR_MIO_ULB_Patient.birthDate";
    const genderSubTreePath = "KBV_PR_MIO_ULB_Patient.gender";
    const maritalStatusSubTreePath = "KBV_PR_MIO_ULB_Patient.maritalStatus";
    const nameSubTreePath = "KBV_PR_MIO_ULB_Patient.name";
    const addressSubTreePath = "KBV_PR_MIO_ULB_Patient.address";

    //Uuids of resources
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");

    //SubTree states
    const [birthDateSubTree, setBirthDateSubTree] = useState<SubTree>();
    const [genderSubTree, setGenderSubTree] = useState<SubTree>();
    const [maritalStatusSubTree, setMaritalStatusSubTree] = useState<SubTree>();
    const [nameSubTree, setNameSubTree] = useState<SubTree>();
    const [addressSubTree, setAddressSubTree] = useState<SubTree>();
    const [extensionInterfaces, setExtensionInterfaces] = useState<IExtension[]>([]); // From Redux

    //Redux and Form Hooks
    const extensionReduxState: IExtension[] = useSelector(
        (state: RootState) => state.patientExtensionState
    ) as IExtension[];
    const form: FormInstance = props.form;
    const dispatch: AppDispatch = useDispatch();

    //Setter functions to prefill form fields with values and setup states
    const setBirthDateFormValue = (birthDateTree: SubTree): void => {
        const birthDateValue: string = birthDateTree?.getSubTreeByPath("").getValueAsString() as string;
        const birthDate: dayjs.Dayjs | undefined = birthDateValue ? convertStringToDayJs(birthDateValue) : undefined;
        const birthDateUnknown: string = birthDateTree
            ?.getSubTreeByPath("extension[0].valueCode")
            .getValueAsString() as string;
        if (birthDateUnknown) {
            form.setFieldsValue({
                birthDate_unknown: birthDateUnknown,
                birthDate: undefined,
            });
        } else {
            form.setFieldsValue({ birthDate: birthDate, birthDate_unknown: undefined });
        }
        dispatch(patientDataActions.setPatientBirthDateRedux(birthDate));
        setBirthDateSubTree(birthDateTree);
    };
    const setGenderFormValue = (genderTree: SubTree): void => {
        form.setFieldsValue({
            gender:
                genderTree?.getValueAsString() === "other"
                    ? genderTree?.getSubTreeByPath("extension[0].valueCoding.code").getValueAsString()
                    : checkCode(genderTree?.getValueAsString(), genderOptions),
        });
        dispatch(
            patientDataActions.setPatientGenderRedux(
                genderOptions.find((option: SelectOption): boolean => option.value === genderTree.getValueAsString())
                    ?.label
            )
        );
        setGenderSubTree(genderTree);
    };
    const setMaritalStatusFormValue = (maritalTree: SubTree): void => {
        form.setFieldsValue({
            maritalStatus: checkCoding(maritalTree, "coding", maritalStatusOptions),
        });
        setMaritalStatusSubTree(maritalTree);
    };
    //Setter and helper functions and constants for name form values
    const nameValues: IFullNameObject = {} as IFullNameObject;
    const setFamilyNameValues = (name: SubTree, official: boolean): void => {
        if (!official) nameValues.geburtsname = {} as IFullNameObject;
        name.children.forEach((family: SubTree): void => {
            switch (family.getValueAsString()) {
                case extensionUrls.name.nachname:
                    if (official) nameValues.familyName = family.children[0].getValueAsString() as string;
                    else
                        (nameValues.geburtsname as IFullNameObject).familyName =
                            family.children[0].getValueAsString() as string;
                    break;
                case extensionUrls.name.namenszusatz:
                    if (official) nameValues.namenszusatz = family?.children[0].getValueAsString();
                    else
                        (nameValues.geburtsname as IFullNameObject).namenszusatz =
                            family.children[0].getValueAsString() as string;
                    break;
                case extensionUrls.name.vorsatzwort:
                    if (official) nameValues.vorsatzwort = family?.children[0].getValueAsString();
                    else
                        (nameValues.geburtsname as IFullNameObject).vorsatzwort =
                            family.children[0].getValueAsString() as string;
                    break;
                default:
                    break;
            }
        });
    };
    const setNameFormValues = (nameTree: SubTree): void => {
        nameTree?.children.forEach((officialMaiden: SubTree): void => {
            const nameType: string | undefined = officialMaiden.children
                .find((subTree: SubTree): boolean => {
                    return subTree.lastPathElement === "use";
                })
                ?.getValueAsString();
            officialMaiden.children.forEach((name: SubTree): void => {
                switch (name.lastPathElement) {
                    case "given":
                        nameValues.givenName = name.getValueAsString();
                        break;
                    case "prefix":
                        nameValues.prefix = name.getValueAsString();
                        break;
                    case "family":
                        setFamilyNameValues(name, nameType === "official");
                        break;
                    default:
                        break;
                }
            });
        });
        dispatch(patientDataActions.setPatientNameRedux(nameValues));
        setNameSubTree(nameTree);
        form.setFieldsValue({ name: nameValues });
    };
    const setAddressFormValues = (addressTree: SubTree): void => {
        setAddressSubTree(addressTree);
        const address: IAddressObject[] = getAddressListFromFinishObject(addressTree);
        form.setFieldsValue({ address: address });
    };

    /** Load SubTrees from backend to setup states and prefill form */
    useEffect((): void => {
        //Get SubTrees
        PIOService.getSubTrees([
            patientUUID + "." + birthDateSubTreePath,
            patientUUID + "." + nameSubTreePath,
            patientUUID + "." + genderSubTreePath,
            patientUUID + "." + maritalStatusSubTreePath,
            patientUUID + "." + addressSubTreePath,
        ]).then((result: IResponse): void => {
            if (result.success)
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    switch (subTree.absolutePath) {
                        case patientUUID + "." + birthDateSubTreePath:
                            setBirthDateFormValue(subTree);
                            return;
                        case patientUUID + "." + genderSubTreePath:
                            setGenderFormValue(subTree);
                            return;
                        case patientUUID + "." + maritalStatusSubTreePath:
                            setMaritalStatusFormValue(subTree);
                            return;
                        case patientUUID + "." + nameSubTreePath:
                            setNameFormValues(subTree);
                            return;
                        case patientUUID + "." + addressSubTreePath:
                            setAddressFormValues(subTree);
                            return;
                        default:
                            return;
                    }
                });
        });
    }, []);

    /** Separate useEffect() for redux handling. Initializes extension interfaces and their input fields. */
    useEffect((): void => {
        if (extensionReduxState) {
            //Deep clone redux state
            const extInterfaces: IExtension[] = extensionReduxState.map((item: IExtension): IExtension => {
                return { ...item };
            });

            //Get extension data
            const confessionData: string | undefined = extInterfaces.find(
                (item: IExtension): boolean => item.url === extensionUrls.konfession_religion
            )?.value;

            //Set form fields and React state
            form.setFieldsValue({ konfession_religion: confessionData });
            setExtensionInterfaces(extInterfaces);
        }
    }, [extensionReduxState]);

    //Setter functions for inserting form values into correct subtrees before submitting to backend
    const saveBirthDate = (value: IFormFinishObject): void => {
        if (value.birthDate_unknown) {
            birthDateSubTree?.setValue("extension[0]", new UriPIO(extensionUrls.birthDateUnknown));
            birthDateSubTree?.setValue("extension[0].valueCode", new CodePIO("unknown"));
            birthDateSubTree?.deleteValue("");
        } else {
            // check if date exists and add 1 day to compensate for timezone conversion
            birthDateSubTree?.deleteSubTreeByPath("extension[0]");
            if (value.birthDate) {
                birthDateSubTree?.setValue(
                    "",
                    DatePIO.parseFromString(convertDateJsToString(value.birthDate as dayjs.Dayjs)?.split("T")[0])
                );
            }
        }
    };
    const saveGender = (value: IFormFinishObject): void => {
        //If unsupported code -> save nothing
        if (
            value.gender &&
            !genderValueSet.getObjectByCodeSync(value.gender as string) &&
            !genderOtherValueSet.getObjectByCodeSync(value.gender as string)
        ) {
            return;
        }

        //Save gender code
        const genderOther: boolean = value.gender === "X" || value.gender === "D";
        const genderCoding: Coding | undefined = genderValueSet.getObjectByCodeSync(
            genderOther ? "other" : (value.gender as string)
        );
        if (genderCoding && genderCoding.code) genderSubTree?.setValue("", new StringPIO(genderCoding.code));
        else genderSubTree?.deleteSubTreeByPath("");
        if (genderOther) {
            genderSubTree?.setValue("extension[0]", new UriPIO("http://fhir.de/StructureDefinition/gender-amtlich-de"));
            const genderOtherCoding: Coding | undefined = genderOtherValueSet.getObjectByCodeSync(
                value.gender as string
            );
            if (genderOtherCoding)
                writeCodingToSubTree(genderSubTree as SubTree, "extension[0].valueCoding", genderOtherCoding);
        } else {
            genderSubTree?.deleteSubTreeByPath("extension[0]");
        }
    };
    const saveConfession = (value: IFormFinishObject): void => {
        addOrDeleteExtensionInReactState(
            extensionInterfaces,
            extensionUrls.konfession_religion,
            "String",
            value.konfession_religion as string | undefined
        );
    };
    const saveMaritalStatus = (value: IFormFinishObject): void => {
        //If unsupported code -> save nothing
        if (value.maritalStatus && !maritalStatusValueSet.getObjectByCodeSync(value.maritalStatus as string)) {
            return;
        }

        //Save code
        const maritalStatusCoding: Coding | undefined = maritalStatusValueSet.getObjectByCodeSync(
            value.maritalStatus as string
        );
        if (maritalStatusCoding) writeCodingToSubTree(maritalStatusSubTree as SubTree, "coding", maritalStatusCoding);
        else clearSubTree(maritalStatusSubTree as SubTree);
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        saveBirthDate(value);
        saveGender(value);
        saveConfession(value);
        saveName(value, nameSubTree);
        saveMaritalStatus(value);
        saveAddresses(value, addressSubTree);

        dispatch(
            patientDataActions.setPatientDataRedux({
                patientBirthDate: value.birthDate,
                patientName: value.name,
                patientGender: genderOptions.find((option: SelectOption): boolean => option.value === value.gender)
                    ?.label,
            } as IPatientStateObject)
        );

        //Sending all filled subtrees to backend
        const subTreesForSending: SubTree[] = [];
        const subtreesToCheck: (SubTree | undefined)[] = [
            birthDateSubTree,
            genderSubTree,
            maritalStatusSubTree,
            nameSubTree,
            addressSubTree,
        ];
        subtreesToCheck.forEach((subTree: SubTree | undefined): void => {
            if (subTree?.lastPathElement === "extension[0]") {
                if (subTree.children.length > 0 || subTree.data !== undefined) subTreesForSending.push(subTree);
            } else subTreesForSending.push(subTree as SubTree);
        });
        PIOService.saveSubTrees(subTreesForSending).then((result: IResponse): void => {
            if (!result.success) console.error(result.message);
        });

        //Send extension interfaces to redux (redux will send data automatically to backend)
        reduxStore.dispatch(
            subTreeExtensionActions.setPatientExtensionRedux(
                extensionInterfaces.map((item: IExtension): IExtension => {
                    return { ...item }; // deep clone
                }),
                patientUUID + "." + "KBV_PR_MIO_ULB_Patient.extension"
            )
        );
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"PatientInfoForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDatePicker
                            name={"birthDate"}
                            label={"Geburtsdatum"}
                            unknownCheckboxName={"birthDate_unknown"}
                            unknownCheckBoxValue={"unknown"}
                            rules={[{ required: true, message: "Bitte geben Sie ein Geburtsdatum an!" }]}
                        />
                    </div>
                    <div className={"right"}>
                        <InputDropDown
                            name={"gender"}
                            label={"Geschlecht"}
                            options={genderOptions}
                            placeholder={"Geschlecht"}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"maritalStatus"}
                            label={"Heiratsstatus"}
                            placeholder={"Personenstand wählen"}
                            options={maritalStatusOptions}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextField
                            name={"konfession_religion"}
                            label={"Konfession/Religion"}
                            placeholder={"Konfession eintragen"}
                        />
                    </div>
                </div>
                <NameWrapper name={"name"} maidenName={true} />
                <MultiWrapper<IAddressObject>
                    componentName={"address"}
                    addText={"Adresse Hinzufügen"}
                    label={getAddressLabel}
                    SingleWrapper={AddressWrapper}
                />
            </Form>
        </div>
    );
};

export default PatientInfoForm;
