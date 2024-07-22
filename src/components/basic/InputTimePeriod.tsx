import { CaretRightOutlined } from "@ant-design/icons";
import { Form, FormInstance } from "antd";
import { Rule, RuleObject } from "antd/es/form";
import dayjs, { Dayjs } from "dayjs";
import React, { useEffect } from "react";

import { ITimePeriodProps } from "../../@types/InputTypes";
import { getFullPath } from "../../services/HelperService";
import InputDatePicker from "./InputDatePicker";
import Label from "./Label";

/**
 * Custom basic component for a datepicker with additional checkbox
 * @param {ITimePeriodProps} props InputDatePickerProps interface
 * @returns {React.JSX.Element} React element
 */
const InputTimePeriod = (props: ITimePeriodProps): React.JSX.Element => {
    //Form instance and watcher
    const form: FormInstance = Form.useFormInstance();
    const startWatcher = Form.useWatch(getFullPath(props).concat("start"), form);
    const endWatcher = Form.useWatch(getFullPath(props).concat("end"), form);
    const [startDateSet, setStartDateSet] = React.useState<boolean>(false);
    const required: boolean = (props.rules && props.rules.some((rule: Rule) => (rule as RuleObject).required)) ?? false;

    /**
     * Filter helper for limiting end date range based on start date.
     * @param {Dayjs | null} current Current start date
     * @returns {boolean} True if current date is before start date
     */
    const disabledEndDate = (current: Dayjs | null): boolean => {
        if (!startWatcher || !current) {
            return false;
        }
        return current < startWatcher.startOf("day") || (props.future === false && current > dayjs());
    };

    /**
     * Get path for form field like the getFullPath function, but ignoring the parent path.
     * @param {string} lastPath the last path element of the filed (the filed name)
     * @returns {string[] | string} The path for the form field
     */
    const getPath = (lastPath: string): string[] | string => {
        if (props.name !== undefined) {
            if (Array.isArray(props.name)) return props.name.concat(lastPath);
            else return [props.name, lastPath];
        } else {
            return lastPath;
        }
    };

    /**
     * Filter helper for limiting start date range based on end date.
     * @param {Dayjs | null} current Current end date
     * @returns {boolean} True if current date is after end date
     */
    const disabledStartDate = (current: Dayjs | null): boolean => {
        if (!endWatcher || !current) {
            return false;
        }
        return current > endWatcher.startOf("day");
    };

    /** Watcher hook to handle disabling end date based on start date */
    useEffect((): void => {
        if (startWatcher !== undefined && startWatcher !== null) {
            setStartDateSet(true);
            form.setFieldValue(getFullPath(props).concat("end"), endWatcher);
        } else {
            setStartDateSet(false);
            form.setFieldValue(getFullPath(props).concat("end"), undefined);
        }
    }, [startWatcher]);

    return (
        <>
            <Label hugeTopMargin={false} title={props.label} required={required} helperText={props.helperText} />
            <div className={"form-line timePeriod"}>
                <InputDatePicker
                    name={getPath("start")}
                    label={""}
                    wide={false}
                    disabledDate={disabledStartDate}
                    rules={props.rules}
                />
                <CaretRightOutlined />
                <InputDatePicker
                    name={getPath("end")}
                    label={""}
                    wide={false}
                    disabled={!startDateSet}
                    disabledDate={disabledEndDate}
                />
            </div>
        </>
    );
};

export default InputTimePeriod;
