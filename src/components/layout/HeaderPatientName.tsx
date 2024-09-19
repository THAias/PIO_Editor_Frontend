import dayjs from "dayjs";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import { IPatientStateObject, RootState } from "../../@types/ReduxTypes";
import { getNameLabel } from "../../services/HelperService";

/**
 * Component which shows the current Patient name the gender and age on top of the page
 * @returns {React.JSX.Element} React element
 */
const PatientName = (): React.JSX.Element => {
    const patientInfo: IPatientStateObject = useSelector((state: RootState) => state.patientState);
    const [patientHeader, setPatientHeader] = React.useState<string>("");

    /**
     * Helper function to generate the information string
     * @returns {string} the information string
     */
    useEffect((): void => {
        if (!patientInfo.patientName?.familyName) setPatientHeader("");
        const patientName: string = getNameLabel(patientInfo.patientName);
        const patientAge: string = patientInfo.patientBirthDate
            ? dayjs().diff(patientInfo.patientBirthDate, "year").toString()
            : "";
        const patientGender: string = patientInfo.patientGender ?? "";
        const patientExtendInfo: string[] = [];
        if (patientAge) patientExtendInfo.push(patientAge);
        if (patientGender) patientExtendInfo.push(patientGender);
        const additionalInfo: string = patientExtendInfo.length > 0 ? ` (${patientExtendInfo.join(", ")})` : "";
        setPatientHeader(`${patientName}${additionalInfo}`);
    }, [patientInfo]);

    return (
        <div className={"pio-editor-header"} id={"patient-name"}>
            <div className={"patient-name"}>
                <div className={"patient-name-content"}>{patientHeader}</div>
            </div>
        </div>
    );
};

export default PatientName;
