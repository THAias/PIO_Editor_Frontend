import { Coding, SelectOptions } from "@thaias/pio_fhir_resources";

import ValueSets from "../src/services/ValueSetService";

// Example test cases for the ValueSets class.
describe("ValueSets", (): void => {
    it("should throw an error for an empty value set", (): void => {
        expect(() => new ValueSets("emptyValueSet")).toThrow("ValueSet emptyValueSet not found");
    });

    it("should retrieve select options from the value set look-up table", (): void => {
        const valueSets: ValueSets = new ValueSets(
            "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Information_Legal_Guardian"
        );
        const options: SelectOptions = valueSets.getOptionsSync;
        expect(options).toEqual([
            {
                value: "243796009:{408732007=58626002}{246090004=(404684003:47429007=419891008)}{246090004=(310385006:363713009=2667000)}",
                label: "Gesetzliche Betreuung liegt nicht vor",
            },
            {
                value: "243796009:{408732007=58626002}{246090004=(404684003:47429007=419891008)}{246090004=(310385006:363713009=52101004)}",
                label: "Gesetzliche Betreuung liegt vor",
            },
            {
                value: "243796009:{408732007=58626002}{246090004=(404684003:47429007=419891008)}{246090004=(310385006:363713009=373068000)}",
                label: "Vorliegen von gesetzlicher Betreuung unbekannt",
            },
        ]);
    });

    it("should retrieve an object by code from the value set look-up table", (): void => {
        const valueSets: ValueSets = new ValueSets(
            "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Information_Legal_Guardian"
        );
        const object: Coding | undefined = valueSets.getObjectByCodeSync(
            "243796009:{408732007=58626002}{246090004=(404684003:47429007=419891008)}{246090004=(310385006:363713009=373068000)}"
        );
        expect(object).toEqual({
            code: "243796009:{408732007=58626002}{246090004=(404684003:47429007=419891008)}{246090004=(310385006:363713009=373068000)}",
            display:
                "Situation with explicit context (situation) : { Subject relationship context (attribute) = Legal guardian (person) } { Associated finding (attribute) = ( Clinical finding (finding) : Associated with (attribute) = Record artifact (record artifact) ) } { Associated finding (attribute) = ( Information status (finding) : Has interpretation (attribute) = Undetermined (qualifier value) ) }",
            system: "http://snomed.info/sct",
            version: "http://snomed.info/sct/900000000000207008/version/20220331",
        });
    });

    it("should return undefined for an invalid code when retrieving an object", (): void => {
        const valueSets: ValueSets = new ValueSets(
            "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Information_Legal_Guardian"
        );
        const object: Coding | undefined = valueSets.getObjectByCodeSync("invalidCode");
        expect(object).toBeUndefined();
    });
});
