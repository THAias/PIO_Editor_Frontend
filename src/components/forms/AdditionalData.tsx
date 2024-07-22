import { TranslationListOfExcludedPaths } from "@thaias/pio_fhir_resources";
import React from "react";

import { INonFormProps } from "../../@types/FormTypes";

/**
 * This form contains information from an existing PIO that is not included in the PIO small specification.
 * @param {INonFormProps} props props object holding the resource
 * @returns {React.JSX.Element} React element
 */
const AdditionalData = (props: INonFormProps): React.JSX.Element => {
    const bracketsRegEx: RegExp = /\[(\d+)]/g;
    return (
        <div>
            <div>
                {props.resource &&
                    Object.entries(props.resource).map(
                        ([key, value]: [string, unknown]): React.JSX.Element => (
                            <div key={key} className={"unstructured-data-column"}>
                                <div className={"unstructured-data-subheader"}>ID: {key}</div>
                                {value !== undefined &&
                                    Object.entries(value as object).map(([subKey, subValue]) => {
                                        const resource: string = subKey.split(".")?.[0];
                                        const match: RegExpMatchArray | null = subKey.match(bracketsRegEx);
                                        const translation: string | null | undefined =
                                            TranslationListOfExcludedPaths[resource.toString()]?.excludedPaths?.[
                                                subKey.toString().replace(bracketsRegEx, "")
                                            ];
                                        return (
                                            <div key={subKey}>
                                                <div className={"unstructured-data-line"}>
                                                    {translation ? (
                                                        <div className={"unstructured-data left"}>
                                                            {match ? `Eintrag: ${match[0]}${match[1] ?? ""} ` : ""}
                                                            {translation}
                                                        </div>
                                                    ) : (
                                                        <div className={"unstructured-data no-translation left"}>
                                                            {match ? `Eintrag: ${match[0]}${match[1] ?? ""} ` : ""}
                                                            {`${subKey.toString().replace(bracketsRegEx, "")}`}
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`unstructured-data right ${
                                                            !translation ? "no-translation" : ""
                                                        }`}
                                                    >
                                                        {subValue as string}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )
                    )}
            </div>
        </div>
    );
};

export default AdditionalData;
