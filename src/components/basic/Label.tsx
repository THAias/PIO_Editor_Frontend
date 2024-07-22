import { QuestionCircleFilled } from "@ant-design/icons";
import { Tooltip } from "antd";
import React from "react";

import { IFormLabelProps } from "../../@types/FormTypes";
import "../../styles/basic/label.scss";

/**
 * Custom basic component for a label
 * @param {IFormLabelProps} props IFormLabelProps interface
 * @returns {React.JSX.Element} React element
 */
const Label = (props: IFormLabelProps): React.JSX.Element => {
    const hugeMarginTop: boolean = props.hugeTopMargin ?? false;
    const smallMarginBottom: boolean = props.smallBottomMargin ?? false;
    return (
        <div className={"custom-label ant-form-item-label"}>
            <label
                className={`custom-label-item ${props.required && "required"} ${hugeMarginTop && "huge-margin-top"} ${
                    smallMarginBottom && "small-margin-bottom"
                }`}
                title={props.title}
            >
                {props.title}
                {props.helperText && (
                    <Tooltip title={props.helperText}>
                        <span role={"img"} aria-label={"question-circle"} className={"helper-text"}>
                            <QuestionCircleFilled />
                        </span>
                    </Tooltip>
                )}
            </label>
        </div>
    );
};

export default Label;
