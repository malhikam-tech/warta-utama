import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || "" 
});

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  author: string;
  date: string;
  imageKeyword: string;
  imageUrl?: string;
  sources?: { uri: string; title: string }[];
}

export async function fetchNews(category: string = "Umum"): Promise<NewsArticle[]> {
  const prompt = `Cari dan buatkan 6 artikel berita nyata, faktual, dan akurat yang sedang terjadi hari ini (28 Februari 2026) untuk kategori: ${category}. 
  Gunakan Google Search untuk mendapatkan data peristiwa asli.
  Setiap artikel harus memiliki:
  - id (string unik)
  - title (judul berita nyata yang sedang hangat dalam Bahasa Indonesia)
  - summary (ringkasan faktual dalam Bahasa Indonesia)
  - content (artikel mendalam berdasarkan fakta asli dalam Bahasa Indonesia)
  - category (kategori yang diminta)
  - author (nama jurnalis asli atau realistis)
  - date (28 Feb 2026)
  - imageKeyword (2-3 kata kunci Bahasa Inggris yang sangat spesifik untuk mencari foto jurnalistik asli di loremflickr, contoh: "jakarta-flood-2026", "indonesia-economy-growth", "tech-conference-asia")

  Kembalikan hasilnya dalam format JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              content: { type: Type.STRING },
              category: { type: Type.STRING },
              author: { type: Type.STRING },
              date: { type: Type.STRING },
              imageKeyword: { type: Type.STRING },
            },
            required: ["id", "title", "summary", "content", "category", "author", "date", "imageKeyword"],
          },
        },
      },
    });

    const articles: NewsArticle[] = JSON.parse(response.text || "[]");
    
    // Extract grounding sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks
      ? groundingChunks
          .filter(chunk => chunk.web)
          .map(chunk => ({
            uri: chunk.web!.uri,
            title: chunk.web!.title
          }))
      : [];

    return articles.map(article => ({
      ...article,
      sources,
      // Use loremflickr with 'news' tag and the specific keyword for more "real" journalistic photos
      imageUrl: `https://loremflickr.com/1200/800/news,${article.imageKeyword.replace(/\s+/g, ',')}`
    }));
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

export async function searchNews(query: string): Promise<NewsArticle[]> {
  const prompt = `Cari informasi faktual dan buatkan 5 artikel berita nyata terkait: "${query}". 
  Pastikan data akurat dan berasal dari peristiwa asli menggunakan Google Search.
  Setiap artikel harus memiliki:
  - id (string unik)
  - title (judul berita nyata dalam Bahasa Indonesia)
  - summary (ringkasan fakta dalam Bahasa Indonesia)
  - content (artikel detail dalam Bahasa Indonesia)
  - category (kategori sesuai)
  - author (nama jurnalis)
  - date (28 Feb 2026)
  - imageKeyword (kata kunci Bahasa Inggris spesifik untuk foto jurnalistik asli)

  Kembalikan hasil dalam JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              content: { type: Type.STRING },
              category: { type: Type.STRING },
              author: { type: Type.STRING },
              date: { type: Type.STRING },
              imageKeyword: { type: Type.STRING },
            },
            required: ["id", "title", "summary", "content", "category", "author", "date", "imageKeyword"],
          },
        },
      },
    });

    const articles: NewsArticle[] = JSON.parse(response.text || "[]");
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks
      ? groundingChunks
          .filter(chunk => chunk.web)
          .map(chunk => ({
            uri: chunk.web!.uri,
            title: chunk.web!.title
          }))
      : [];

    return articles.map(article => ({
      ...article,
      sources,
      imageUrl: `https://loremflickr.com/1200/800/news,${article.imageKeyword.replace(/\s+/g, ',')}`
    }));
  } catch (error) {
    console.error("Error searching news:", error);
    return [];
  }
}

export async function generateDailySummary(articles: NewsArticle[]): Promise<string> {
  const titles = articles.slice(0, 5).map(a => a.title).join(", ");
  const prompt = `Buatkan ringkasan berita harian yang sangat singkat dan profesional untuk dikirim melalui email berdasarkan judul-judul berikut: ${titles}. 
  Gunakan gaya bahasa buletin berita yang elegan dan informatif dalam Bahasa Indonesia.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Tidak ada ringkasan tersedia.";
  } catch (error) {
    return "Gagal membuat ringkasan.";
  }
}
