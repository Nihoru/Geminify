import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
    ActivityIndicator,
    Appbar,
    Button,
    List,
    RadioButton,
    Surface,
    Text,
    TextInput,
} from "react-native-paper";
import { fetchAvailableModels } from "../src/core/gemini"; // Проверь правильность пути
import { storage, STORAGE_KEYS } from "../src/shared/store/storage"; // Проверь правильность пути

export default function SettingsScreen() {
    const router = useRouter();

    const [apiKey, setApiKey] = useState("");
    const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
    const [models, setModels] = useState<
        { name: string; displayName: string }[]
    >([]);
    const [loadingModels, setLoadingModels] = useState(false);

    // Загрузка сохраненных настроек при открытии экрана
    useEffect(() => {
        const loadSettings = async () => {
            const savedKey = await storage.getString(
                STORAGE_KEYS.GEMINI_API_KEY,
            );
            const savedModel = await storage.getString(
                STORAGE_KEYS.GEMINI_MODEL,
            );

            if (savedModel) {
                setSelectedModel(savedModel);
            }

            if (savedKey) {
                setApiKey(savedKey);
                loadModels(savedKey); // Если ключ есть, сразу грузим список моделей
            }
        };
        loadSettings();
    }, []);

    const loadModels = async (key: string) => {
        setLoadingModels(true);
        try {
            const availableModels = await fetchAvailableModels(key);
            setModels(availableModels);
        } catch (e: any) {
            Alert.alert(
                "Ошибка",
                "Не удалось загрузить модели. Проверьте правильность API ключа и подключение к сети.",
            );
        } finally {
            setLoadingModels(false);
        }
    };

    const handleSaveKey = async () => {
        if (!apiKey.trim()) {
            Alert.alert("Ошибка", "Введите API ключ");
            return;
        }

        await storage.set(STORAGE_KEYS.GEMINI_API_KEY, apiKey.trim());

        // После сохранения ключа пытаемся подгрузить модели
        loadModels(apiKey.trim());
        Alert.alert("Успех", "API ключ сохранен!");
    };

    const handleSaveModel = async (modelName: string) => {
        setSelectedModel(modelName);
        await storage.set(STORAGE_KEYS.GEMINI_MODEL, modelName);
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Настройки ИИ" />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Карточка API ключа */}
                <Surface style={styles.card} elevation={1}>
                    <Text variant="titleMedium">Gemini API Ключ</Text>
                    <TextInput
                        mode="outlined"
                        value={apiKey}
                        onChangeText={setApiKey}
                        secureTextEntry
                        placeholder="AIzaSy..."
                        style={styles.input}
                    />
                    <Button
                        mode="contained"
                        onPress={handleSaveKey}
                        style={styles.button}
                    >
                        Сохранить ключ
                    </Button>
                </Surface>

                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Выбор модели
                </Text>

                {/* Блок со списком моделей */}
                {loadingModels ? (
                    <ActivityIndicator style={{ marginTop: 20 }} />
                ) : (
                    <Surface style={styles.card} elevation={1}>
                        <RadioButton.Group
                            onValueChange={handleSaveModel}
                            value={selectedModel}
                        >
                            {models.map((m) => (
                                <List.Item
                                    key={m.name}
                                    title={m.displayName}
                                    description={m.name}
                                    left={() => <RadioButton value={m.name} />}
                                    onPress={() => handleSaveModel(m.name)}
                                />
                            ))}
                        </RadioButton.Group>
                        {models.length === 0 && (
                            <Text style={styles.emptyText}>
                                Введите и сохраните рабочий API ключ, чтобы
                                загрузить список доступных моделей.
                            </Text>
                        )}
                    </Surface>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16 },
    card: { padding: 16, borderRadius: 16, marginBottom: 16 },
    input: { marginVertical: 8 },
    button: { marginTop: 8 },
    sectionTitle: { marginVertical: 12, marginLeft: 4 },
    emptyText: { textAlign: "center", opacity: 0.5, padding: 20 },
});
