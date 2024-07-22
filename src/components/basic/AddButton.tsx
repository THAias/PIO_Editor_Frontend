import { PlusOutlined } from "@ant-design/icons";
import { Button, Popover } from "antd";
import React, { useState } from "react";

import { IAddButtonProps } from "../../@types/InputTypes";
import "../../styles/basic/addButton.scss";
import RadioButton from "./RadioButton";

/**
 * Custom basic component for a "+" button with popup functionality on click
 * @param {IAddButtonProps} props IAddButtonProps interface
 * @returns {React.ReactElement} React element
 */
const AddButton = (props: IAddButtonProps): React.ReactElement => {
    const [open, setOpen] = useState<boolean>(false);
    // Handler function for selection in the popup
    const handleChange = (value: string): void => {
        setOpen(!open);
        props.onChange(value);
    };

    return (
        <div className={"add-button-wrapper"}>
            {props.options && props.options.length > 0 && (
                <Popover
                    content={
                        <RadioButton
                            options={props.options}
                            onChange={handleChange}
                            vertical={props.vertical}
                            addButton={true}
                        />
                    }
                    overlayStyle={{ minWidth: "200px", zIndex: 2000 }}
                    placement={"topLeft"}
                    trigger={"click"}
                    open={open}
                    onOpenChange={setOpen}
                >
                    <Button className={"input-add-button"} icon={<PlusOutlined />} shape={"circle"} />
                </Popover>
            )}
        </div>
    );
};

export default AddButton;
