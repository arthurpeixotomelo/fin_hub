import type {
    BusinessValidationConfig,
    FinancialData,
    ValidationResult,
} from "./types.ts";

export const defaultBusinessConfig: BusinessValidationConfig = {
    maxMonthlyVariation: 5,
    allowDuplicateCodSeg: false,
    minimumNonZeroMonths: 1,
};

export const validateMonthlyVariation = (
    data: FinancialData[],
    monthColumns: string[],
    config: BusinessValidationConfig = defaultBusinessConfig,
): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    data.forEach((row, index) => {
        const rowNum = index + 2;

        const monthValues = monthColumns
            .map((month) => row[month])
            .filter((val) =>
                typeof val === "number" && !isNaN(val)
            ) as number[];

        if (monthValues.length > 1) {
            const maxValue = Math.max(...monthValues);
            const minValue = Math.min(...monthValues);
            const avgValue = monthValues.reduce((sum, val) => sum + val, 0) /
                monthValues.length;

            if (avgValue !== 0) {
                const maxVariation = Math.abs((maxValue - minValue) / avgValue);
                if (maxVariation > config.maxMonthlyVariation) {
                    warnings.push(
                        `Linha ${rowNum}: Variação extrema detectada entre os meses (${
                            (maxVariation * 100).toFixed(1)
                        }%)`,
                    );
                }
            }

            for (let i = 1; i < monthValues.length; i++) {
                const prevValue = monthValues[i - 1];
                const currentValue = monthValues[i];

                if (prevValue !== 0) {
                    const changePercent = Math.abs(
                        (currentValue - prevValue) / prevValue,
                    );
                    if (changePercent > config.maxMonthlyVariation) {
                        warnings.push(
                            `Linha ${rowNum}: Variação abrupta detectada entre meses consecutivos (${
                                (changePercent * 100).toFixed(1)
                            }%)`,
                        );
                    }
                }
            }
        }

        const nonZeroMonths = monthValues.filter((val) => val !== 0).length;
        if (nonZeroMonths < config.minimumNonZeroMonths) {
            warnings.push(
                `Linha ${rowNum}: Poucos meses com valores não-zero (${nonZeroMonths})`,
            );
        }
    });

    return { isValid: errors.length === 0, errors, warnings };
};

export const validateUniqueness = (
    data: FinancialData[],
    config: BusinessValidationConfig = defaultBusinessConfig,
): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.allowDuplicateCodSeg) {
        const combinations = new Map<string, number>();

        data.forEach((row, index) => {
            const combo = `${row.cod}-${row.seg}`;
            const existingRow = combinations.get(combo);

            if (existingRow !== undefined) {
                errors.push(
                    `Linha ${
                        index + 2
                    }: Combinação cod+seg duplicada: ${combo} (primeira ocorrência na linha ${
                        existingRow + 2
                    })`,
                );
            } else {
                combinations.set(combo, index);
            }
        });
    }

    return { isValid: errors.length === 0, errors, warnings };
};

// export const validateCrossSheet = (
//     allSheetsData: Map<string, FinancialData[]>
// ): ValidationResult => {
//     const errors: string[] = [];
//     const warnings: string[] = [];

//     const sheets = Array.from(allSheetsData.keys());
//     if (sheets.length > 1) {
//         const firstSheetCombos = new Set(
//             allSheetsData.get(sheets[0])?.map((row) =>
//                 `${row.cod}-${row.seg}`
//             ) || [],
//         );

//         sheets.slice(1).forEach((sheetName) => {
//             const sheetData = allSheetsData.get(sheetName) || [];
//             const sheetCombos = new Set(
//                 sheetData.map((row) => `${row.cod}-${row.seg}`),
//             );

//             firstSheetCombos.forEach((combo) => {
//                 if (!sheetCombos.has(combo)) {
//                     warnings.push(
//                         `Combinação ${combo} presente em ${
//                             sheets[0]
//                         } mas ausente em ${sheetName}`,
//                     );
//                 }
//             });

//             sheetCombos.forEach((combo) => {
//                 if (!firstSheetCombos.has(combo)) {
//                     warnings.push(
//                         `Combinação ${combo} presente em ${sheetName} mas ausente em ${
//                             sheets[0]
//                         }`,
//                     );
//                 }
//             });
//         });
//     }

//     return { isValid: errors.length === 0, errors, warnings };
// };

export const validateBusinessRules = (
    data: FinancialData[],
    monthColumns: string[],
    config: BusinessValidationConfig = defaultBusinessConfig,
): ValidationResult => {
    const variationResult = validateMonthlyVariation(
        data,
        monthColumns,
        config,
    );
    const uniquenessResult = validateUniqueness(data, config);

    return {
        isValid: variationResult.isValid && uniquenessResult.isValid,
        errors: [...variationResult.errors, ...uniquenessResult.errors],
        warnings: [...variationResult.warnings, ...uniquenessResult.warnings],
    };
};
