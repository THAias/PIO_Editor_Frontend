import { IDeviceObject, IResponse, MarkdownPIO, StringPIO, SubTree, UriPIO, UuidPIO } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Checkbox, Form, FormListFieldData, Space } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import React, { useEffect } from "react";
import { v4, validate } from "uuid";

import { IDeviceAid, IDeviceAidAdditions, IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { checkCoding, getDeviceLabel, writeCodingToSubTree } from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import {
    extensionUrls,
    getUuidFromValue,
    onFinishMulti,
    setValueIfExists,
    updateFindingState,
} from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputDropDown from "../../basic/InputDropDown";
import InputTextArea from "../../basic/InputTextArea";
import DeviceWrapper from "../../wrappers/DeviceWrapper";
import MultiWrapper from "../../wrappers/MultiWrapper";

/**
 * This form contains information about devices aid. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Device_Aid
 * - KBV_PR_MIO_ULB_Device
 *
 * PIO-Small:
 * - Codesystem for "Hilfsmittel" does not work -> hard coded values for "Hilfsmittel"
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const DevicesAidForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const deviceTypeValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Device_SNOMED_CT");
    const deviceAidOptions: SelectOptions = [
        { value: "Brille / Sehhilfe", label: "Brille / Sehhilfe" },
        { value: "Lesehilfe / Lupe", label: "Lesehilfe / Lupe" },
        { value: "Kontaktlinse (rechtes Auge)", label: "Kontaktlinse (rechtes Auge)" },
        { value: "Kontaktlinse (linkes Auge)", label: "Kontaktlinse (linkes Auge)" },
        { value: "Hörgeräte (rechtes Ohr)", label: "Hörgeräte (rechtes Ohr)" },
        { value: "Hörgeräte (linkes Ohr)", label: "Hörgeräte (linkes Ohr)" },
        { value: "Zahnprothese (Oberkiefer)", label: "Zahnprothese (Oberkiefer)" },
        { value: "Zahnprothese (Unterkiefer)", label: "Zahnprothese (Unterkiefer)" },
        { value: "Zahnteilprothese (Oberkiefer)", label: "Zahnteilprothese (Oberkiefer)" },
        { value: "Zahnteilprothese (Unterkiefer)", label: "Zahnteilprothese (Unterkiefer)" },
        { value: "Gehstock / Gehstütze", label: "Gehstock / Gehstütze" },
        { value: "Rollator / Gehwagen", label: "Rollator / Gehwagen" },
        { value: "Rollstuhl", label: "Rollstuhl" },
        { value: "Prothesen", label: "Prothesen" },
        { value: "Sonstiges", label: "Sonstiges" },
    ];

    // UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const deviceAidPath: string = "KBV_PR_MIO_ULB_Device_Aid";
    const deviceAidUUIDs: string[] | undefined = UUIDService.getUUIDs(deviceAidPath);
    const devicePath: string = "KBV_PR_MIO_ULB_Device";
    const deviceUUIDs: string[] | undefined = UUIDService.getUUIDs(devicePath);

    // States
    const [deviceAidSubTrees, setDeviceAidSubTrees] = React.useState<Record<string, SubTree>>({});
    const [deviceSubTrees, setDeviceSubTrees] = React.useState<Record<string, SubTree>>({});
    const form = props.form;
    const deviceAidTypes = Form.useWatch("deviceAidType", form);

    const getDeviceObject = (subTree: SubTree, givenDevices: string[]): IDeviceObject => {
        const uuid: string = subTree.absolutePath.split(".")[0];
        const orgaUuid: string | undefined = subTree
            .getSubTreeByPath("extension[0].valueReference.reference")
            .getValueAsString();
        return {
            id: uuid,
            deviceType: checkCoding(subTree, "type.coding", deviceTypeValueSet.getOptionsSync),
            deviceName:
                subTree.getSubTreeByPath("deviceName.name").getValueAsString() ??
                subTree.getSubTreeByPath("deviceName.name[0]").getValueAsString(),
            modelNumber: subTree.getSubTreeByPath("modelNumber").getValueAsString(),
            udiCarrier: subTree.getSubTreeByPath("udiCarrier.deviceIdentifier").getValueAsString(),
            serialNumber: subTree.getSubTreeByPath("serialNumber").getValueAsString(),
            deviceResponsibleOrganization: orgaUuid ? getUuidFromValue(orgaUuid) : undefined,
            given: givenDevices.includes(uuid),
        };
    };

    useEffect((): void => {
        const subTreePaths: string[] = [];
        if (deviceUUIDs && deviceUUIDs.length !== 0)
            deviceUUIDs.forEach((uuid: string): number => subTreePaths.push(`${uuid}.${devicePath}`));
        if (deviceAidUUIDs && deviceAidUUIDs.length !== 0)
            deviceAidUUIDs.forEach((uuid: string): number => subTreePaths.push(`${uuid}.${deviceAidPath}`));
        if (subTreePaths.length === 0) return;
        PIOService.getAllGivenDevices().then((givenDevicesResult: IResponse): void => {
            const givenDeviceAids: string[] =
                givenDevicesResult.data?.allGivenDevices?.[deviceAidPath.toString()] ?? [];
            const givenDevices: string[] = givenDevicesResult.data?.allGivenDevices?.[devicePath.toString()] ?? [];
            PIOService.getSubTrees(subTreePaths).then((result: IResponse): void => {
                if (!result.success || !result.data) return;
                const devices: SubTree[] = [];
                const deviceAids: SubTree[] = [];
                const deviceValues: IDeviceObject[] = [];
                const deviceAidValues: string[] = [];
                const deviceAidComments: IDeviceAidAdditions[] = [];
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    if (subTree.lastPathElement === devicePath) {
                        devices.push(subTree);
                        deviceValues.push(getDeviceObject(subTree, givenDevices));
                    } else {
                        const deviceAidCoding: string = checkCoding(subTree, "type.coding", deviceAidOptions) ?? "";
                        deviceAids.push(subTree);
                        deviceAidValues.push(deviceAidCoding);
                        deviceAidComments.push({
                            label: deviceAidCoding,
                            value: subTree.getSubTreeByPath("note.text").getValueAsString() as string,
                            id: subTree.absolutePath.split(".")[0],
                            given: givenDeviceAids.includes(subTree.absolutePath.split(".")[0]),
                        });
                    }
                });
                form.setFieldValue(["devices"], deviceValues);
                updateFindingState(devices, setDeviceSubTrees);
                form.setFieldValue(
                    ["deviceAidType"],
                    deviceAidValues.filter((item: string) => item !== "")
                );
                form.setFieldValue(["comments"], deviceAidComments);
                updateFindingState(deviceAids, setDeviceAidSubTrees);
            });
        });
    }, []);

    useEffect((): void => {
        form.setFieldValue(
            ["comments"],
            deviceAidTypes?.map((deviceType: string): Record<string, string> => {
                const element = form
                    .getFieldValue(["comments"])
                    ?.find((comment: Record<string, string>): boolean => comment.label === deviceType);
                return {
                    label: deviceType,
                    value: element?.value,
                    id: element?.id,
                    given: element?.given ?? false,
                };
            })
        );
    }, [deviceAidTypes]);

    /**
     * Saves the data from the input fields and general values to the SubTree.
     * @param {SubTree} subTree SubTree to save the data to
     * @param {IDeviceObject} device Object which holds the input data
     * @returns {SubTree} The modified SubTree
     */
    const saveDeviceSubTree = (subTree: SubTree, device: IDeviceObject): SubTree => {
        subTree.deleteSubTreeByPath("");
        if (device.deviceType && deviceTypeValueSet.getObjectByCodeSync(device.deviceType))
            writeCodingToSubTree(subTree, "type.coding", deviceTypeValueSet.getObjectByCodeSync(device.deviceType));
        if (device.deviceResponsibleOrganization && validate(device.deviceResponsibleOrganization)) {
            subTree.setValue(
                "extension[0].valueReference.reference",
                UuidPIO.parseFromString(device.deviceResponsibleOrganization)
            );
            subTree.setValue("extension[0]", UriPIO.parseFromString(extensionUrls.responsibleParty));
        }
        if (device.deviceName) {
            subTree.setValue("deviceName.name", StringPIO.parseFromString(device.deviceName));
        }
        setValueIfExists("modelNumber", StringPIO.parseFromString(device.modelNumber), subTree);
        setValueIfExists("udiCarrier.deviceIdentifier", StringPIO.parseFromString(device.udiCarrier), subTree);
        setValueIfExists("serialNumber", StringPIO.parseFromString(device.serialNumber), subTree);
        if (subTree.children.length > 0) subTree.setValue("patient.reference", UuidPIO.parseFromString(patientUUID));

        return subTree;
    };

    const saveDeviceAidSubTree = (subTree: SubTree, deviceAid: IDeviceAid): SubTree => {
        subTree.deleteSubTreeByPath("");
        writeCodingToSubTree(subTree, "extension[0].valueCodeableConcept.coding", {
            system: "http://snomed.info/sct",
            version: "http://snomed.info/sct/900000000000207008/version/20220331",
            code: "1141802005",
            display: "Assistive device (physical object)",
        });
        subTree.setValue("extension[0]", UriPIO.parseFromString(extensionUrls.terminology));
        setValueIfExists("note.text", MarkdownPIO.parseFromString(deviceAid.comment), subTree);
        subTree.setValue("patient.reference", UuidPIO.parseFromString(patientUUID));

        if (deviceAidOptions.find((option: SelectOption) => option.value === deviceAid.deviceAid)) {
            //Supported code. (unsupported codes -> don't overwrite coding)
            writeCodingToSubTree(subTree, "type.coding", {
                system: "https://fhir.kbv.de/NamingSystem/KBV_NS_MIO_ULB_Hilfsmittelverzeichnis",
                version: "1.0.0",
                code: deviceAid.deviceAid,
                display: deviceAid.deviceAid,
            });
        }

        return subTree;
    };

    /**
     * Handles the devices. Adds or deletes the devices from the PIO-Service.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const handleDevices = (value: IFormFinishObject): void => {
        const devices: IDeviceObject[] = value.devices as IDeviceObject[];
        devices?.forEach((device: IDeviceObject): void => {
            if (device.given) {
                PIOService.addGivenDevice(device.id, "KBV_PR_MIO_ULB_Device").then((result: IResponse): void => {
                    if (!result.success) console.info(result);
                });
            } else {
                PIOService.deleteGivenDevice(device.id, "KBV_PR_MIO_ULB_Device").then((result: IResponse): void => {
                    if (!result.success) console.info(result);
                });
            }
        });
        if (devices) onFinishMulti(deviceSubTrees, devices, saveDeviceSubTree, devicePath, setDeviceSubTrees);
    };

    /**
     * Handles the device aids. Adds or deletes the device aids from the PIO-Service.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const handleDeviceAids = (value: IFormFinishObject): void => {
        const comments: IDeviceAidAdditions[] = value.comments as IDeviceAidAdditions[];
        const deviceTypes: string[] = value.deviceAidType as string[];
        const deviceAidValues: IDeviceAid[] = [];
        deviceTypes?.forEach((deviceAid: string, index: number): void => {
            const deviceAidComment: IDeviceAidAdditions = comments[index.valueOf()];
            if (deviceAidComment.id) {
                deviceAidValues.push({
                    id: deviceAidComment.id,
                    deviceAid: deviceAid,
                    comment: deviceAidComment.value,
                });
                if (deviceAidComment.given) {
                    PIOService.addGivenDevice(deviceAidComment.id, "KBV_PR_MIO_ULB_Device_Aid").then(
                        (result: IResponse): void => {
                            if (!result.success) console.info(result);
                        }
                    );
                } else {
                    PIOService.deleteGivenDevice(deviceAidComment.id, "KBV_PR_MIO_ULB_Device_Aid").then(
                        (result: IResponse): void => {
                            if (!result.success) console.info(result);
                        }
                    );
                }
            }
        });
        onFinishMulti(deviceAidSubTrees, deviceAidValues, saveDeviceAidSubTree, deviceAidPath, setDeviceAidSubTrees);
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        //Handle devices
        handleDevices(value);
        //Handle device aids
        handleDeviceAids(value);
    };

    return (
        <div onBlur={form.submit}>
            <Form
                form={form}
                layout={"vertical"}
                onFinish={onFinish}
                initialValues={{
                    name: [],
                    comments: [],
                }}
                name={"DevicesAidForm"}
            >
                <div className={"extended-form-line"}>
                    <div className={"left"}>
                        <div className={"form-subtitle"}>Allgemeine Hilfsmittel</div>
                    </div>
                </div>
                <div className={"form-line"}>
                    <InputDropDown
                        label={"Hilfsmittel"}
                        name={"deviceAidType"}
                        options={deviceAidOptions}
                        placeholder={"Hilfsmittel wählen"}
                        multiple={true}
                        searchable={true}
                    />
                </div>
                <div>
                    <Form.List name={"comments"}>
                        {(fields: FormListFieldData[]) => (
                            <Space className={"wideFieldSpace"} size={[15, 0]} direction={"horizontal"}>
                                {fields.map(({ key, name }) => (
                                    <div key={key} className={"device-aid"}>
                                        <Form.Item name={[name, "id"]} hidden={true} initialValue={v4()}>
                                            <div style={{ display: "hidden" }} />
                                        </Form.Item>
                                        <InputTextArea
                                            name={[name, "value"]}
                                            label={form.getFieldValue(["comments", name, "label"])}
                                            placeholder={`Kommentar zu ${form.getFieldValue([
                                                "comments",
                                                name,
                                                "label",
                                            ])} hinzufügen`}
                                        />
                                        <div className={"unknown-checkbox"}>
                                            <Form.Item noStyle name={[name, "given"]} valuePropName={"checked"}>
                                                <Checkbox
                                                    defaultChecked={form.getFieldValue(["comments", name, "given"])}
                                                    onChange={(event: CheckboxChangeEvent): void =>
                                                        form.setFieldValue(
                                                            ["comments", name, "given"],
                                                            event.target.checked
                                                        )
                                                    }
                                                />
                                            </Form.Item>
                                            <div className={"unknown-checkbox-label"}>Mitgegeben</div>
                                        </div>
                                    </div>
                                ))}
                            </Space>
                        )}
                    </Form.List>
                </div>
                <div className={"extended-form-line"}>
                    <div className={"left"}>
                        <div className={"form-subtitle"}>Spezifische Geräte</div>
                    </div>
                </div>
                <MultiWrapper<IDeviceObject>
                    componentName={"devices"}
                    addText={"Neues Gerät Hinzufügen"}
                    label={getDeviceLabel}
                    SingleWrapper={DeviceWrapper}
                />
            </Form>
        </div>
    );
};

export default DevicesAidForm;
