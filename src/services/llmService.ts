import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    extractionSchema,
    getFoodAnalysisPrompt,
} from "../constants/geminiConfig"; // Вынесенные константы
import { storage, STORAGE_KEYS } from "../shared/store/storage";

export class LLMService {
    public async extractFoodData(textPrompt: string) {
        const apiKey = await storage.getString(STORAGE_KEYS.GEMINI_API_KEY);
        const modelName =
            (await storage.getString(STORAGE_KEYS.GEMINI_MODEL)) ||
            "gemini-2.5-flash";

        if (!apiKey) {
            throw new Error("API ключ не найден. Перейдите в настройки.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: extractionSchema,
            },
        });

        const finalPrompt = getFoodAnalysisPrompt(textPrompt);
        const result = await model.generateContent(finalPrompt);
        return JSON.parse(result.response.text());
    }

    public async generateEmbedding(text: string): Promise<number[]> {
        console.log(`[Embedding] 🔢 Генерация вектора для текста: "${text}"`);
        const apiKey = await storage.getString(STORAGE_KEYS.GEMINI_API_KEY);

        if (!apiKey) {
            throw new Error("API ключ не найден. Перейдите в настройки.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
            model: "gemini-embedding-2-preview",
        });

        try {
            const result = await model.embedContent(text);
            const vector = result.embedding.values;
            console.log(
                `[Embedding] ✅ Вектор успешно получен. Размерность: ${vector.length}`,
            );
            return vector;
        } catch (error) {
            console.error(
                "[Embedding] ❌ Ошибка API при получении вектора:",
                error,
            );
            throw error;
        }
    }

    public async fetchAvailableModels(apiKey: string) {
        const baseUrl = "https://generativelanguage.googleapis.com";
        const response = await fetch(`${baseUrl}/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.models
            .filter((m: any) => {
                if (!m.supportedGenerationMethods.includes("generateContent"))
                    return false;
                const name = m.name.toLowerCase();
                return !/(gemma|veo|lyria|imagen|embedding|aqa|tts|audio|robotics|computer-use|deep-research)/.test(
                    name,
                );
            })
            .map((m: any) => ({
                name: m.name.replace("models/", ""),
                displayName: m.displayName,
            }))
            .sort((a: any, b: any) => {
                const getVersion = (name: string) =>
                    parseFloat(name.match(/(\d+\.\d+)|(\d+)/)?.[0] || "0");
                if (getVersion(b.name) !== getVersion(a.name))
                    return getVersion(b.name) - getVersion(a.name);

                const getWeight = (name: string) =>
                    name.includes("pro") ? 2 : name.includes("flash") ? 1 : 0;
                return getWeight(b.name) - getWeight(a.name);
            });
    }
}

export const llmService = new LLMService();
