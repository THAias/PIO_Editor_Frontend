import { IFullNameObject, IMaidenNameObject, capitalize } from "@thaias/pio_editor_meta";
import { Form, FormInstance } from "antd";
import { NamePath } from "antd/es/form/interface";
import React, { useCallback, useEffect, useState } from "react";

import { INameFormProps, INameOptions } from "../../@types/FormTypes";
import { helperTextNameWrapper } from "../../services/HelperTextService";
import AddButton from "../basic/AddButton";
import InputTextField from "../basic/InputTextField";

/**
 * Custom form component for names (Vorname, Nachname, Geburtsname, Titel, Namenszusatz, Vorsatzwort)
 * @param {INameFormProps} props NameFormProps interface
 * @returns {React.JSX.Element} React element
 */
const NameWrapper = (props: INameFormProps): React.JSX.Element => {
    //State, Options and Form setup
    const form: FormInstance = Form.useFormInstance();
    let fullPath: NamePath;
    if (props.name !== undefined && props.parentName !== undefined)
        fullPath = Array.isArray(props.name) ? [props.parentName, ...props.name] : [props.parentName, props.name];
    else fullPath = Array.isArray(props.name) ? props.name : [props.name];
    const componentPath: NamePath = Array.isArray(props.name) ? props.name : [props.name];
    const item: IFullNameObject = form.getFieldValue(fullPath) as IFullNameObject;
    const [maidenNameVisible, setMaidenNameVisible] = useState<boolean>(
        !!(item?.geburtsname?.familyName !== undefined && props.maidenName)
    );
    const [nameOptions, setNameOptions] = useState<Record<string, INameOptions>>(
        props.maidenName
            ? {
                  vorsatzwort: {
                      label: "vorsatzwort",
                      placeholder: "von, van, zu, ...",
                  },
                  namenszusatz: {
                      label: "namenszusatz",
                      placeholder: "Graf/Gräfin, Prinz, ...",
                  },
                  geburtsname: {
                      label: "geburtsname",
                      placeholder: "Geburtsname",
                  },
              }
            : {
                  vorsatzwort: {
                      label: "vorsatzwort",
                      placeholder: "von, van, zu, ...",
                  },
                  namenszusatz: {
                      label: "namenszusatz",
                      placeholder: "Graf/Gräfin, Prinz, ...",
                  },
              }
    );
    const [maidenNameOptions, setMaidenNameOptions] = useState<Record<string, INameOptions>>({
        vorsatzwort: {
            label: "vorsatzwort",
            placeholder: "von, van, zu, ...",
        },
        namenszusatz: {
            label: "namenszusatz",
            placeholder: "Graf/Gräfin, Prinz, ...",
        },
    });
    const [addedNameOptions, setAddedNameOptions] = useState<Record<string, INameOptions>>({});
    const [addedMaidenNameOptions, setAddedMaidenNameOptions] = useState<Record<string, INameOptions>>({});

    //Hook for adding the name options to the form if they are present in the item
    // eslint-disable-next-line sonarjs/cognitive-complexity
    useEffect((): void => {
        const newAddedNameOptions: Record<string, INameOptions> = {};
        const newAddedMaidenNameOptions: Record<string, INameOptions> = {};
        if (item) {
            Object.entries(item).forEach(([key, value]): void => {
                if (value != null && nameOptions.hasOwnProperty(key)) {
                    newAddedNameOptions[key.toString()] = Object.assign({}, nameOptions[key.toString()]);
                    if (key === "geburtsname" && (value as IMaidenNameObject).familyName !== undefined) {
                        setMaidenNameVisible(true);
                        Object.entries(value as IMaidenNameObject).forEach(([maidenKey, maidenValue]): void => {
                            if (maidenValue != null && maidenKey !== "familyName") {
                                newAddedMaidenNameOptions[maidenKey.toString()] = Object.assign(
                                    {},
                                    maidenNameOptions[maidenKey.toString()]
                                );
                            } else {
                                setMaidenNameVisible(true);
                            }
                        });
                    }
                }
            });
            setAddedNameOptions((prevState: Record<string, INameOptions>) => {
                const newNameOpts: Record<string, INameOptions> = {
                    ...prevState,
                    ...newAddedNameOptions,
                };
                Object.keys(newNameOpts).forEach((key: string): void => {
                    delete nameOptions[key.toString()];
                });
                return newNameOpts;
            });
            setAddedMaidenNameOptions((prevState: Record<string, INameOptions>) => {
                const newMaidenOpts: Record<string, INameOptions> = { ...prevState, ...newAddedMaidenNameOptions };
                Object.keys(newMaidenOpts).forEach((key: string): void => {
                    delete maidenNameOptions[key.toString()];
                });
                return newMaidenOpts;
            });
        }
    }, [item]);

    //Callback hook for adding and removing name options
    const addField = useCallback(
        (label: string, maidenOption: boolean): void => {
            label = label.toLowerCase();
            if (maidenOption && maidenNameOptions[label.toString()]) {
                setAddedMaidenNameOptions({
                    ...addedMaidenNameOptions,
                    [label]: Object.assign({}, maidenNameOptions[label.toString()]),
                });
                delete maidenNameOptions[label.toString()];
            } else if (!maidenOption && nameOptions[label.toString()]) {
                setAddedNameOptions({ ...addedNameOptions, [label]: Object.assign({}, nameOptions[label.toString()]) });
                if (label === "geburtsname") {
                    setMaidenNameVisible(true);
                }
                delete nameOptions[label.toString()];
            }
        },
        [addedMaidenNameOptions, addedNameOptions, maidenNameOptions, nameOptions]
    );

    //Helper function for removing name options
    const removeField = (l: string, maidenOptions: boolean): void => {
        const label: string = l.toLowerCase();

        //Delete field content
        if (maidenOptions) form.setFieldValue([...componentPath, "geburtsname", label], undefined);
        else form.setFieldValue(fullPath.concat(label), undefined);

        if (maidenOptions) {
            setMaidenNameOptions({ ...maidenNameOptions, [label]: addedMaidenNameOptions[label.toString()] });
            delete addedMaidenNameOptions[label.toString()];
            delete item?.geburtsname?.[label as keyof IMaidenNameObject];
        } else {
            setNameOptions({ ...nameOptions, [label]: addedNameOptions[label.toString()] });
            delete addedNameOptions[label.toString()];
            if (label === "geburtsname") {
                form.resetFields(
                    Object.values(addedMaidenNameOptions).map((option: INameOptions) => [
                        ...componentPath,
                        "geburtsname",
                        option.label.toLowerCase(),
                    ])
                );
                setMaidenNameVisible(false);
                form.setFieldValue([...componentPath, "geburtsname"], undefined);
                setMaidenNameOptions({ ...addedMaidenNameOptions, ...maidenNameOptions });
                setAddedMaidenNameOptions({});
            }
        }
        form.submit();
    };

    //Hook for official name options
    useEffect((): void => {
        Object.values(addedNameOptions).forEach((option: INameOptions): void => {
            delete nameOptions[option.label];
        });
    }, [addedNameOptions, nameOptions]);

    //Hook for maiden name options
    useEffect((): void => {
        Object.values(addedMaidenNameOptions).forEach((option: INameOptions): void => {
            delete maidenNameOptions[option.label];
        });
    }, [addedMaidenNameOptions, maidenNameOptions]);

    return (
        <>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputTextField
                        name={[...componentPath, "prefix"]}
                        label={"Akad. Titel"}
                        placeholder={"Dr., Prof., ..."}
                        wide={false}
                        helpText={helperTextNameWrapper.prefix}
                    />
                    {Object.values(addedNameOptions).map(
                        (option: INameOptions) =>
                            option.label !== "geburtsname" && (
                                <InputTextField
                                    name={[...componentPath, option.label.toLowerCase()]}
                                    key={option.label}
                                    label={capitalize(option.label)}
                                    placeholder={option.placeholder}
                                    wide={false}
                                    removable={true}
                                    removeHandler={(label: string) => removeField(label, false)}
                                />
                            )
                    )}
                    {Object.values(nameOptions).length > 0 && (
                        <AddButton
                            onChange={(label: string) => addField(label, false)}
                            type={"titles"}
                            vertical={true}
                            options={Object.values(nameOptions).map((option: INameOptions) => {
                                return { label: capitalize(option.label), value: capitalize(option.label) };
                            })}
                        />
                    )}
                </div>
                <div className={"right"}></div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputTextField
                        name={[...componentPath, "familyName"]}
                        label={"Nachname"}
                        placeholder={"Nachname"}
                        rules={[{ required: true, message: "Bitte geben Sie einen Nachnamen ein." }]}
                        disabled={props.isAuthor}
                    />
                </div>
                <div className={"right"}>
                    <InputTextField
                        name={[...componentPath, "givenName"]}
                        label={"Vorname"}
                        placeholder={"Vorname"}
                        disabled={props.isAuthor}
                    />
                </div>
            </div>
            {maidenNameVisible && (
                <>
                    <div className={"form-line"}>
                        <div className={"left"}>
                            <InputTextField
                                name={[...componentPath, "geburtsname", "familyName"]}
                                label={"Geburtsname"}
                                placeholder={"Geburtsname"}
                                removable={true}
                                removeHandler={(label: string) => removeField(label, false)}
                                rules={[{ required: true, message: "Bitte geben Sie einen Geburtsname an!" }]}
                            />
                            {Object.values(maidenNameOptions).length > 0 && (
                                <AddButton
                                    onChange={(label: string) => addField(label, true)}
                                    type={"titles"}
                                    vertical={true}
                                    options={Object.values(maidenNameOptions).map((option: INameOptions) => {
                                        return { label: capitalize(option.label), value: capitalize(option.label) };
                                    })}
                                />
                            )}
                        </div>
                        <div className={"right"} />
                    </div>
                    <div className={"form-line"}>
                        <div className={"left"}>
                            {Object.values(addedMaidenNameOptions).map((option: INameOptions) => (
                                <InputTextField
                                    name={[...componentPath, "geburtsname", option.label.toLowerCase()]}
                                    key={option.label}
                                    label={capitalize(option.label)}
                                    placeholder={option.placeholder}
                                    wide={false}
                                    removable={true}
                                    removeHandler={(label: string) => removeField(label, true)}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};
export default NameWrapper;
