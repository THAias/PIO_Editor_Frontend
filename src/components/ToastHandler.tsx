import { CheckCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import React, { MutableRefObject } from "react";
import { Id, ToastItem, ToastOptions, TypeOptions, toast } from "react-toastify";

import { reduxStore } from "../redux/store";
import "../styles/toast.scss";

/**
 * ToastHandler class to handle all the toast messages
 * @class
 */
class ToastHandler {
    /**
     * Standard Toast configuration
     * @private
     * @static
     * @type {ToastOptions}
     */
    private static standardToastConfig: ToastOptions = {
        position: "top-center",
        autoClose: 5000,
        closeOnClick: true,
        hideProgressBar: false,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
    };

    /**
     * Get the validation div for the validation toast with a retry button
     * @param {string} message the message to display
     * @returns {React.JSX.Element} React element
     * @private
     * @static
     */
    private static getValidationDiv(message: string): React.JSX.Element {
        const state = reduxStore.getState();
        const exportState = state.navigationState.exportPio;
        return (
            <div className={"validation-toast-content"}>
                <div className={"validation-toast-text"}>{message}</div>
                <div className={"validation-toast-button"}>
                    <Button
                        icon={<CheckCircleOutlined />}
                        onClick={() => document.getElementById(`pio-export-button-${exportState}`)?.click()}
                    >
                        Behoben & Weiter
                    </Button>
                </div>
            </div>
        );
    }

    /**
     * Display a validation error toast
     * @param {string} message the message to display
     * @returns {Id} the id of the toast
     * @static
     */
    static validationError(message: string): Id {
        return toast.error(this.getValidationDiv(message), {
            ...this.standardToastConfig,
            closeOnClick: false,
            autoClose: false,
            toastId: "validation-message",
        });
    }

    /**
     * Update the validation error toast
     * @param {MutableRefObject<Id | undefined>} id the id of the toast
     * @param {string} message the message to display
     * @static
     */
    static updateValidationError(id: MutableRefObject<Id | undefined>, message: string): void {
        if (id.current === undefined) {
            this.error(message);
        } else {
            toast.update(id.current, { render: () => this.getValidationDiv(message) });
            toast.onChange((payload: ToastItem): void => {
                if (payload.status === "removed") {
                    id.current = undefined;
                }
            });
        }
    }

    /**
     * Update a validation toast to success
     * @param {MutableRefObject<Id | undefined>} id the id of the toast
     * @param {string} message the message to display
     * @static
     */
    static updateValidationSuccess(id: MutableRefObject<Id | undefined>, message: string): void {
        if (id.current === undefined) {
            this.success(message);
        } else {
            toast.update(id.current, {
                render: () => message,
                ...this.standardToastConfig,
                type: "success",
            });
            id.current = undefined;
        }
    }

    /**
     * Display a success toast
     * @param {string} message the message to display
     * @returns {Id} the id of the toast
     * @static
     */
    static error(message: string): Id {
        return toast.error(message, {
            ...this.standardToastConfig,
            toastId: message,
        });
    }

    /**
     * Dismiss all toasts
     * @static
     */
    static dismissAll(): void {
        toast.dismiss();
    }

    /**
     * Dismiss a toast by id
     * @param {Id} id the id of the toast
     * @static
     */
    static dismiss(id: Id): void {
        toast.dismiss(id);
    }

    /**
     * Display a success toast
     * @param {string} message the message to display
     * @returns {Id} the id of the toast
     * @static
     */
    static success(message: string): Id {
        return toast.success(message, {
            ...this.standardToastConfig,
            toastId: message,
        });
    }

    /**
     * Display an info toast
     * @param {string} message the message to display
     * @returns {Id} the id of the toast
     * @static
     */
    static info(message: string): Id {
        return toast.info(message, {
            ...this.standardToastConfig,
            toastId: message,
        });
    }

    /**
     * Display a warning toast
     * @param {string} message the message to display
     * @returns {Id} the id of the toast
     * @static
     */
    static warning(message: string): Id {
        return toast.warning(message, {
            ...this.standardToastConfig,
            toastId: message,
        });
    }

    /**
     * Display Toast with type
     * @param {TypeOptions} type the type of the toast
     * @param {string} message the message to display
     * @returns {Id} the id of the toast
     * @static
     */
    static open(type: TypeOptions, message: string): Id {
        return toast(message, {
            ...this.standardToastConfig,
            type: type,
            toastId: message,
        });
    }
}

export default ToastHandler;
