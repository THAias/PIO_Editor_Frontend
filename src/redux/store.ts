import { configureStore } from "@reduxjs/toolkit";
import { ToolkitStore } from "@reduxjs/toolkit/dist/configureStore";
import { createLogger } from "redux-logger";

import { authenticationReducer } from "./reducers/AuthenticationReducer";
import { contactPersonReducer } from "./reducers/ContactPersonReducer";
import { mockedDataBaseReducer } from "./reducers/MockedDataBaseReducer";
import { navigationReducer } from "./reducers/NavigationReducer";
import { organizationReducer } from "./reducers/OrganizationReducer";
import { patientExtensionReducer } from "./reducers/PatientExtensionReducer";
import { patientStateReducer } from "./reducers/PatientStateReducer";
import { practitionerReducer } from "./reducers/PractitionerReducer";
import { validatorReducer } from "./reducers/ValidatorReducer";

/**
 * The redux store with all the reducers
 */
const reduxStore: ToolkitStore = configureStore({
    reducer: {
        authState: authenticationReducer,
        patientExtensionState: patientExtensionReducer,
        navigationState: navigationReducer,
        contactPersonState: contactPersonReducer,
        practitionerState: practitionerReducer,
        patientState: patientStateReducer,
        organizationState: organizationReducer,
        mockedDataBase: mockedDataBaseReducer,
        validationId: validatorReducer,
    },
    middleware: (getDefaultMiddleware) => {
        if (process.env.NODE_ENV === "development") {
            const logger = createLogger({ collapsed: true, diff: true });
            return getDefaultMiddleware({ serializableCheck: false }).concat(logger);
        } else return getDefaultMiddleware({ serializableCheck: false });
    },
});

export { reduxStore };
