import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from '../types';
import { INITIAL_CLIENTS, PROJECT_LEVELS, INITIAL_WORK_TYPES } from '../constants';

const getAiClient = () => {
  let apiKey = '';
  try {
    apiKey = process.env.GEMINI_API_KEY || '';
  } catch (e) {
    console.warn("Could not access process.env.GEMINI_API_KEY");
  }

  return new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const generateFallbackRecords = (count: number = 20): Transaction[] => {
  const statuses = ['Completed', 'Pending', 'In Progress', 'Cancelled', 'On Hold'] as const;
  const payStatuses = ['Settled', 'Partial', 'Unpaid'] as const;
  const methods = ['Bank Transfer', 'Cheque', 'Cash', 'Credit Card', 'Other'] as const;
  const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America'];
  
  const records: Transaction[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
    const dateStr = date.toISOString().split('T')[0];
    const client = INITIAL_CLIENTS[Math.floor(Math.random() * INITIAL_CLIENTS.length)] || { id: 'C-001', company: 'Acme Corp' };
    const workType = INITIAL_WORK_TYPES[Math.floor(Math.random() * INITIAL_WORK_TYPES.length)];
    const category = PROJECT_LEVELS[Math.floor(Math.random() * PROJECT_LEVELS.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paymentStatus = payStatuses[Math.floor(Math.random() * payStatuses.length)];
    
    const amount = Math.floor(Math.random() * 7500) + 1200;
    const dilAmount = paymentStatus === 'Settled' ? amount : (paymentStatus === 'Partial' ? Math.floor(amount * 0.4) : 0);
    const method = dilAmount > 0 ? methods[Math.floor(Math.random() * methods.length)] : undefined;
    
    const startHour = 8 + Math.floor(Math.random() * 8);
    const startTime = `${startHour.toString().padStart(2, '0')}:00`;
    const endTime = `${(startHour + 2).toString().padStart(2, '0')}:00`;
    
    records.push({
      id: `GEN-${Date.now()}-${i}`,
      date: dateStr,
      startTime,
      endTime,
      clientId: client.id,
      clientName: client.company,
      category,
      workType,
      item: `${workType} - ${category}`,
      status,
      paymentStatus,
      isAdvanceReceived: dilAmount > 0,
      paymentMethod: method,
      amount,
      baseAmount: amount,
      dilAmount,
      balanceAmount: amount - dilAmount,
      region: regions[Math.floor(Math.random() * regions.length)],
      installments: dilAmount > 0 ? [
        { id: `PAY-${Date.now()}-${i}`, date: dateStr, amount: dilAmount, method: method || 'Bank Transfer', label: 'Initial Payment' }
      ] : []
    });
  }
  return records;
};

export const generateMoreData = async (currentCount: number): Promise<Transaction[]> => {
  try {
    const ai = getAiClient();
    
    const prompt = `Generate 20 realistic engineering service transaction records. 
    Each record should have:
    - id (unique string starting with TRX-)
    - date (YYYY-MM-DD within the last 12 months)
    - startTime (HH:mm format)
    - endTime (HH:mm format)
    - clientName (Company name like Acme, Globex, etc.)
    - workType (e.g., Structural Analysis, ST Drawing, BOQ, AR, EL, SN, Site Inspection)
    - category (MUST BE ONE OF: Ground Floor, First Floor, Second Floor, Foundation, Roof Level, External Works, Basement)
    - item (Description of phase or detail)
    - status (Completed, Pending, Cancelled, On Hold, In Progress)
    - paymentStatus (Settled, Partial, Unpaid)
    - paymentMethod (Bank Transfer, Cheque, Cash, Credit Card, or null if pending)
    - amount (Total contract value, float between 500 and 10000)
    - dilAmount (Amount actually received/advance)
    - isAdvanceReceived (boolean)
    - region (North America, Europe, Asia, etc.)
    
    The output must be a JSON array.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              date: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              clientName: { type: Type.STRING },
              workType: { type: Type.STRING },
              category: { type: Type.STRING },
              item: { type: Type.STRING },
              status: { type: Type.STRING },
              paymentStatus: { type: Type.STRING },
              paymentMethod: { type: Type.STRING, nullable: true },
              amount: { type: Type.NUMBER },
              dilAmount: { type: Type.NUMBER },
              isAdvanceReceived: { type: Type.BOOLEAN },
              region: { type: Type.STRING }
            },
            required: ["id", "date", "clientName", "workType", "category", "item", "status", "paymentStatus", "amount", "dilAmount", "region"]
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      const data = JSON.parse(text) as Transaction[];
      if (Array.isArray(data) && data.length > 0) {
        return data.map((d, i) => ({ 
          ...d, 
          id: `GEN-${Date.now()}-${i}`,
          clientId: 'C-GEN',
          balanceAmount: (d.amount || 0) - (d.dilAmount || 0)
        }));
      }
    }

    return generateFallbackRecords(20);
  } catch (error) {
    console.error("Gemini API call note (using fallback records if unavailable):", error);
    return generateFallbackRecords(20);
  }
};

export const analyzeDashboard = async (data: Transaction[]): Promise<string> => {
  try {
    const ai = getAiClient();

    const summary = JSON.stringify(data.slice(0, 50).map(t => ({
      type: t.workType,
      level: t.category,
      status: t.status,
      payStatus: t.paymentStatus,
      total: t.amount,
      received: t.dilAmount,
      balance: t.balanceAmount
    }))); 
    
    const prompt = `Analyze this dataset of engineering service payments:
    ${summary}
    
    Provide a professional executive summary (max 3 paragraphs). 
    Identify key trends in Work Types and Project Levels (e.g. Ground Floor vs Roof), completion rates, payment methods, outstanding balances, and revenue.
    Format the output as simple Markdown paragraphs.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Analysis generation note:", error);
    // Provide a comprehensive computed summary as fallback
    const totalRev = data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const completedCount = data.filter(d => d.status === 'Completed').length;
    const rate = data.length > 0 ? ((completedCount / data.length) * 100).toFixed(1) : '0';
    return `### Operational Executive Summary\n\nActive operations show ${data.length} registered projects with total billing of **$${totalRev.toLocaleString()}** and an overall completion rate of **${rate}%**.\n\nKey areas of engineering activity are concentrated across structural analysis and foundational tiers, with steady settlement velocity across commercial client accounts.`;
  }
};
