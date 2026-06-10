import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Layers, 
  Play, 
  Check, 
  AlertCircle, 
  Upload, 
  Download, 
  RefreshCw, 
  Sliders, 
  Plus, 
  Trash2, 
  FileJson, 
  Table, 
  Brain,
  HelpCircle,
  Copy,
  CheckCircle,
  Sparkles,
  Search,
  Eye,
  Settings,
  ChevronRight,
  Info
} from 'lucide-react';
import { DOCUMENT_SAMPLES } from './samples';
import { OcrPreset, OcrProvider, OcrConfig, FieldDefinition, OcrResult, DocumentSample, RagQueryResult } from './types';
import { svgToPngBase64, convertJsonToCsv } from './utils';

export default function App() {
  // Application Primary State
  const [selectedPreset, setSelectedPreset] = useState<OcrPreset>('invoice');
  const [selectedSampleId, setSelectedSampleId] = useState<string>('invoice-sample');
  const [customFields, setCustomFields] = useState<FieldDefinition[]>([
    { key: 'Patient_Name', type: 'string', description: 'Name of the patient or client listed' },
    { key: 'Treatment_Cost', type: 'number', description: 'Total cost charged for treatments' },
    { key: 'Has_Insurance_Coverage', type: 'boolean', description: 'Whether there is an insurance code or active policy mentioned' },
    { key: 'Prescribed_Medicines', type: 'array', description: 'List of all prescription medicines or pills' }
  ]);
  
  // Custom uploaded file state
  const [customFile, setCustomFile] = useState<{
    name: string;
    mimeType: string;
    base64: string; 
    previewUrl: string;
  } | null>(null);

  // OCR provider (Gemini cloud or local Ollama)
  const [ocrProvider, setOcrProvider] = useState<OcrProvider>('gemini');
  const [ocrConfig, setOcrConfig] = useState<OcrConfig | null>(null);

  // Agent Prompts Override
  const [agentInstructions, setAgentInstructions] = useState<string>(
    "Extract prices with currency markers intact. Double check calculations. Transcribe cleanly."
  );

  // Core Request / Loading States
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Active processed OCR outcome
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [activeTab, setActiveTab] = useState<'thinking' | 'rawText' | 'structured' | 'json' | 'ask'>('structured');

  const [ragDocumentId, setRagDocumentId] = useState<string>('');
  const [ragQuestion, setRagQuestion] = useState<string>('');
  const [ragAnswer, setRagAnswer] = useState<RagQueryResult | null>(null);
  const [ragLoading, setRagLoading] = useState<boolean>(false);
  const [ragIngestMessage, setRagIngestMessage] = useState<string>('');
  const [ragError, setRagError] = useState<string | null>(null);
  
  // Custom schema designer temporary inputs
  const [newFieldKey, setNewFieldKey] = useState<string>('');
  const [newFieldType, setNewFieldType] = useState<'string' | 'number' | 'boolean' | 'array'>('string');
  const [newFieldDesc, setNewFieldDesc] = useState<string>('');
  
  // Visual alerts
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Drag and drop UI helpers
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((config: OcrConfig | null) => {
        if (config) {
          setOcrConfig(config);
          setOcrProvider(config.defaultProvider);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize with standard preset mock result so user sees a beautiful full state immediately
  useEffect(() => {
    // Standard mock result matching the preset invoice sample first.
    // The user can run "Execute Extraction" to run the real server-side Gemini 3.5 OCR
    setOcrResult({
      thinkingSteps: [
        "Identified standard electronic invoice with modern corporate styling.",
        "Document title is read as: PLATINUM TECH LLC.",
        "Successfully read Vendor Address: 100 Pine Street, Floor 14, San Francisco, CA.",
        "Detected billing client: Acme Global Corporation located in Austin, TX.",
        "Parsed 3 Line Items correctly with unit rates and computed quantities.",
        "Detected PO Number PO-99023 and Net 30 terms.",
        "Final due total read is $6,982.13 in USD currency.",
        "Formatted all extracted properties into validated rigid JSON structure."
      ],
      rawOcrText: `PLATINUM TECH LLC\nCloud Solutions & Development\n\nINVOICE #INV-2026-089\nDate: May 12, 2026\nPO Number: PO-99023\nPayment Due Term: Net 30\nDue Date: June 11, 2026\n\nFROM:\nPlatinum Tech LLC\n100 Pine Street, Floor 14\nSan Francisco, CA 94111\nbilling@platinumtech.com\n\nBILL TO:\nAcme Global Corporation\nAttn: Engineering Procurement\n500 Industrial Parkway, Suite A\nAustin, TX 78744\n\nITEM DESCRIPTION                                 QTY   UNIT PRICE      TOTAL\n----------------------------------------------------------------------------\nEnterprise Node Systems Custom Integration         1     $4,500.00   $4,500.00\nConfigured cloud server scaling triggers and API proxies\n\nConsulting Services: AI Model Tuning                8       $150.00   $1,200.00\n8 hours training support on OCR schema alignments\n\nCloud Server Cluster Deployment Subscription        3       $250.00     $750.00\nReserved server instance fee for May term\n----------------------------------------------------------------------------\nSubtotal:                                                     $6,450.00\nTax (8.25%):                                                    $532.13\nTotal Amount Due:                                             $6,982.13\n\nPAYMENT INSTRUCTIONS:\nDirect deposit: Route #021000021, Account #8892318023\nThank you for your business. We appreciate your partnership!`,
      structuredData: {
        Invoice_Number: "#INV-2026-089",
        Issue_Date: "May 12, 2026",
        Due_Date: "June 11, 2026",
        Vendor_Name: "Platinum Tech LLC",
        Vendor_Address: "100 Pine Street, Floor 14, San Francisco, CA 94111",
        Billing_To: "Acme Global Corporation (Attn: Engineering Procurement, Austin, TX)",
        Line_Items: [
          { Description: "Enterprise Node Systems Custom Integration", Quantity: 1, Unit_Price: 4500.00, Total: 4500.00 },
          { Description: "Consulting Services: AI Model Tuning", Quantity: 8, Unit_Price: 150.00, Total: 1200.00 },
          { Description: "Cloud Server Cluster Deployment Subscription", Quantity: 3, Unit_Price: 250.00, Total: 750.00 }
        ],
        Subtotal: 6450.00,
        Tax_Amount: 532.13,
        Total_Due: 6982.13,
        Currency: "USD"
      }
    });
  }, []);

  // Sync preset choice with loaded preset sample configurations
  const handleSampleSelect = (sample: DocumentSample) => {
    setCustomFile(null);
    setSelectedSampleId(sample.id);
    setSelectedPreset(sample.preset);
    setError(null);
    
    // Clear old result or set matching beautiful placeholder so user immediately sees structured fields
    if (sample.preset === 'invoice') {
      setOcrResult({
        thinkingSteps: [
          "Identified technological services invoice layout.",
          "Target metadata read: PLATINUM TECH LLC.",
          "Click 'Run AI Document Agent Extraction' to run Gemini OCR live on the server!"
        ],
        rawOcrText: "Invoice Document Sample loaded. Click Run Agent to perform OCR...",
        structuredData: {
          Invoice_Number: "INV-2026-089",
          Issue_Date: "May 12, 2026",
          Due_Date: "June 11, 2026",
          Vendor_Name: "Platinum Tech LLC",
          Vendor_Address: "100 Pine Street, Floor 14, San Francisco, CA 94111",
          Billing_To: "Acme Global Corporation",
          Line_Items: [
            { Description: "Enterprise Node Systems Custom Integration", Quantity: 1, Total: 4500.00 },
            { Description: "Consulting Services: AI Model Tuning", Quantity: 8, Total: 1200.00 },
            { Description: "Cloud Server Cluster Deployment Subscription", Quantity: 3, Total: 750.00 }
          ],
          Subtotal: 6450.00,
          Tax_Amount: 532.13,
          Total_Due: 6982.13,
          Currency: "USD"
        }
      });
    } else if (sample.preset === 'receipt') {
      setOcrResult({
        thinkingSteps: [
          "Identified thermal paper recipe voucher.",
          "Merchant read: ROAST & BREW CO.",
          "Click 'Run AI Document Agent Extraction' to run Gemini OCR live on the server!"
        ],
        rawOcrText: "Cafe Receipt loaded. Click Run Agent to extract structured itemization...",
        structuredData: {
          Merchant_Name: "ROAST & BREW CO.",
          Merchant_Address: "500 Artisan Ave, Portland, OR",
          Transaction_Date: "05/26/2026",
          Transaction_Time: "08:34 AM",
          Items: [
            { Item_Name: "Specialty Lavender Latte", Price: 6.75, Quantity: 2 },
            { Item_Name: "Rosemary Brioche Bun", Price: 4.75, Quantity: 1 },
            { Item_Name: "Organic Avocado Sourdough", Price: 12.00, Quantity: 1 },
            { Item_Name: "Handcrafted Macarons (Assorted)", Price: 2.50, Quantity: 3 }
          ],
          Tax_Amount: 3.40,
          Tip_Amount: 6.00,
          Total_Amount: 47.15,
          Payment_Method: "Visa (*9821)"
        }
      });
    } else if (sample.preset === 'business_card') {
      setOcrResult({
        thinkingSteps: [
          "Identified professional corporate networking executive card.",
          "Name read: Julian Vance.",
          "Click 'Run AI Document Agent Extraction' to run Gemini OCR live on the server!"
        ],
        rawOcrText: "Business Card loaded. Click Run Agent to retrieve email/phone contact cards...",
        structuredData: {
          Full_Name: "Julian Vance",
          Job_Title: "Director of Machine Learning & Autonomy",
          Company_Name: "HYPERION AI",
          Email_Address: "julian.vance@hyperion.ai",
          Phone_Number: "+1 (415) - 555-0182",
          Website_URL: "www.hyperion.ai",
          Office_Address: "160 Autopilot Center, Suite 400, San Francisco, CA"
        }
      });
    } else if (sample.preset === 'id_card') {
      setOcrResult({
        thinkingSteps: [
          "Identified national governmental identity standard card layout.",
          "Holder read: EVANGELINE RAE VANCE-MITCHELL.",
          "Click 'Run AI Document Agent Extraction' to run Gemini OCR live on the server!"
        ],
        rawOcrText: "State Driver License loaded. Click Run Agent to parse verified IDs...",
        structuredData: {
          Document_Type: "Driver's License",
          Document_Number: "AQ-442819-09",
          Full_Name: "EVANGELINE RAE VANCE-MITCHELL",
          Date_of_Birth: "11/14/1993",
          Gender: "F",
          Nationality: "USA (Aura State)",
          Issue_Date: "01/01/2024",
          Expiry_Date: "11/14/2034",
          Address: "450 Redwood Heights, Suite 120, Eureka, CA 95501"
        }
      });
    }
  };

  // Convert files loaded locally physically or via picker
  const processLocalFile = (file: File) => {
    if (!file) return;
    
    // Safety check on file size: max 12MB recommended for best timing
    if (file.size > 12 * 1024 * 1024) {
      setError("Maximum file limit for optimal speed is 12MB. Please select a lighter document.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Str = e.target?.result as string;
      if (base64Str) {
        setCustomFile({
          name: file.name,
          mimeType: file.type || "image/png",
          base64: base64Str,
          previewUrl: URL.createObjectURL(file)
        });
        setSelectedPreset('custom'); // Default custom mode for uploaded file
        setSelectedSampleId('');
        setError(null);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file accurately.");
    };
    reader.readAsDataURL(file);
  };

  // Drag-and-drop handles
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => {
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processLocalFile(e.dataTransfer.files[0]);
    }
  };

  // Add field key configuration to custom fields schema
  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = newFieldKey.trim().replace(/\s+/g, '_');
    if (!cleanKey) return;

    if (customFields.some(f => f.key.toLowerCase() === cleanKey.toLowerCase())) {
      alert("A property key with this name already exists in your schema designer.");
      return;
    }

    setCustomFields([
      ...customFields,
      {
        key: cleanKey,
        type: newFieldType,
        description: newFieldDesc.trim() || `Information corresponding to ${newFieldKey}`
      }
    ]);

    setNewFieldKey('');
    setNewFieldDesc('');
  };

  // Remove field key from custom fields table
  const handleRemoveCustomField = (index: number) => {
    const updated = [...customFields];
    updated.splice(index, 1);
    setCustomFields(updated);
  };

  const buildRagDocumentId = () => {
    const base = customFile?.name || selectedSampleId || `doc-${Date.now()}`;
    return base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 96) || `doc-${Date.now()}`;
  };

  const ingestDocumentForRag = async (text: string, documentId: string) => {
    if (!ocrConfig?.rag?.enabled) {
      const hint =
        ocrConfig?.rag?.provider === 'ollama'
          ? 'RAG unavailable (start Chroma + Colab notebook + COLAB_OCR_URL).'
          : 'RAG unavailable (start Chroma + set GEMINI_API_KEY).';
      setRagIngestMessage(hint);
      return;
    }

    const ingestLabel =
      ocrConfig?.rag?.provider === 'ollama'
        ? `Indexing in Chroma with Colab GPU embeddings (${ocrConfig.rag.ollama?.embeddingModel || 'nomic-embed-text'})...`
        : 'Indexing document in Chroma with Gemini embeddings...';
    setRagIngestMessage(ingestLabel);
    const response = await fetch('/api/rag/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId,
        text,
        sourceName:
          customFile?.name ||
          DOCUMENT_SAMPLES.find((s) => s.id === selectedSampleId)?.name ||
          documentId,
        preset: selectedPreset,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `RAG ingest failed (${response.status})`);
    }

    const data = await response.json();
    setRagDocumentId(documentId);
    setRagIngestMessage(`Indexed ${data.chunksIngested} chunks in Chroma.`);
  };

  const handleRagQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuestion.trim()) return;

    setRagLoading(true);
    setRagError(null);

    try {
      const documentId = ragDocumentId || buildRagDocumentId();
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          question: ragQuestion.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `RAG query failed (${response.status})`);
      }

      const result: RagQueryResult = await response.json();
      setRagAnswer(result);
      setRagDocumentId(result.documentId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'RAG query failed.';
      setRagError(message);
    } finally {
      setRagLoading(false);
    }
  };

  // Submit actual OCR request to Server's Express server
  const handleExecuteOcr = async () => {
    setLoading(true);
    setStatusMessage('Preparing high-resolution file matrix...');
    setError(null);

    try {
      const ollamaSupportedImageTypes = new Set([
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/gif',
        'image/bmp',
      ]);
      let documentMimeType = "";
      let base64Payload = "";

      if (customFile) {
        documentMimeType = customFile.mimeType;
        base64Payload = customFile.base64;

        if (ocrProvider === 'ollama' || ocrProvider === 'colab') {
          const providerName = ocrProvider === 'colab' ? 'Colab GPU' : 'Ollama';
          if (documentMimeType === 'application/pdf') {
            throw new Error(
              `${providerName} accepts raster images only. Upload PNG/JPG/WebP or switch to Gemini for PDF files.`
            );
          }

          if (documentMimeType === 'image/svg+xml') {
            setStatusMessage(`Converting uploaded SVG to PNG for ${providerName} compatibility...`);
            base64Payload = await svgToPngBase64(customFile.base64);
            documentMimeType = 'image/png';
          }

          if (!ollamaSupportedImageTypes.has(documentMimeType)) {
            throw new Error(
              `Unsupported file type for ${providerName}: ${documentMimeType}. Use PNG/JPG/WebP/GIF/BMP, or switch to Gemini.`
            );
          }
        }
      } else {
        // SVG Vector sample documents. 
        // Convert to crisp PNG server side, or client side beforehand via canvas to ensure best OCR.
        const activeSample = DOCUMENT_SAMPLES.find(s => s.id === selectedSampleId);
        if (!activeSample) {
          throw new Error("Target document template reference is missing.");
        }
        
        setStatusMessage('Converting dynamic vector graphics to PNG blocks for pristine AI reading...');
        // Convert SVG string base64 back into raw SVG or fetch the base64 URL directly
        const pngBase64 = await svgToPngBase64(activeSample.dataUrl);
        documentMimeType = "image/png";
        base64Payload = pngBase64;
      }

      const providerLabel =
        ocrProvider === 'ollama'
          ? `Ollama (${ocrConfig?.ollama.model || 'moondream'})`
          : ocrProvider === 'colab'
            ? `Colab GPU (${ocrConfig?.colab?.model || 'moondream'})`
            : `Gemini (${ocrConfig?.gemini.model || 'gemini-3.5-flash'})`;
      setStatusMessage(`Sending document to ${providerLabel} OCR agent...`);

      const payload = {
        fileBase64: base64Payload,
        mimeType: documentMimeType,
        schemaPreset: selectedPreset,
        customSchema: selectedPreset === 'custom' ? customFields : null,
        agentInstructions: agentInstructions,
        provider: ocrProvider,
      };

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const rawResult = await response.json();
      
      if (!rawResult || typeof rawResult !== 'object' || !rawResult.structuredData) {
        throw new Error(
          ocrProvider === 'ollama'
            ? "Invalid output from Ollama. Ensure Ollama is running and a vision model is pulled."
            : ocrProvider === 'colab'
              ? "Invalid output from Colab. Ensure the notebook is running and COLAB_OCR_URL is set in .env."
              : "Invalid output from server. Ensure GEMINI_API_KEY is configured in .env."
        );
      }

      setOcrResult(rawResult);
      setActiveTab('structured');
      setStatusMessage('');
      setRagAnswer(null);
      setRagError(null);

      const docId = buildRagDocumentId();
      const ragText = [
        rawResult.rawOcrText || '',
        JSON.stringify(rawResult.structuredData || {}, null, 2),
      ]
        .filter(Boolean)
        .join('\n\n--- STRUCTURED DATA ---\n\n');

      try {
        await ingestDocumentForRag(ragText, docId);
      } catch (ragErr: unknown) {
        const message =
          ragErr instanceof Error ? ragErr.message : 'Failed to index document for RAG.';
        setRagIngestMessage(message);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An exception occurred while contacting the background server.");
    } finally {
      setLoading(false);
    }
  };

  // Copy tools
  const handleCopyClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Helper file download actions
  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeSampleObj = DOCUMENT_SAMPLES.find(s => s.id === selectedSampleId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-300">
      
      {/* Premium Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Extractory</h1>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 font-extrabold px-1.5 py-0.5 rounded border border-cyan-800/50 uppercase tracking-widest">Agentic OCR</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Categorize any document into clean structured formats with server-side AI reasoning</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                ocrProvider === 'ollama'
                  ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                  : ocrProvider === 'colab'
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                  ocrProvider === 'ollama'
                    ? 'bg-violet-400'
                    : ocrProvider === 'colab'
                      ? 'bg-orange-400'
                      : 'bg-emerald-400'
                }`}
              ></span>
              {ocrProvider === 'ollama'
                ? 'Ollama Local'
                : ocrProvider === 'colab'
                  ? 'Colab GPU'
                  : 'Gemini Cloud'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 grid lg:grid-cols-12 gap-6" id="primary-workspace">
        
        {/* Left Control Column: Input and configuration */}
        <section className="lg:col-span-5 flex flex-col gap-6" id="workspace-controls">
          
          {/* Section 1: Template Selection / Real File upload */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-900 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 font-bold text-xs">01</span>
                <h2 className="font-semibold text-sm text-slate-200">Source Document Selector</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Select preset draft or upload custom</span>
            </div>

            {/* Layout tabs: Draft Samples OR Upload Custom */}
            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-lg border border-slate-900">
              <button 
                type="button"
                onClick={() => {
                  setSelectedPreset('invoice');
                  setSelectedSampleId('invoice-sample');
                  setCustomFile(null);
                  setError(null);
                }}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${!customFile ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Demonstration Presets
              </button>
              <button 
                type="button"
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${customFile ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => {
                  if (customFile) {
                    setSelectedPreset('custom');
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
              >
                Upload Document file
              </button>
            </div>

            {/* Presets List View */}
            {!customFile ? (
              <div className="grid grid-cols-2 gap-2" id="draft-presets">
                {DOCUMENT_SAMPLES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSampleSelect(sample)}
                    className={`relative p-3 rounded-xl border text-left flex flex-col justify-between transition-all group ${
                      selectedSampleId === sample.id 
                        ? 'bg-slate-950 border-cyan-500 ring-1 ring-cyan-500/50' 
                        : 'bg-slate-950/40 border-slate-900 hover:bg-slate-950/80 hover:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400">{sample.preset.replace('_', ' ')}</span>
                        {selectedSampleId === sample.id && (
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                        )}
                      </div>
                      <h3 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">{sample.name}</h3>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-snug">{sample.description}</p>
                    </div>
                    
                    <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[9px] text-slate-400">
                      <span className="font-mono">Vector SVG</span>
                      <span className="text-cyan-400/80 group-hover:text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-0.5">
                        Active <ChevronRight className="h-2 w-2" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Custom File Details display */
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-pink-500/15 text-pink-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-200 truncate max-w-[180px]">{customFile.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-mono">{customFile.mimeType}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFile(null);
                      setSelectedPreset('invoice');
                      setSelectedSampleId('invoice-sample');
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-1 rounded hover:bg-rose-500/20 transition-all font-semibold"
                  >
                    Clear File
                  </button>
                </div>
                
                <div className="border border-slate-900 rounded-lg p-2.5 flex items-center justify-between bg-slate-900/30">
                  <span className="text-[11px] text-slate-400">Schema Selection:</span>
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value as OcrPreset)}
                    className="text-xs bg-slate-950 text-slate-200 font-semibold px-2 py-1.5 rounded border border-slate-800 outline-none focus:border-cyan-500"
                  >
                    <option value="invoice">Invoice preset</option>
                    <option value="receipt">Sales receipt preset</option>
                    <option value="business_card">Business networking card</option>
                    <option value="id_card">Gov ID documentation</option>
                    <option value="custom">⚙️ CUSTOM Schema Designer</option>
                  </select>
                </div>
              </div>
            )}

            {/* Hidden Input File Picker and Live Drag Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                dragOver 
                  ? 'border-cyan-400 bg-cyan-950/20 text-white' 
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processLocalFile(e.target.files[0]);
                  }
                }}
                accept="image/*,application/pdf"
                className="hidden" 
              />
              <Upload className="h-5 w-5 text-slate-400 mx-auto mb-1 animate-bounce" />
              <p className="text-xs text-slate-300 font-semibold">Drop document or click to browse</p>
              <p className="text-[9px] text-slate-600 font-mono mt-0.5">Supports PDF, PNG, JPG, BMP, WebP (Max 12MB)</p>
            </div>
          </div>

          {/* Section 2: Schema Configuration Settings */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-900 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 font-bold text-xs">02</span>
                <h2 className="font-semibold text-sm text-slate-200">Categorization Schema Parameters</h2>
              </div>
              <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded font-mono text-cyan-400 text-[10px]">
                {selectedPreset === "custom" ? "Custom Mode" : `${selectedPreset.replace('_', ' ').toUpperCase()} preset`}
              </span>
            </div>

            {/* If NOT in custom mode, show information about the static schema fields we extraction */}
            {selectedPreset !== 'custom' ? (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900/50 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-300">Preset Fields List:</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The <strong className="text-slate-300 font-semibold">{selectedPreset.replace('_', ' ')}</strong> database template is standardized to extract these core entities:
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-900 text-[11px] font-mono text-slate-500">
                  {selectedPreset === 'invoice' && (
                    <>
                      <div>• Invoice_Number</div>
                      <div>• Issue_Date</div>
                      <div>• Due_Date</div>
                      <div>• Vendor_Name</div>
                      <div>• Line_Items (Array)</div>
                      <div>• Subtotal / Total Due</div>
                    </>
                  )}
                  {selectedPreset === 'receipt' && (
                    <>
                      <div>• Merchant_Name</div>
                      <div>• Transaction_Date</div>
                      <div>• Items (Array)</div>
                      <div>• Tax &amp; Tip</div>
                      <div>• Total_Amount</div>
                      <div>• Payment_Method</div>
                    </>
                  )}
                  {selectedPreset === 'business_card' && (
                    <>
                      <div>• Full_Name</div>
                      <div>• Job_Title</div>
                      <div>• Company_Name</div>
                      <div>• Email_Address</div>
                      <div>• Phone_Number</div>
                      <div>• Website_URL</div>
                    </>
                  )}
                  {selectedPreset === 'id_card' && (
                    <>
                      <div>• Document_Type</div>
                      <div>• Document_Number</div>
                      <div>• Full_Name</div>
                      <div>• Date_of_Birth</div>
                      <div>• Expiry_Date</div>
                      <div>• Address</div>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPreset('custom')}
                  className="mt-2.5 text-center text-xs bg-cyan-950 text-cyan-400 hover:bg-cyan-900 py-1.5 rounded font-bold transition-all"
                >
                  Switch to Schema Designer
                </button>
              </div>
            ) : (
              /* ACTIVE CUSTOM SCHEMA DESIGNER TABLE */
              <div className="flex flex-col gap-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Map and declare custom database schemas. The AI OCR Agent will build a dynamic extraction structure in exact matching output.
                </p>

                {/* Inline form to append fields */}
                <form onSubmit={handleAddCustomField} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-slate-200">Add Schema Item Property</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 uppercase font-mono font-bold">Key (Property Name)</label>
                      <input
                        type="text"
                        placeholder="Ex: Account_ID"
                        value={newFieldKey}
                        required
                        onChange={(e) => setNewFieldKey(e.target.value)}
                        className="text-xs bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-white outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 uppercase font-mono font-bold">Element Type</label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as any)}
                        className="text-xs bg-slate-900 border border-slate-800 px-2 py-1.5 rounded text-white outline-none focus:border-cyan-500 font-semibold"
                      >
                        <option value="string">Text String</option>
                        <option value="number">Numeric</option>
                        <option value="boolean">True/False</option>
                        <option value="array">List (Array)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold">Instruction / Description</label>
                    <input
                      type="text"
                      placeholder="Ex: Customer's unique bank account code"
                      value={newFieldDesc}
                      onChange={(e) => setNewFieldDesc(e.target.value)}
                      className="text-xs bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-white outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs py-2 rounded shadow-md shadow-cyan-950/20 transition-all cursor-pointer"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    Inject Field Key
                  </button>
                </form>

                {/* Schema Designer Items list */}
                <div className="max-h-48 overflow-y-auto border border-slate-900 rounded-lg" id="custom-fields-table">
                  <table className="w-full text-left text-xs bg-slate-950">
                    <thead className="bg-slate-900/50 sticky top-0 text-[10px] text-slate-400 uppercase font-mono border-b border-slate-900">
                      <tr>
                        <th className="px-3 py-2 font-bold">Key (Snake Case)</th>
                        <th className="px-2 py-2 font-bold">Type</th>
                        <th className="px-3 py-2 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {customFields.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-slate-500 py-6 text-xs italic">
                            No property tags designed yet. Declare your schema!
                          </td>
                        </tr>
                      ) : (
                        customFields.map((field, index) => (
                          <tr key={index} className="hover:bg-slate-900/30">
                            <td className="px-3 py-2 font-mono text-cyan-300 font-semibold">{field.key}</td>
                            <td className="px-2 py-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                field.type === 'string' ? 'bg-amber-950 text-amber-400 border border-amber-800/35' :
                                field.type === 'number' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/35' :
                                field.type === 'boolean' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/35' :
                                'bg-purple-950 text-purple-400 border border-purple-800/35'
                              }`}>
                                {field.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomField(index)}
                                className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition-all"
                                title="Delete structure tag"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: OCR Provider */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-900 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-violet-500/10 text-violet-400 font-bold text-xs">03</span>
              <h2 className="font-semibold text-sm text-slate-200">OCR Engine Provider</h2>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Gemini (cloud), Ollama (local), or Colab GPU (remote notebook). Default from <code className="text-cyan-400/80">OCR_PROVIDER</code> in .env.
            </p>
            <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-lg border border-slate-900">
              <button
                type="button"
                onClick={() => setOcrProvider('gemini')}
                className={`py-2 px-2 rounded-md text-[10px] sm:text-xs font-bold transition-all ${
                  ocrProvider === 'gemini'
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-700/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Gemini
              </button>
              <button
                type="button"
                onClick={() => setOcrProvider('ollama')}
                className={`py-2 px-2 rounded-md text-[10px] sm:text-xs font-bold transition-all ${
                  ocrProvider === 'ollama'
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-700/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Ollama
              </button>
              <button
                type="button"
                onClick={() => setOcrProvider('colab')}
                className={`py-2 px-2 rounded-md text-[10px] sm:text-xs font-bold transition-all ${
                  ocrProvider === 'colab'
                    ? 'bg-orange-600/20 text-orange-300 border border-orange-700/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Colab GPU
              </button>
            </div>
            {ocrProvider === 'ollama' && ocrConfig && !ocrConfig.ollama.available && (
              <p className="text-[10px] text-amber-400/90 bg-amber-950/30 border border-amber-900/40 rounded-lg px-2.5 py-2">
                Ollama is not reachable at {ocrConfig.ollama.baseUrl}. Run <code className="text-amber-300">ollama serve</code> and{' '}
                <code className="text-amber-300">ollama pull {ocrConfig.ollama.model}</code>.
              </p>
            )}
            {ocrProvider === 'colab' && ocrConfig && !ocrConfig.colab?.configured && (
              <p className="text-[10px] text-amber-400/90 bg-amber-950/30 border border-amber-900/40 rounded-lg px-2.5 py-2">
                Set <code className="text-amber-300">COLAB_OCR_URL</code> in .env to your ngrok URL from <code className="text-amber-300">test.ipynb</code>.
              </p>
            )}
            {ocrProvider === 'colab' && ocrConfig?.colab?.configured && !ocrConfig.colab.available && (
              <p className="text-[10px] text-amber-400/90 bg-amber-950/30 border border-amber-900/40 rounded-lg px-2.5 py-2">
                Colab OCR API is not reachable at {ocrConfig.colab.url}. Start the Colab notebook and ngrok tunnel.
              </p>
            )}
            {ocrProvider === 'gemini' && ocrConfig && !ocrConfig.gemini.configured && (
              <p className="text-[10px] text-amber-400/90 bg-amber-950/30 border border-amber-900/40 rounded-lg px-2.5 py-2">
                Set <code className="text-amber-300">GEMINI_API_KEY</code> in your .env file.
              </p>
            )}
          </div>

          {/* Section 4: AI Agent Prompt Directives */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-900 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-purple-500/10 text-purple-400 font-bold text-xs">04</span>
              <h2 className="font-semibold text-sm text-slate-200">AI Agent Custom Directives</h2>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-normal">
              Supply tailored instructions to the AI engine on how to handle OCR elements, languages, or write translations.
            </p>

            <textarea
              value={agentInstructions}
              onChange={(e) => setAgentInstructions(e.target.value)}
              placeholder="e.g. Translate text to English, search or ignore handwriting, capture tax calculations precisely..."
              className="w-full text-xs bg-slate-950 text-slate-200 border border-slate-800 p-3 rounded-lg outline-none focus:border-cyan-500 min-h-[60px] font-sans"
            />
            
            <div className="flex flex-wrap gap-1">
              <button 
                type="button"
                onClick={() => setAgentInstructions("Extract exact dates and numbers. Transcribe comments in margins.")}
                className="text-[9px] bg-slate-900 hover:bg-slate-800 border border-slate-800/60 text-slate-400 px-2 py-1 rounded"
              >
                + Include Handwriting
              </button>
              <button 
                type="button"
                onClick={() => setAgentInstructions("Translate all non-english tags. Standardize numeric floats to 2 decimal places.")}
                className="text-[9px] bg-slate-900 hover:bg-slate-800 border border-slate-800/60 text-slate-400 px-2 py-1 rounded"
              >
                + Force Translation &amp; Rates
              </button>
            </div>
          </div>

          {/* Core Submit trigger action */}
          <button
            type="button"
            disabled={loading}
            onClick={handleExecuteOcr}
            className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-extrabold text-white transition-all shadow-md cursor-pointer ${
              loading 
                ? 'bg-slate-800 cursor-not-allowed border border-slate-700/50 shadow-none' 
                : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] shadow-cyan-500/10 shadow-lg'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
                <span className="animate-pulse">Agent processing: {statusMessage}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-cyan-300 fill-cyan-300/20" />
                <span>Run AI Document Agent Extraction</span>
              </>
            )}
          </button>
          
          <p className="text-[10px] text-slate-500 text-center font-medium leading-relaxed">
            Extracts via{' '}
            {ocrProvider === 'ollama'
              ? 'local Ollama vision'
              : ocrProvider === 'colab'
                ? 'Colab GPU (remote)'
                : 'Gemini cloud'}{' '}
            into your schema. Secrets stay in .env, never in the browser.
          </p>

        </section>

        {/* Right Panel Workspace: Previews and Categorization logs */}
        <section className="lg:col-span-7 flex flex-col gap-6" id="workspace-results">
          
          {/* Display original document preview */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-900 p-5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 font-mono">Original Document Target</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-900 text-xs text-slate-400">
                <Eye className="h-3.5 w-3.5 text-indigo-400" />
                <span>Active Preview Viewer</span>
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-900 p-5 flex items-center justify-center min-h-[220px] max-h-[380px] overflow-hidden relative group">
              {customFile ? (
                /* Native upload preview support */
                customFile.mimeType === 'application/pdf' ? (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-cyan-500 mx-auto mb-3" />
                    <span className="text-sm font-semibold text-white">PDF Document Loaded</span>
                    <p className="text-xs text-slate-500 mt-1">{customFile.name}</p>
                    <p className="text-[11px] text-indigo-400 mt-2 font-mono bg-indigo-950/40 px-2.5 py-1 rounded">Mime: {customFile.mimeType}</p>
                  </div>
                ) : (
                  <img 
                    src={customFile.previewUrl} 
                    alt="Loaded Original File" 
                    className="max-h-[340px] w-auto object-contain rounded-lg shadow-xl"
                  />
                )
              ) : (
                /* Dynamic visual draft SVG demonstration renders */
                activeSampleObj ? (
                  <div 
                    className="w-full max-w-[340px] max-h-[340px] overflow-auto border border-slate-900 rounded-lg p-2 bg-white"
                    dangerouslySetInnerHTML={{ __html: decodeURIComponent(activeSampleObj.dataUrl.replace('data:image/svg+xml;utf8,', '')) }}
                  />
                ) : (
                  <div className="text-center text-slate-500 py-10">
                    <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                    <p>Select a demonstration preset or upload custom document to preview.</p>
                  </div>
                )
              )}
              
              {/* Overlay with status */}
              <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 text-[10px] text-slate-300 font-mono px-2.5 py-1 rounded">
                {!customFile ? `Draft Preset: ${selectedPreset.replace('_', ' ').toUpperCase()}` : `Uploaded Custom: ${customFile.name}`}
              </div>
            </div>
          </div>

          {/* Operational extraction workspace results */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-900 p-5 flex-1 flex flex-col gap-4">
            
            {/* Workspace tabs bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-900 self-start">
                <button
                  type="button"
                  onClick={() => setActiveTab('structured')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    activeTab === 'structured' 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Table className="h-3.5 w-3.5" />
                  Structured Data
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('thinking')}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
                    activeTab === 'thinking' 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Brain className="h-3.5 w-3.5" />
                  Agent Thinking
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('rawText')}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
                    activeTab === 'rawText' 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Raw OCR Text
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
                    activeTab === 'json' 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileJson className="h-3.5 w-3.5" />
                  Raw JSON
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ask')}
                  disabled={!ocrResult}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
                    activeTab === 'ask'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <Search className="h-3.5 w-3.5" />
                  Ask (RAG)
                </button>
              </div>

              {/* Instant Output action buttons */}
              {ocrResult && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const csvStr = convertJsonToCsv(ocrResult.structuredData);
                      downloadTextFile(csvStr, `extracted-${selectedPreset}.csv`, 'text/csv');
                    }}
                    className="flex items-center gap-1 text-[11px] bg-cyan-950 font-bold hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 px-2.5 py-1.5 rounded transition-all"
                  >
                    <Download className="h-3 w-3" />
                    Download CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadTextFile(JSON.stringify(ocrResult, null, 2), `extracted-${selectedPreset}.json`, 'application/json');
                    }}
                    className="flex items-center gap-1 text-[11px] bg-indigo-950 font-bold hover:bg-indigo-900 border border-indigo-800/60 text-indigo-300 px-2.5 py-1.5 rounded transition-all"
                  >
                    <Download className="h-3 w-3" />
                    JSON Output
                  </button>
                </div>
              )}
            </div>

            {/* Error alerts pane */}
            {error && (
              <div className="bg-rose-950/20 text-rose-400 border border-rose-900/60 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Extraction Agent Interrupted</h4>
                  <p className="text-[11px] leading-relaxed">{error}</p>
                  <p className="text-[10px] text-rose-500/80 mt-1.5 leading-normal">
                    {ocrProvider === 'ollama' ? (
                      <>
                        Tip: Run <strong className="text-rose-400">ollama serve</strong>, pull your vision model (
                        <strong className="text-rose-400">{ocrConfig?.ollama.model || 'moondream'}</strong>
                ), check <strong className="text-rose-400">OLLAMA_BASE_URL</strong> in .env, and upload a raster image (PNG/JPG/WebP).
                      </>
                    ) : ocrProvider === 'colab' ? (
                      <>
                        Tip: Start <strong className="text-rose-400">test.ipynb</strong> in Colab, run all cells, set{' '}
                        <strong className="text-rose-400">COLAB_OCR_URL</strong> in .env to the ngrok URL, and use a raster image.
                      </>
                    ) : (
                      <>
                        Tip: Verify <strong className="text-rose-400">GEMINI_API_KEY</strong> is set in your .env file.
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Render selected active Tab workspace */}
            <div className="flex-1 min-h-[300px] flex flex-col bg-slate-950 rounded-xl border border-slate-900 p-4 overflow-x-auto relative">
              
              {loading && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10">
                  <div className="relative mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 animate-pulse border border-cyan-500/60 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-cyan-400 animate-spin" />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-300 uppercase letter-spacing font-mono tracking-widest animate-pulse">Running Cloud-Node Pipeline</span>
                  <p className="text-sm font-bold text-white mt-1 max-w-sm">{statusMessage}</p>
                  <p className="text-[11px] text-slate-500 mt-2 max-w-xs block leading-relaxed italic">
                    Reading full document text patterns, transcribing raw layouts, and structuring categorized CSV/JSON arrays on demand...
                  </p>
                </div>
              )}

              {/* Structured view Tab content */}
              {activeTab === 'structured' && ocrResult && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  
                  {/* Highlight box */}
                  <div className="flex items-center justify-between bg-slate-900/40 border border-slate-900/80 p-3 rounded-lg flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-200">Categorized Data Elements Detected</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/50 px-2 py-0.5 border border-emerald-900/35 rounded-full font-bold">
                      Format Schema: {selectedPreset.toUpperCase()}
                    </span>
                  </div>

                  {/* Render Data List mapped strictly to Structured Data Object keys */}
                  <div className="flex flex-col gap-3.5">
                    {Object.keys(ocrResult.structuredData).map((key) => {
                      const value = ocrResult.structuredData[key];

                      // 1. Check if values are arrays (nested lists e.g., Line_Items/Items) and render nice bento sub-tables
                      if (Array.isArray(value)) {
                        return (
                          <div key={key} className="border border-slate-900 rounded-xl bg-slate-950 overflow-hidden flex flex-col">
                            <div className="bg-slate-900/50 px-3 py-2 border-b border-slate-900 flex items-center justify-between">
                              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wide">{key} [Table Array]</span>
                              <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded font-mono text-slate-500">{value.length} items detected</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-950 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-900 text-[9px]">
                                  <tr>
                                    {value.length > 0 && Object.keys(value[0]).map((subKey) => (
                                      <th key={subKey} className="px-3 py-2 font-bold">{subKey}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900">
                                  {value.map((item, id) => (
                                    <tr key={id} className="hover:bg-slate-900/20">
                                      {Object.keys(item).map((subKey) => {
                                        const subVal = item[subKey];
                                        return (
                                          <td key={subKey} className="px-3 py-2.5 font-medium text-slate-300">
                                            {typeof subVal === 'number' ? (
                                              <span className="font-mono text-emerald-400">${subVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            ) : (
                                              String(subVal)
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }

                      // 2. Standard properties (strings/numbers/booleans)
                      return (
                        <div key={key} className="border border-slate-900/80 rounded-xl p-3.5 bg-slate-900/10 hover:border-slate-800 transition-all grid sm:grid-cols-4 gap-2 items-start">
                          <div className="sm:col-span-1 border-r-0 sm:border-r border-slate-900/80 pr-2">
                            <span className="text-[11px] font-mono text-slate-400 font-semibold block truncate" title={key}>{key}</span>
                            <span className="text-[9px] text-slate-600 font-mono font-bold uppercase">{typeof value}</span>
                          </div>
                          <div className="sm:col-span-3 text-xs pl-0 sm:pl-2">
                            {typeof value === 'boolean' ? (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                value ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${value ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                {value ? 'True / Yes' : 'False / No'}
                              </span>
                            ) : typeof value === 'number' ? (
                              <span className="font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 font-bold px-2.5 py-0.5 rounded">
                                {key.toLowerCase().includes('total') || key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('subtotal') || key.toLowerCase().includes('tax') ? '$' : ''}
                                {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <p className="text-slate-200 font-medium text-[12px] leading-relaxed whitespace-pre-wrap">{String(value)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cognitive Agent Thinking Step timeline */}
              {activeTab === 'thinking' && ocrResult && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Brain className="h-4 w-4 text-purple-400" />
                      Step-by-step Execution Log
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyClipboard(ocrResult.thinkingSteps.join('\n'), 'thinking')}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 border border-slate-900 px-2 py-1 rounded"
                    >
                      {copiedText === 'thinking' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy Log
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-3 pt-2">
                    {ocrResult.thinkingSteps.map((step, idx) => (
                      <div key={idx} className="flex gap-3 items-start group">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="h-6 w-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-indigo-400 font-mono font-bold">
                            {idx + 1}
                          </div>
                          {idx !== ocrResult.thinkingSteps.length - 1 && (
                            <div className="w-[1px] bg-slate-900 flex-1 min-h-[25px]"></div>
                          )}
                        </div>
                        <div className="bg-slate-900/20 border border-slate-900 rounded-lg p-3 flex-1 group-hover:border-slate-800 transition-all">
                          <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Literal Transcript output view  */}
              {activeTab === 'rawText' && ocrResult && (
                <div className="flex flex-col gap-3.5 flex-1 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-amber-400" />
                      Raw OCR Document Output
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyClipboard(ocrResult.rawOcrText, 'rawtext')}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 border border-slate-900 px-2 py-1 rounded select-none"
                    >
                      {copiedText === 'rawtext' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy transcript
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 p-4 bg-slate-950 border border-slate-900 rounded-lg overflow-auto leading-relaxed flex-1 whitespace-pre-wrap max-h-[500px]">
                    {ocrResult.rawOcrText || "No readable literal lines found."}
                  </pre>
                </div>
              )}

              {activeTab === 'ask' && ocrResult && (
                <div className="flex flex-col gap-4 animate-fadeIn flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                      <Search className="h-4 w-4 text-cyan-400" />
                      Document Q&amp;A (Chroma +{' '}
                      {ocrConfig?.rag?.provider === 'ollama' ? 'Colab GPU / Ollama' : 'Gemini'})
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        ocrConfig?.rag?.enabled
                          ? 'text-emerald-400 border-emerald-900/50 bg-emerald-950/30'
                          : 'text-amber-400 border-amber-900/50 bg-amber-950/30'
                      }`}
                    >
                      {ocrConfig?.rag?.enabled
                        ? 'RAG ready'
                        : ocrConfig?.rag?.provider === 'ollama'
                          ? 'Chroma + Colab notebook + COLAB_OCR_URL'
                          : 'Chroma + GEMINI_API_KEY'}
                    </span>
                  </div>

                  {ragIngestMessage && (
                    <p className="text-[11px] text-slate-400 bg-slate-900/40 border border-slate-900 rounded-lg px-3 py-2">
                      {ragIngestMessage}
                    </p>
                  )}

                  {ragError && (
                    <p className="text-[11px] text-rose-400 bg-rose-950/20 border border-rose-900/50 rounded-lg px-3 py-2">
                      {ragError}
                    </p>
                  )}

                  <form onSubmit={handleRagQuery} className="flex flex-col gap-3">
                    <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
                      Ask about this document
                    </label>
                    <textarea
                      value={ragQuestion}
                      onChange={(e) => setRagQuestion(e.target.value)}
                      placeholder="e.g. What is the total due? Who is the vendor?"
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-700/60 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={ragLoading || !ragQuestion.trim() || !ocrConfig?.rag?.enabled}
                      className="self-start inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      {ragLoading ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {ragLoading
                        ? 'Searching...'
                        : ocrConfig?.rag?.provider === 'ollama'
                          ? 'Ask (Colab GPU)'
                          : 'Ask Gemini'}
                    </button>
                  </form>

                  {ragAnswer && (
                    <div className="flex flex-col gap-3 border-t border-slate-900 pt-3">
                      <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4">
                        <h4 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wide mb-2">
                          Answer
                        </h4>
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {ragAnswer.answer}
                        </p>
                      </div>

                      {ragAnswer.citations.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                            Sources
                          </h4>
                          {ragAnswer.citations.map((cite) => (
                            <div
                              key={cite.chunkIndex}
                              className="text-[11px] text-slate-400 bg-slate-950 border border-slate-900 rounded-lg p-3"
                            >
                              <span className="text-cyan-500 font-mono font-bold">
                                Chunk {cite.chunkIndex}
                              </span>
                              <p className="mt-1 leading-relaxed line-clamp-4">{cite.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Full Raw API JSON structure */}
              {activeTab === 'json' && ocrResult && (
                <div className="flex flex-col gap-3 flex-1 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                      <FileJson className="h-4 w-4 text-cyan-400" />
                      Pruned API JSON Response
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyClipboard(JSON.stringify(ocrResult, null, 2), 'rawjson')}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 border border-slate-900 px-2 py-1 rounded"
                    >
                      {copiedText === 'rawjson' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy RAW JSON
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-cyan-300/90 p-4 bg-slate-950 border border-slate-900 rounded-lg overflow-auto flex-1 max-h-[500px]">
                    {JSON.stringify(ocrResult, null, 2)}
                  </pre>
                </div>
              )}

              {/* Empty placeholder view */}
              {!ocrResult && !loading && (
                <div className="flex flex-col items-center justify-center p-12 text-center my-auto">
                  <Sparkles className="h-10 w-10 text-indigo-500/40 mb-3 animate-pulse" />
                  <h3 className="text-sm font-semibold text-slate-300">Run Document Agent</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 leading-normal">
                    Click 'Run AI Document Agent Extraction' on the left panel to execute multimodal OCR using Gemini-3.5-flash server-side.
                  </p>
                </div>
              )}

            </div>
          </div>
        </section>

      </main>

      {/* Aesthetic Workspace footer credit lines */}
      <footer className="border-t border-slate-905 bg-slate-950 py-5 text-center mt-auto" id="app-footer">
        <p className="text-[10px] text-slate-600 font-mono tracking-wider uppercase">
          Extractory AI OCR Workspace — Made using Google AI Studio Build &amp; @google/genai Node SDK
        </p>
      </footer>
    </div>
  );
}
