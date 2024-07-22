import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
    rootDir: "./",
    verbose: true,
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.json",
            },
        ],
    },
    transformIgnorePatterns: ["/node_modules/(?!(@thaias)/)"],
    moduleNameMapper: {
        ".+\\.(css|styl|less|sass|scss)$": "identity-obj-proxy",
        ".+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
            "<rootDir>/mocks/file-mock.js",
    },
    testPathIgnorePatterns: ["node_modules", "\\.cache"],
    testEnvironmentOptions: { url: "http://localhost" },
    testEnvironment: "jsdom",
    collectCoverage: true,
    coverageReporters: ["text", "json", "html", ["lcov", { projectRoot: "." }], "cobertura"],
    reporters: ["default", "jest-junit"],
    testMatch: ["**/tests/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
    testResultsProcessor: "jest-sonar-reporter",
};

export default config;
