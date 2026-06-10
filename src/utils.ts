/**
 * Helper to render an SVG data URL or source string into a high-quality Canvas
 * and get the result as a standard image/png base64 string.
 */
export function svgToPngBase64(svgUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        // Use high-resolution dimensions for clear text OCR
        canvas.width = 1200;
        canvas.height = (img.height * 1200) / img.width || 1200;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not create 2D canvas context"));
          return;
        }

        // Fill background white
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to png base64 without metadata headers
        const dataUrl = canvas.toDataURL("image/png");
        const base64 = dataUrl.split(";base64,").pop() || "";
        resolve(base64);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => reject(new Error("Failed to load SVG into Image object: " + e));
    img.src = svgUrl;
  });
}

/**
 * Robust JSON structure to CSV converter.
 * It identifies table arrays (like Invoice Line_Items or Receipt Items) and represents them
 * in standard spreadsheet format along with General Metadata rows.
 */
export function convertJsonToCsv(data: Record<string, any>): string {
  let tableKey = "";
  let tableData: any[] = [];

  // Search for nested line item collections
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key]) && data[key].length > 0 && typeof data[key][0] === "object") {
      tableKey = key;
      tableData = data[key];
      break;
    }
  }

  const csvLines: string[] = [];

  // 1. Write the general key-value headers
  csvLines.push(`"DOCUMENT EXTRACTION SUMMARY"`);
  for (const key of Object.keys(data)) {
    if (key !== tableKey && !Array.isArray(data[key]) && typeof data[key] !== "object") {
      const cleanVal = String(data[key] ?? "").replace(/"/g, '""');
      csvLines.push(`"${key}","${cleanVal}"`);
    }
  }

  csvLines.push(""); // Row separator

  // 2. Write nested tabular collection if present
  if (tableData.length > 0) {
    csvLines.push(`"TABULAR ITEMIZATION: ${tableKey.toUpperCase()}"`);
    const headers = Object.keys(tableData[0]);
    csvLines.push(headers.map(h => `"${h}"`).join(","));

    for (const row of tableData) {
      const rowString = headers.map(h => {
        const cellValue = row[h] !== undefined ? String(row[h] ?? "") : "";
        return `"${cellValue.replace(/"/g, '""')}"`;
      }).join(",");
      csvLines.push(rowString);
    }
  } else {
    // Fallback: If no collection, output full key value as keys/cols
    csvLines.push(`"Field Name","Extracted Value"`);
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        const cleanArr = data[key].map((item: any) => 
          typeof item === "object" ? JSON.stringify(item) : String(item)
        ).join("; ");
        csvLines.push(`"${key}","${cleanArr.replace(/"/g, '""')}"`);
      } else if (typeof data[key] === "object" && data[key] !== null) {
        csvLines.push(`"${key}","${JSON.stringify(data[key]).replace(/"/g, '""')}"`);
      } else {
        const cleanVal = String(data[key] ?? "").replace(/"/g, '""');
        csvLines.push(`"${key}","${cleanVal}"`);
      }
    }
  }

  return csvLines.join("\n");
}
