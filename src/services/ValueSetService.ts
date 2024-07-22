import {
    Coding,
    SelectOption,
    SelectOptions,
    ValueSetLookUpTableCoding,
    ValueSetLookUpTableJson,
} from "@thaias/pio_fhir_resources";

/**
 * Represents a class for managing value sets and their look-up tables.
 */
class ValueSets {
    // Private field to store the look-up table coding for value sets.
    private readonly valueSetLookUpTableCoding: ValueSetLookUpTableCoding[];

    /**
     * Constructor for the ValueSets class.
     * @param {string} url URL to load the corresponding value set look-up table.
     * @throws {Error} Throws an error if the look-up table is empty.
     * @class
     */
    constructor(url: string) {
        // Initialize the look-up table based on the provided URL.
        this.valueSetLookUpTableCoding = ValueSetLookUpTableJson[url.toString()];

        // Check if the look-up table is empty and throw an error if so.
        if (!this.valueSetLookUpTableCoding || this.valueSetLookUpTableCoding.length === 0) {
            throw new Error(`ValueSet ${url} not found`);
        }
    }

    /**
     * Synchronously gets the select options from the value set look-up table.
     * @returns {SelectOptions} The select options from the look-up table.
     */
    get getOptionsSync(): SelectOptions {
        return this.valueSetLookUpTableCoding.map((item: ValueSetLookUpTableCoding): SelectOption => {
            // Extract the display value, prioritizing German display, fallback to display, and finally code.
            const display: string = item.germanDisplay ?? item.display ?? item.code ?? "";
            return { value: item.code as string, label: display };
        });
    }

    /**
     * Synchronously gets an object from the value set look-up table based on the provided code.
     * @param {string} code The code to search for in the look-up table.
     * @returns {Coding | undefined} The object from the look-up table, or undefined if no matching code is found.
     */
    getObjectByCodeSync(code: string): Coding | undefined {
        // Find the item in the look-up table that matches the provided code.
        const foundCode: ValueSetLookUpTableCoding | undefined = this.valueSetLookUpTableCoding.find(
            (item: ValueSetLookUpTableCoding): boolean => item.code === code
        );

        // Return undefined if no matching code is found, otherwise, remove the 'germanDisplay' property and return the object.
        return foundCode ? (({ germanDisplay, ...o }: ValueSetLookUpTableCoding) => o)(foundCode) : undefined;
    }
}

export default ValueSets;
