import { z } from "astro:schema";

export function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function dateToMonthYear(date: Date): string {
    const dateFormat = Intl.DateTimeFormat("pt-BR", {
        month: "short",
        year: "2-digit",
    });
    return capitalizeFirstLetter(dateFormat.format(date));
}

export function generateMonthNamesMap(): Record<string, number> {
    const locales = ["pt-BR", "en-US"];
    const formats = [
        { month: "long" as const },
        { month: "short" as const },
    ];

    const monthMap: Record<string, number> = {};

    for (const locale of locales) {
        for (const format of formats) {
            for (let month = 0; month < 12; month++) {
                const date = new Date(2023, month, 1);
                const formatter = new Intl.DateTimeFormat(locale, format);
                const monthName = formatter.format(date).toLowerCase();
                monthMap[monthName] = month;
                const withoutAccents = monthName
                    .normalize("NFKD")
                    .replace(/[\u0300-\u036f]/g, "");
                if (withoutAccents !== monthName) {
                    monthMap[withoutAccents] = month;
                }
            }
        }
    }
    return { ...monthMap };
}

const MONTH_NAMES_MAP = generateMonthNamesMap();

export function standardMonthYearFormat(): z.ZodType<string> {
    return z.string().refine(
        (value) => {
            const monthAbbr = Object.keys(MONTH_NAMES_MAP)
                .filter((m) => m.length === 3)
                .map((m) => capitalizeFirstLetter(m))
                .filter((v, i, a) => a.indexOf(v) === i);

            const firstThreeChars = value.substring(0, 3);
            const hasValidPrefix = monthAbbr.some((abbr) =>
                abbr.toLowerCase() === firstThreeChars.toLowerCase()
            );
            const hasValidFormat = value.length === 6 &&
                value.charAt(3) === "/" &&
                /^\d{2}$/.test(value.substring(4, 6));
            return hasValidPrefix && hasValidFormat;
        },
        {
            message:
                "Invalid month/year format. Expected format: 'Mmm/YY' (e.g., 'Jan/23')",
        },
    );
}

export function normalizeMonthColumn(column: string): string | null {
    const result = standardMonthYearFormat().safeParse(column);
    if (result.success) {
        return column;
    }
    const date = parseDate(column);
    if (date && !isNaN(date.getTime())) {
        return dateToMonthYear(date);
    }
    return null;
}

export function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const cleanStr = dateStr.trim();
    try {
        const date = new Date(cleanStr);
        if (!isNaN(date.getTime())) {
            return date;
        }
    } catch {
        // Ignore parsing errors
    }

    const monthYearSchema = z.object({
        match: z.tuple([
            z.string(),
            z.string(), 
            z.string(),
        ]),
    }).transform((data) => {
        const [, month, year] = data.match;
        return new Date(`${year}-${month.padStart(2, "0")}-01`);
    });
    
    const monthYearMatch = cleanStr.match(/^(\d{1,2})[-/](\d{4})$/);
    if (monthYearMatch) {
        const result = monthYearSchema.safeParse({ match: monthYearMatch });
        if (result.success && !isNaN(result.data.getTime())) {
            return result.data;
        }
    }

    const yearMonthMatch = cleanStr.match(/^(\d{4})[-/](\d{1,2})$/);
    if (yearMonthMatch) {
        const rearranged = [
            yearMonthMatch[0],
            yearMonthMatch[2],
            yearMonthMatch[1],
        ];
        const result = monthYearSchema.safeParse({ match: rearranged });
        if (result.success && !isNaN(result.data.getTime())) {
            return result.data;
        }
    }

    const monthYearTextMatch = cleanStr.match(
        /([a-zA-Z]+)[_\s-]?(\d{4}|\d{2})$/i,
    );
    if (monthYearTextMatch) {
        const [, monthText, yearText] = monthYearTextMatch;
        const monthLower = monthText.toLowerCase();

        if (monthLower in MONTH_NAMES_MAP) {
            const monthIndex = MONTH_NAMES_MAP[monthLower];
            const year = yearText.length === 2 ? `20${yearText}` : yearText;

            try {
                const date = new Date(parseInt(year), monthIndex, 1);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            } catch {
                // Ignore parsing errors
            }
        }
    }

    return null;
}

export function detectMonthColumns(row: Record<string, unknown>): string[] {
    return Object.keys(row)
        .map(normalizeMonthColumn)
        .filter((col): col is string => col !== null);
}