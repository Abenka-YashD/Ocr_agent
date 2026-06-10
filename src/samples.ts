import { DocumentSample } from "./types";

export const SAMPLE_INVOICE_SVG = `<svg viewBox="0 0 600 800" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Invoice Background -->
  <rect width="600" height="800" fill="#ffffff" rx="12"/>
  <rect x="20" y="20" width="560" height="760" fill="none" stroke="#e2e8f0" stroke-width="2" rx="8"/>
  
  <!-- Colored Banner -->
  <path d="M20,28 L20,120 L580,120 L580,28 A8,8 0 0,0 572,20 L28,20 A8,8 0 0,0 20,28 Z" fill="#0f172a"/>
  
  <!-- Header Text -->
  <text x="50" y="70" font-family="'Inter', sans-serif" font-size="28" font-weight="800" fill="#ffffff">PLATINUM TECH LLC</text>
  <text x="50" y="95" font-family="'Inter', sans-serif" font-size="14" fill="#94a3b8">Cloud Solutions &amp; Development</text>
  
  <text x="460" y="65" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#94a3b8" text-anchor="end">INVOICE</text>
  <text x="550" y="65" font-family="'Inter', sans-serif" font-size="18" font-weight="700" fill="#38bdf8" text-anchor="end">#INV-2026-089</text>
  <text x="550" y="90" font-family="'Inter', sans-serif" font-size="12" fill="#94a3b8" text-anchor="end">Date: May 12, 2026</text>
  
  <!-- Info Blocks -->
  <text x="50" y="160" font-family="'Inter', sans-serif" font-size="12" font-weight="700" fill="#64748b">FROM:</text>
  <text x="50" y="180" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#0f172a">Platinum Tech LLC</text>
  <text x="50" y="200" font-family="'Inter', sans-serif" font-size="12" fill="#475569">100 Pine Street, Floor 14</text>
  <text x="50" y="218" font-family="'Inter', sans-serif" font-size="12" fill="#475569">San Francisco, CA 94111</text>
  <text x="50" y="235" font-family="'Inter', sans-serif" font-size="12" fill="#475569">billing@platinumtech.com</text>
  
  <text x="350" y="160" font-family="'Inter', sans-serif" font-size="12" font-weight="700" fill="#64748b">BILL TO:</text>
  <text x="350" y="180" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#0f172a">Acme Global Corporation</text>
  <text x="350" y="200" font-family="'Inter', sans-serif" font-size="12" fill="#475569">Attn: Engineering Procurement</text>
  <text x="350" y="218" font-family="'Inter', sans-serif" font-size="12" fill="#475569">500 Industrial Parkway, Suite A</text>
  <text x="350" y="235" font-family="'Inter', sans-serif" font-size="12" fill="#475569">Austin, TX 78744</text>
  
  <!-- Dates -->
  <line x1="50" y1="265" x2="550" y2="265" stroke="#f1f5f9" stroke-width="2"/>
  <text x="50" y="290" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#475569">PO Number: PO-99023</text>
  <text x="350" y="290" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#475569">Payment Due Term: Net 30</text>
  <text x="550" y="290" font-family="'Inter', sans-serif" font-size="12" font-weight="700" fill="#ea580c" text-anchor="end">Due Date: June 11, 2026</text>
  <line x1="50" y1="310" x2="550" y2="310" stroke="#f1f5f9" stroke-width="2"/>
  
  <!-- Table Header -->
  <rect x="50" y="335" width="500" height="35" fill="#f8fafc" rx="4"/>
  <text x="70" y="357" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#475569">ITEM DESCRIPTION</text>
  <text x="350" y="357" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#475569" text-anchor="middle">QTY</text>
  <text x="440" y="357" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#475569" text-anchor="middle">UNIT PRICE</text>
  <text x="530" y="357" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#475569" text-anchor="end">TOTAL</text>
  
  <!-- Items -->
  <!-- Item 1 -->
  <text x="70" y="400" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#0f172a">Enterprise Node Systems Custom Integration</text>
  <text x="70" y="418" font-family="'Inter', sans-serif" font-size="11" fill="#64748b">Configured cloud server scaling triggers and API proxies</text>
  <text x="350" y="405" font-family="'Inter', sans-serif" font-size="12" fill="#0f172a" text-anchor="middle">1</text>
  <text x="440" y="405" font-family="'Inter', sans-serif" font-size="12" fill="#0f172a" text-anchor="middle">$4,500.00</text>
  <text x="530" y="405" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#0f172a" text-anchor="end">$4,500.00</text>
  <line x1="50" y1="435" x2="550" y2="435" stroke="#f1f5f9" stroke-width="1"/>
  
  <!-- Item 2 -->
  <text x="70" y="465" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#0f172a">Consulting Services: AI Model Tuning</text>
  <text x="70" y="483" font-family="'Inter', sans-serif" font-size="11" fill="#64748b">8 hours training support on OCR schema alignments</text>
  <text x="350" y="470" font-family="'Inter', sans-serif" font-size="12" fill="#0f172a" text-anchor="middle">8</text>
  <text x="440" y="470" font-family="'Inter', sans-serif" font-size="12" fill="#0f172a" text-anchor="middle">$150.00</text>
  <text x="530" y="470" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#0f172a" text-anchor="end">$1,200.00</text>
  <line x1="50" y1="500" x2="550" y2="500" stroke="#f1f5f9" stroke-width="1"/>
  
  <!-- Item 3 -->
  <text x="70" y="530" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#0f172a">Cloud Server Cluster Deployment Subscription</text>
  <text x="70" y="548" font-family="'Inter', sans-serif" font-size="11" fill="#64748b">Reserved server instance fee for May term</text>
  <text x="350" y="535" font-family="'Inter', sans-serif" font-size="12" fill="#0f172a" text-anchor="middle">3</text>
  <text x="440" y="535" font-family="'Inter', sans-serif" font-size="12" fill="#0f172a" text-anchor="middle">$250.00</text>
  <text x="530" y="535" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#0f172a" text-anchor="end">$750.00</text>
  <line x1="50" y1="565" x2="550" y2="565" stroke="#f1f5f9" stroke-width="1"/>
  
  <!-- Footer math -->
  <line x1="330" y1="590" x2="550" y2="590" stroke="#0f172a" stroke-width="1.5"/>
  
  <text x="350" y="615" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#475569">Subtotal:</text>
  <text x="530" y="615" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#0f172a" text-anchor="end">$6,450.00</text>
  
  <text x="350" y="640" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#475569">Tax (8.25%):</text>
  <text x="530" y="640" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#0f172a" text-anchor="end">$532.13</text>
  
  <text x="350" y="670" font-family="'Inter', sans-serif" font-size="14" font-weight="700" fill="#0f172a">Total Amount Due:</text>
  <text x="530" y="670" font-family="'Inter', sans-serif" font-size="18" font-weight="800" fill="#0369a1" text-anchor="end">$6,982.13</text>
  
  <line x1="330" y1="695" x2="550" y2="695" stroke="#0f172a" stroke-width="1.5"/>
  
  <!-- Payment details -->
  <text x="50" y="730" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#64748b">PAYMENT INSTRUCTIONS:</text>
  <text x="50" y="747" font-family="'Inter', sans-serif" font-size="11" fill="#475569">Direct deposit: Route #021000021, Account #8892318023</text>
  <text x="50" y="762" font-family="'Inter', sans-serif" font-size="11" fill="#475569">Thank you for your business. We appreciate your partnership!</text>
</svg>`;

export const SAMPLE_RECEIPT_SVG = `<svg viewBox="0 0 400 600" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Receipt Paper -->
  <rect width="400" height="600" fill="#fdfdf9"/>
  <!-- Zigzag cutout footer -->
  <path d="M 0,0 L 400,0 L 400,590 L 390,600 L 380,590 L 370,600 L 360,590 L 350,600 L 340,590 L 330,600 L 320,590 L 310,600 L 300,590 L 290,600 L 280,590 L 270,600 L 260,590 L 250,600 L 240,590 L 230,600 L 220,590 L 210,600 L 200,590 L 190,600 L 180,590 L 170,600 L 160,590 L 150,600 L 140,590 L 130,600 L 120,590 L 110,600 L 100,590 L 90,600 L 80,590 L 70,600 L 60,590 L 50,600 L 40,590 L 30,600 L 20,590 L 10,600 L 0,590 Z" fill="#fbfbf5" stroke="#e4e4d4" stroke-width="1.5"/>
  
  <text x="200" y="50" font-family="'Courier New', monospace" font-size="22" font-weight="900" fill="#1b1c1a" text-anchor="middle">ROAST &amp; BREW CO.</text>
  <text x="200" y="72" font-family="'Courier New', monospace" font-size="12" fill="#4a4b45" text-anchor="middle">Store #44890 - Retail Row</text>
  <text x="200" y="86" font-family="'Courier New', monospace" font-size="12" fill="#4a4b45" text-anchor="middle">500 Artisan Ave, Portland, OR</text>
  <text x="200" y="100" font-family="'Courier New', monospace" font-size="12" fill="#4a4b45" text-anchor="middle">Tel: (503) 555-0142</text>
  
  <!-- Divider -->
  <text x="200" y="130" font-family="'Courier New', monospace" font-size="14" fill="#4a4b45" text-anchor="middle">- - - - - - - - - - - - - - - - - -</text>
  
  <!-- Metadata -->
  <text x="30" y="155" font-family="'Courier New', monospace" font-size="12" fill="#2d2e2b">Date: 05/26/2026</text>
  <text x="370" y="155" font-family="'Courier New', monospace" font-size="12" fill="#2d2e2b" text-anchor="end">Time: 08:34 AM</text>
  <text x="30" y="172" font-family="'Courier New', monospace" font-size="12" fill="#2d2e2b">Ticket: #90218</text>
  <text x="370" y="172" font-family="'Courier New', monospace" font-size="12" fill="#2d2e2b" text-anchor="end">Server: Clarissa</text>
  
  <!-- Divider -->
  <text x="200" y="195" font-family="'Courier New', monospace" font-size="14" fill="#4a4b45" text-anchor="middle">- - - - - - - - - - - - - - - - - -</text>
  
  <!-- Line items -->
  <text x="30" y="225" font-family="'Courier New', monospace" font-size="13" font-weight="700" fill="#2d2e2b">2x Specialty Lavender Latte</text>
  <text x="370" y="225" font-family="'Courier New', monospace" font-size="13" font-weight="700" fill="#2d2e2b" text-anchor="end">$13.50</text>
  <text x="50" y="242" font-family="'Courier New', monospace" font-size="11" fill="#787970">@ $6.75 each (Oat Milk Substitute)</text>
  
  <text x="30" y="275" font-family="'Courier New', monospace" font-size="13" font-weight="700" fill="#2d2e2b">1x Rosemary Brioche Bun</text>
  <text x="370" y="275" font-family="'Courier New', monospace" font-size="13" font-weight="700" fill="#2d2e2b" text-anchor="end">$4.75</text>
  
  <text x="30" y="310" font-family="'Courier New', monospace" font-size="13" font-weight="700" fill="#2d2e2b">1x Organic Avocado Sourdough</text>
  <text x="370" y="310" font-family="'Courier New', monospace" font-size="13" font-weight="700" fill="#2d2e2b" text-anchor="end">$12.00</text>
  <text x="50" y="327" font-family="'Courier New', monospace" font-size="11" fill="#787970">(Gluten Free bread upgrade)</text>
  
  <text x="30" y="360" font-family="'Courier New', monospace" font-size="13" font-weight="700" fill="#2d2e2b">3x Handcrafted Macarons (Assorted)</text>
  <text x="370" y="360" font-family="'Courier New', monospace" font-size="13" font-weight="700" fill="#2d2e2b" text-anchor="end">$7.50</text>
  <text x="50" y="377" font-family="'Courier New', monospace" font-size="11" fill="#787970">@ $2.50 each (Pistachio, Lemon, Rose)</text>
  
  <!-- Divider -->
  <text x="200" y="410" font-family="'Courier New', monospace" font-size="14" fill="#4a4b45" text-anchor="middle">- - - - - - - - - - - - - - - - - -</text>
  
  <!-- Totals -->
  <text x="180" y="440" font-family="'Courier New', monospace" font-size="13" fill="#2d2e2b" text-anchor="end">Subtotal:</text>
  <text x="370" y="440" font-family="'Courier New', monospace" font-size="13" fill="#2d2e2b" text-anchor="end">$37.75</text>
  
  <text x="180" y="460" font-family="'Courier New', monospace" font-size="13" fill="#2d2e2b" text-anchor="end">Sales Tax (9.0%):</text>
  <text x="370" y="460" font-family="'Courier New', monospace" font-size="13" fill="#2d2e2b" text-anchor="end">$3.40</text>
  
  <text x="180" y="480" font-family="'Courier New', monospace" font-size="13" fill="#2d2e2b" text-anchor="end">Service Charge/Gratuity:</text>
  <text x="370" y="480" font-family="'Courier New', monospace" font-size="13" fill="#2d2e2b" text-anchor="end">$6.00</text>
  
  <text x="180" y="510" font-family="'Courier New', monospace" font-size="16" font-weight="900" fill="#1b1c1a" text-anchor="end">Total Paid:</text>
  <text x="370" y="510" font-family="'Courier New', monospace" font-size="18" font-weight="900" fill="#1b1c1a" text-anchor="end">$47.15</text>
  
  <!-- Divider -->
  <text x="200" y="540" font-family="'Courier New', monospace" font-size="14" fill="#4a4b45" text-anchor="middle">- - - - - - - - - - - - - - - - - -</text>
  
  <!-- Payment details -->
  <text x="200" y="562" font-family="'Courier New', monospace" font-size="11" fill="#4a4b45" text-anchor="middle">Payment: Charge Visa ending in *9821</text>
  <text x="200" y="578" font-family="'Courier New', monospace" font-size="11" fill="#4a4b45" text-anchor="middle">Thank You! Please Visit Us Again!</text>
</svg>`;

export const SAMPLE_CARD_SVG = `<svg viewBox="0 0 600 350" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Minimalist Premium Gradient Business Card -->
  <defs>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
  </defs>

  <rect width="600" height="350" fill="url(#cardGrad)" rx="16"/>
  <rect x="25" y="25" width="550" height="300" fill="none" stroke="#2a2f44" stroke-width="1.5" rx="12"/>
  
  <!-- Tech Pattern circles -->
  <circle cx="500" cy="80" r="100" fill="none" stroke="#22d3ee" stroke-opacity="0.08" stroke-width="1"/>
  <circle cx="500" cy="80" r="70" fill="none" stroke="#818cf8" stroke-opacity="0.05" stroke-width="1.5"/>
  <circle cx="500" cy="80" r="40" fill="none" stroke="#22d3ee" stroke-opacity="0.1" stroke-width="2"/>
  
  <!-- Logo Icon -->
  <g transform="translate(60, 60)">
    <polygon points="12,0 24,10 24,28 12,38 0,28 0,10" fill="url(#accentGrad)" opacity="0.9"/>
    <circle cx="12" cy="19" r="6" fill="#ffffff"/>
  </g>
  
  <!-- Company Brand -->
  <text x="100" y="82" font-family="'Outfit', 'Inter', sans-serif" font-size="20" font-weight="800" fill="#ffffff" letter-spacing="1.5">HYPERION AI</text>
  <text x="100" y="98" font-family="'Inter', sans-serif" font-size="10" font-weight="600" fill="#22d3ee" letter-spacing="3">DEEP LEARNING SYSTEMS</text>
  
  <!-- Name and Title -->
  <text x="60" y="180" font-family="'Outfit', 'Inter', sans-serif" font-size="30" font-weight="800" fill="url(#accentGrad)">Julian Vance</text>
  <text x="60" y="205" font-family="'Inter', sans-serif" font-size="13" font-weight="500" fill="#94a3b8" letter-spacing="1">Director of Machine Learning &amp; Autonomy</text>
  
  <line x1="60" y1="225" x2="350" y2="225" stroke="url(#accentGrad)" stroke-width="2"/>
  
  <!-- Contact Info Details -->
  <!-- Email -->
  <g transform="translate(60, 245)">
    <text font-family="'Inter', sans-serif" font-size="11" font-weight="600" fill="#94a3b8">Email:</text>
    <text x="50" font-family="'Inter', sans-serif" font-size="12" font-weight="700" fill="#e2e8f0">julian.vance@hyperion.ai</text>
  </g>
  <!-- Telephone -->
  <g transform="translate(60, 267)">
    <text font-family="'Inter', sans-serif" font-size="11" font-weight="600" fill="#94a3b8">Phone:</text>
    <text x="50" font-family="'Inter', sans-serif" font-size="12" font-weight="700" fill="#e2e8f0">+1 (415) - 555-0182</text>
  </g>
  <!-- Website / Address -->
  <g transform="translate(60, 289)">
    <text font-family="'Inter', sans-serif" font-size="11" font-weight="600" fill="#94a3b8">Office:</text>
    <text x="50" font-family="'Inter', sans-serif" font-size="12" font-weight="700" fill="#e2e8f0">160 Autopilot Center, Suite 400, San Francisco, CA</text>
  </g>
</svg>`;

export const SAMPLE_LICENSE_SVG = `<svg viewBox="0 0 600 350" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Mock Driver License Card -->
  <rect width="600" height="350" fill="#f0fdf4" rx="16" stroke="#bbf7d0" stroke-width="4"/>
  
  <!-- Security watermark mesh -->
  <path d="M 0,150 Q 150,50 300,150 T 600,150 M 0,200 Q 150,100 300,200 T 600,200" fill="none" stroke="#86efac" stroke-width="1" stroke-dasharray="4,4" opacity="0.3"/>
  
  <!-- Card Header -->
  <rect x="4" y="4" width="592" height="75" fill="#15803d" rx="12"/>
  <text x="30" y="38" font-family="'Inter', sans-serif" font-size="18" font-weight="800" fill="#ffffff">AURA STATE OF FREEDOM</text>
  <text x="30" y="58" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#a7f3d0">DRIVER LICENSE &amp; IDENTITY</text>
  
  <text x="570" y="48" font-family="'Inter', sans-serif" font-size="24" font-weight="900" fill="#ffffff" stroke="#14532d" stroke-width="1.5" text-anchor="end">USA</text>
  
  <!-- Identity avatar placeholder framing -->
  <rect x="30" y="105" width="130" height="170" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <!-- Minimal SVG silhouette representing holder face -->
  <g transform="translate(30, 105)">
    <circle cx="65" cy="70" r="28" fill="#94a3b8"/>
    <path d="M 15,160 C 20,110 110,110 115,160 Z" fill="#475569"/>
    <text x="65" y="165" font-family="'Inter', sans-serif" font-size="10" font-weight="700" fill="#cbd5e1" text-anchor="middle">SECURE ID</text>
  </g>
  <text x="95" y="295" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#15803d" text-anchor="middle">REGISTERED GENAI</text>
  
  <!-- License numbers -->
  <text x="190" y="115" font-family="'Inter', sans-serif" font-size="12" font-weight="700" fill="#ea580c">DL NUMBER: AQ-442819-09</text>
  <text x="190" y="140" font-family="'Inter', sans-serif" font-size="10" font-weight="700" fill="#64748b">1. LAST NAME (SURNAME):</text>
  <text x="190" y="158" font-family="'Inter', sans-serif" font-size="16" font-weight="800" fill="#0f172a">VANCE-MITCHELL</text>
  
  <text x="190" y="180" font-family="'Inter', sans-serif" font-size="10" font-weight="700" fill="#64748b">2. GIVEN NAMES:</text>
  <text x="190" y="196" font-family="'Inter', sans-serif" font-size="15" font-weight="800" fill="#0f172a">EVANGELINE RAE</text>
  
  <text x="190" y="218" font-family="'Inter', sans-serif" font-size="10" font-weight="700" fill="#64748b">8. PHYSICAL ADDRESS:</text>
  <text x="190" y="234" font-family="'Inter', sans-serif" font-size="13" font-weight="700" fill="#334155">450 Redwood Heights, Suite 120, Eureka, CA 95501</text>
  
  <!-- Technical info row -->
  <!-- Col 1 -->
  <g transform="translate(190, 255)">
    <text font-family="'Inter', sans-serif" font-size="9" font-weight="700" fill="#64748b">3. DOB (DATE OF BIRTH)</text>
    <text y="16" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#0f172a">11/14/1993</text>
  </g>
  
  <!-- Col 2 -->
  <g transform="translate(325, 255)">
    <text font-family="'Inter', sans-serif" font-size="9" font-weight="700" fill="#64748b">4a. ISSUE DATE</text>
    <text y="16" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#0f172a">01/01/2024</text>
  </g>
  
  <!-- Col 3 -->
  <g transform="translate(435, 255)">
    <text font-family="'Inter', sans-serif" font-size="9" font-weight="700" fill="#64748b">4b. EXPIRY DATE</text>
    <text y="16" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#ea580c">11/14/2034</text>
  </g>

  <!-- Col 4 -->
  <g transform="translate(540, 255)">
    <text font-family="'Inter', sans-serif" font-size="9" font-weight="700" fill="#64748b">SEX</text>
    <text y="16" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#0f172a">F</text>
  </g>

  <!-- Footer security line -->
  <line x1="190" y1="290" x2="570" y2="290" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="190" y="310" font-family="'Inter', sans-serif" font-size="10" font-weight="600" fill="#475569">Class: C (Standard Motor Car Systems)</text>
  <text x="390" y="310" font-family="'Inter', sans-serif" font-size="10" font-weight="600" fill="#475569">Restrictions: NONE</text>
  <text x="570" y="310" font-family="'Inter', sans-serif" font-size="10" font-weight="700" fill="#15803d" text-anchor="end">DONOR: YES</text>
</svg>`;

export const DOCUMENT_SAMPLES: DocumentSample[] = [
  {
    id: "invoice-sample",
    name: "Standard Invoice",
    preset: "invoice",
    mimeType: "image/svg+xml",
    description: "Multi-item technology services invoice with tax and due-date details.",
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(SAMPLE_INVOICE_SVG)}`,
  },
  {
    id: "receipt-sample",
    name: "Star Cafe Receipt",
    preset: "receipt",
    mimeType: "image/svg+xml",
    description: "Retail cafe transaction voucher listing multiple food and drink customizations.",
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(SAMPLE_RECEIPT_SVG)}`,
  },
  {
    id: "business-card-sample",
    name: "Julian Vance Card",
    preset: "business_card",
    mimeType: "image/svg+xml",
    description: "Premium technology startup contact information card with title and social listings.",
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(SAMPLE_CARD_SVG)}`,
  },
  {
    id: "license-sample",
    name: "Evelyn Vance Driver License",
    preset: "id_card",
    mimeType: "image/svg+xml",
    description: "Driver identity documentation including DOB, sex, expiry calendar, and issue date.",
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(SAMPLE_LICENSE_SVG)}`,
  }
];
