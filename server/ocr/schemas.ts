import { Type } from "@google/genai";
import type { CustomSchemaField, GeminiSchema } from "./types";

export const PRESET_SCHEMAS: Record<string, GeminiSchema> = {
  invoice: {
    type: Type.OBJECT,
    properties: {
      Invoice_Number: { type: Type.STRING, description: "The identifier or number string of the invoice." },
      Issue_Date: { type: Type.STRING, description: "The date of issuing the invoice." },
      Due_Date: { type: Type.STRING, description: "The payment deadline date." },
      Vendor_Name: { type: Type.STRING, description: "Name of selling company or service provider." },
      Vendor_Address: { type: Type.STRING, description: "Full physical address of the supplier." },
      Billing_To: { type: Type.STRING, description: "Recipient client or company name/address." },
      Line_Items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            Description: { type: Type.STRING, description: "Itemization description." },
            Quantity: { type: Type.NUMBER, description: "Item quantity buy count." },
            Unit_Price: { type: Type.NUMBER, description: "Per-unit cost number." },
            Total: { type: Type.NUMBER, description: "Calculated item total quantity multiplied by unit price." },
          },
          required: ["Description", "Total"],
        },
        description: "List of goods or services itemized in the invoice.",
      },
      Subtotal: { type: Type.NUMBER, description: "Invoice base total before taxes and fees." },
      Tax_Amount: { type: Type.NUMBER, description: "Invoice tax fees added." },
      Total_Due: { type: Type.NUMBER, description: "Grand total sum value of payment due." },
      Currency: { type: Type.STRING, description: "Base currency identifier (e.g. USD, EUR, Rs.)." },
    },
    required: ["Vendor_Name", "Total_Due"],
  },
  receipt: {
    type: Type.OBJECT,
    properties: {
      Merchant_Name: { type: Type.STRING, description: "Stated name of retail store or seller." },
      Merchant_Address: { type: Type.STRING, description: "Retail outlet store location." },
      Transaction_Date: { type: Type.STRING, description: "Calendar date of purchase." },
      Transaction_Time: { type: Type.STRING, description: "Time of day of the purchase." },
      Items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            Item_Name: { type: Type.STRING, description: "Line name or item bought." },
            Price: { type: Type.NUMBER, description: "Individual unit price." },
            Quantity: { type: Type.NUMBER, description: "Count of item bought." },
          },
          required: ["Item_Name", "Price"],
        },
        description: "Items on the receipt list.",
      },
      Tax_Amount: { type: Type.NUMBER, description: "Tax charged on sales." },
      Tip_Amount: { type: Type.NUMBER, description: "Tips/gratuities added if stated." },
      Total_Amount: { type: Type.NUMBER, description: "Literal final paid receipt sum." },
      Payment_Method: { type: Type.STRING, description: "Method of payment (e.g. Credit Card, Cash, Apple Pay)." },
    },
    required: ["Merchant_Name", "Total_Amount"],
  },
  business_card: {
    type: Type.OBJECT,
    properties: {
      Full_Name: { type: Type.STRING, description: "Full name of the individual." },
      Job_Title: { type: Type.STRING, description: "Professional role or department." },
      Company_Name: { type: Type.STRING, description: "Employer or enterprise company name." },
      Email_Address: { type: Type.STRING, description: "Core contact email." },
      Phone_Number: { type: Type.STRING, description: "Primary phone call number." },
      Website_URL: { type: Type.STRING, description: "Official corporate website url link." },
      Office_Address: { type: Type.STRING, description: "Stated office building and location." },
    },
    required: ["Full_Name"],
  },
  id_card: {
    type: Type.OBJECT,
    properties: {
      Document_Type: { type: Type.STRING, description: "Ex: Driver's License, National ID, Passport." },
      Document_Number: { type: Type.STRING, description: "Official license/passport number string." },
      Full_Name: { type: Type.STRING, description: "Person's printed name details." },
      Date_of_Birth: { type: Type.STRING, description: "Date of birth of holder." },
      Gender: { type: Type.STRING, description: "Stated physical sex or gender identifier." },
      Nationality: { type: Type.STRING, description: "Country or national region." },
      Issue_Date: { type: Type.STRING, description: "Handout issue date." },
      Expiry_Date: { type: Type.STRING, description: "Valid limit calendar date." },
      Address: { type: Type.STRING, description: "Holder registered living address." },
    },
    required: ["Full_Name", "Document_Number"],
  },
};

const DEFAULT_TARGET_SCHEMA: GeminiSchema = {
  type: Type.OBJECT,
  properties: {
    Document_Title: { type: Type.STRING, description: "Deduced title or header of the document" },
    Summary: { type: Type.STRING, description: "A high level description/summary of this document." },
    Key_Data_Points: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Any other critical key-value pairings found.",
    },
  },
  required: ["Document_Title"],
};

export function cleanBase64Payload(fileBase64: string): string {
  let clean = fileBase64;
  if (clean.includes(";base64,")) {
    clean = clean.split(";base64,").pop() || "";
  }
  return clean;
}

export function buildTargetSchema(
  schemaPreset?: string,
  customSchema?: CustomSchemaField[] | null
): GeminiSchema {
  if (schemaPreset && PRESET_SCHEMAS[schemaPreset]) {
    return PRESET_SCHEMAS[schemaPreset];
  }

  if (schemaPreset === "custom" && Array.isArray(customSchema)) {
    const properties: Record<string, GeminiSchema & { description?: string }> = {};
    const requiredList: string[] = [];

    for (const field of customSchema) {
      const key = (field.key || "").trim().replace(/\s+/g, "_");
      if (!key) continue;

      let typeValue: GeminiSchema["type"] = Type.STRING;
      let itemsSchema: GeminiSchema | undefined;

      if (field.type === "number") {
        typeValue = Type.NUMBER;
      } else if (field.type === "boolean") {
        typeValue = Type.BOOLEAN;
      } else if (field.type === "array") {
        typeValue = Type.ARRAY;
        itemsSchema = { type: Type.STRING };
      }

      properties[key] = {
        type: typeValue,
        ...(itemsSchema && { items: itemsSchema }),
        description: field.description || `Extracted value for ${field.key}`,
      };
      requiredList.push(key);
    }

    return {
      type: Type.OBJECT,
      properties,
      required: requiredList.length > 0 ? requiredList : undefined,
    };
  }

  return DEFAULT_TARGET_SCHEMA;
}

export function buildRootSchema(targetSchema: GeminiSchema): GeminiSchema {
  return {
    type: Type.OBJECT,
    properties: {
      thinkingSteps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "List the cognitive steps followed by the OCR agent to detect layout, extract raw texts, parse details, and format the output structure accurately.",
      },
      rawOcrText: {
        type: Type.STRING,
        description:
          "Raw literal transcript of all read words, blocks, and titles found in the document, laid out neatly.",
      },
      structuredData: targetSchema,
    },
    required: ["thinkingSteps", "rawOcrText", "structuredData"],
  };
}

function geminiTypeToJsonType(type: GeminiSchema["type"]): string {
  if (type === Type.NUMBER) return "number";
  if (type === Type.BOOLEAN) return "boolean";
  if (type === Type.ARRAY) return "array";
  if (type === Type.OBJECT) return "object";
  return "string";
}

export function geminiSchemaToJsonDescription(schema: GeminiSchema): object {
  const jsonType = geminiTypeToJsonType(schema.type);

  if (jsonType === "object" && schema.properties) {
    const properties: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      properties[key] = geminiSchemaToJsonDescription(value);
    }
    return {
      type: "object",
      ...(schema.required && { required: schema.required }),
      properties,
    };
  }

  if (jsonType === "array" && schema.items) {
    return {
      type: "array",
      items: geminiSchemaToJsonDescription(schema.items),
      ...(schema.description && { description: schema.description }),
    };
  }

  return {
    type: jsonType,
    ...(schema.description && { description: schema.description }),
  };
}

export function buildOcrPrompt(agentInstructions?: string): string {
  return `You are an expert AI Document OCR Agent designed to transcribe documents with absolute accuracy and parse relevant data points into structured schemas.

Instructions:
1. Scan the whole document, transcribe the full readable text in its natural layout (OCR), and assign it to the 'rawOcrText' output field.
2. Carefully follow your step-by-step cognitive extraction details (such as reading the company details, invoice lines, totals, numbers or custom fields) and document those step-by-step strings in 'thinkingSteps'.
3. Formulate the categorized values into the structure specified in the schema output and populate 'structuredData'.
${agentInstructions ? `Additional User Agent Rules: ${agentInstructions}` : ""}`;
}
