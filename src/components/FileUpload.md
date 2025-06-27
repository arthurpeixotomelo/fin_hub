# FileUpload Component

## Overview

The FileUpload component is a comprehensive React component designed for uploading, validating, and processing Excel (.xlsx) files containing financial data. It's specifically built for the Financial Planning Hub to handle monthly financial data uploads.

## Features

### File Validation

* **File Type Validation**: Only accepts `.xlsx` files
* **Structure Validation**: Validates required columns (cod, seg, file, Jan/25-Dec/25)
* **Data Type Validation**: Ensures proper data types (int, string, string, float...)
* **Business Logic Validation**: Checks for extreme variations between months, duplicate combinations

### Data Processing

* **Pivot Data**: Maintains original structure for visualization
* **Unpivot Data**: Transforms data for database storage
* **Progress Tracking**: Real-time progress updates during processing
* **Error Reporting**: Detailed error messages and warnings

### User Experience

* **Drag & Drop Ready**: Styled for intuitive file selection
* **Progress Indicators**: Visual progress bar with status messages
* **Data Preview**: Shows first 5 rows of processed data
* **Responsive Design**: Mobile-friendly interface

## Expected File Format

The component expects Excel files with the following structure:

| cod (int) | seg (string) | file (string) | Jan/25 (float) | Feb/25 (float) | ... | Dec/25 (float) |
|-----------|-------------|---------------|----------------|----------------|-----|----------------|
| 100       | "Segment A" | "File1"       | 1000.50        | 1200.75        | ... | 1500.25        |
| 101       | "Segment B" | "File2"       | 2000.00        | 2100.00        | ... | 2200.00        |

### Column Requirements

* **cod**: Integer identifier (must be unique when combined with seg)
* **seg**: String segment identifier
* **file**: String file identifier
* **Jan/25 - Dec/25**: Float values representing monthly financial data in Brazilian format

## Validation Rules

### Structure Validation

* All required columns must be present
* Extra columns trigger warnings but don't block processing

### Data Validation

* `cod`: Must be integer
* `seg`: Must be non-empty string
* `file`: Must be non-empty string
* Month columns: Must be numeric values
* Combination of `cod + seg` must be unique

### Business Validation

* Extreme month-to-month variations (>500%) trigger warnings
* Values are formatted using Brazilian locale (pt-BR)

## Usage

```tsx
import FileUpload from '../components/FileUpload'

// In Astro page
<FileUpload client:load />
```

## Component States

1. **idle**: Initial state, waiting for file selection
2. **processing**: File is being read and validated
3. **validated**: File passed validation, ready for submission
4. **error**: Validation failed, showing error messages
5. **ready**: Data submitted successfully

## Data Output

The component produces two data formats:

### Pivot Format (for visualization)

Maintains original Excel structure with all months as columns.

### Unpivot Format (for database)

Transforms data into individual month records:

```typescript
{
  cod: number,
  seg: string,
  file: string,
  month: string, // "Jan/25", "Feb/25", etc.
  value: number
}
```

## Styling

The component uses CSS Modules with the following files:

* `FileUpload.module.css`: Component-specific styles
* Responsive design with mobile breakpoints
* Professional color scheme with hover effects

## Integration Notes

* Built for Astro + React + TypeScript environment
* Uses SheetJS (xlsx) library for Excel file processing
* Follows project coding standards (camelCase, no semicolons, single quotes)
* Ready for API integration (see TODO comments in submit handler)

## Future Enhancements

* \[ ] API integration for data submission
* \[ ] Advanced business rule configuration
* \[ ] Template file download
* \[ ] Batch file processing
* \[ ] Export validation reports
