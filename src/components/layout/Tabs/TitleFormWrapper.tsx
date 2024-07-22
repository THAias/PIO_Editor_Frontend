import { FormInstance } from "antd";
import React, { JSX } from "react";

import { IFormProps, INonFormProps } from "../../../@types/FormTypes";

interface ITitleWrapperProps {
    component: React.FC<IFormProps>[] | React.FC<INonFormProps>[];
    title: JSX.Element;
    form?: FormInstance[][];
    props: { [key: string]: unknown } | undefined;
}

const TitleFormWrapper = (props: ITitleWrapperProps): JSX.Element => {
    // Throw error if the length of the component array is not equal to the length of the form array
    if (props.form && props.component.length !== props.form.length) {
        throw new Error("The length of the component array is not equal to the length of the form array");
    }
    return (
        <>
            {props.title}
            {props.component.map(
                (Component: React.FC<IFormProps> | React.FC<INonFormProps>, index: number): JSX.Element => {
                    if (props.form) {
                        const CastedComponent = Component as React.FC<IFormProps>;
                        return (
                            <CastedComponent
                                key={Component.displayName || Component.name || "defaultKey"}
                                form={props.form[index.valueOf()][0]}
                                {...props.props}
                            />
                        );
                    } else {
                        const CastedComponent = Component as React.FC<INonFormProps>;
                        return (
                            <CastedComponent
                                key={Component.displayName || Component.name || "defaultKey"}
                                {...props.props}
                            />
                        );
                    }
                }
            )}
        </>
    );
};

export default TitleFormWrapper;
