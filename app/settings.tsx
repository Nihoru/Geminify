import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, TextInput as RNTextInput } from "react-native";
import {
    ActivityIndicator,
    Button,
    IconButton,
    RadioButton,
    Surface,
    Text,
    TouchableRipple,
    useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { llmService } from "../src/services/llmService";
import { storage, STORAGE_KEYS } from "../src/shared/store/storage";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import { InfoModal } from "../components/InfoModal";
import { MaterialSymbol } from "../components/MaterialSymbol";
import { UnifiedHeader } from "../components/UnifiedHeader";

export default function SettingsScreen() {
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [headerHeight, setHeaderHeight] = useState(insets.top + 64);
    const [apiKey, setApiKey] = useState("");
    const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
    const [models, setModels] = useState<
        { name: string; displayName: string }[]
    >([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [error, setError] = useState<Error | string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);

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
                loadModels(savedKey);
            }
        };
        loadSettings();
    }, []);

    const loadModels = async (key: string): Promise<boolean> => {
        setLoadingModels(true);
        setError(null);
        try {
            const availableModels = await llmService.fetchAvailableModels(key);
            setModels(availableModels);
            return true;
        } catch (e: any) {
            setError(e);
            return false;
        } finally {
            setLoadingModels(false);
        }
    };

    const handleSaveKey = async () => {
        if (!apiKey.trim()) {
            setError("Введите API ключ");
            return;
        }

        const isSupported = await loadModels(apiKey.trim());
        
        if (isSupported) {
            await storage.set(STORAGE_KEYS.GEMINI_API_KEY, apiKey.trim());
            setSuccessMessage("API ключ успешно проверен и сохранен!");
        }
    };

    const handleSaveModel = async (modelName: string) => {
        setSelectedModel(modelName);
        await storage.set(STORAGE_KEYS.GEMINI_MODEL, modelName);
        setSuccessMessage(`Модель ${modelName} успешно выбрана!`);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <UnifiedHeader
                onHeightChange={setHeaderHeight}
                leftNode={
                    <View style={styles.headerRow}>
                        <View style={[styles.iconPod, { backgroundColor: theme.colors.primaryContainer }]}>
                            <IconButton
                                icon={(props) => <MaterialSymbol name="arrow_back" {...props} />}
                                iconColor={theme.colors.primary}
                                size={22}
                                onPress={() => router.back()}
                                style={styles.noMargin}
                            />
                        </View>
                        <Text variant="titleLarge" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                            Настройки ИИ
                        </Text>
                    </View>
                }
                rightNode={
                    <View style={[styles.iconPod, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <IconButton
                            icon={(props) => <MaterialSymbol name="help" {...props} />}
                            iconColor={theme.colors.onSurfaceVariant}
                            size={22}
                            onPress={() => setShowHelp(true)}
                            style={styles.noMargin}
                        />
                    </View>
                }
            />

            <ScrollView 
                contentContainerStyle={[
                    styles.content, 
                    { paddingTop: headerHeight + 16 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <Surface style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]} elevation={0}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>Gemini API Ключ</Text>
                    
                    <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surfaceVariant + '40' }]}>
                        <RNTextInput
                            style={[
                                styles.nativeInput,
                                {
                                    ...theme.fonts.bodyLarge,
                                    color: theme.colors.onSurface,
                                },
                            ]}
                            value={apiKey}
                            onChangeText={setApiKey}
                            secureTextEntry
                            placeholder="AIzaSy..."
                            placeholderTextColor={theme.colors.onSurfaceVariant + "70"}
                            cursorColor={theme.colors.primary}
                        />
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleSaveKey}
                        style={styles.button}
                        labelStyle={{ fontWeight: "700" }}
                    >
                        Сохранить и проверить
                    </Button>
                </Surface>

                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Выбор модели
                </Text>

                {loadingModels ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
                ) : (
                    <View style={styles.modelList}>
                        {models.map((m) => {
                            const isSelected = selectedModel === m.name;
                            return (
                                <TouchableRipple
                                    key={m.name}
                                    onPress={() => handleSaveModel(m.name)}
                                    style={{ borderRadius: 20, marginBottom: 8 }}
                                    borderless
                                >
                                    <View style={[
                                        styles.modelItem, 
                                        { 
                                            backgroundColor: isSelected 
                                                ? theme.colors.primaryContainer 
                                                : theme.colors.elevation.level1 
                                        }
                                    ]}>
                                        <RadioButton.Android
                                            value={m.name}
                                            status={isSelected ? 'checked' : 'unchecked'}
                                            onPress={() => handleSaveModel(m.name)}
                                            color={theme.colors.primary}
                                        />
                                        <View style={styles.modelItemContent}>
                                            <Text 
                                                variant="bodyLarge" 
                                                style={{ 
                                                    fontWeight: isSelected ? "700" : "600",
                                                    color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface
                                                }}
                                            >
                                                {m.displayName}
                                            </Text>
                                            <Text 
                                                variant="labelSmall" 
                                                style={{ 
                                                    color: isSelected ? theme.colors.onPrimaryContainer + '99' : theme.colors.onSurfaceVariant 
                                                }}
                                            >
                                                {m.name}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableRipple>
                            );
                        })}
                        
                        {models.length === 0 && (
                            <Surface style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]} elevation={0}>
                                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                                    Введите рабочий API ключ, чтобы загрузить список доступных моделей.
                                </Text>
                            </Surface>
                        )}
                    </View>
                )}
            </ScrollView>

            <ErrorModal
                visible={!!error}
                error={error}
                onDismiss={() => setError(null)}
            />
            <SuccessModal
                visible={!!successMessage}
                message={successMessage || ""}
                onDismiss={() => setSuccessMessage(null)}
            />
            <InfoModal
                visible={showHelp}
                title="Как получить ключ?"
                message="1. Войдите в свой Google аккаунт.\n2. Перейдите в Google AI Studio.\n3. Нажмите 'Get API key' в боковом меню.\n4. Создайте новый ключ (может потребоваться создать или выбрать проект Cloud).\n5. Скопируйте ключ, вставьте его в поле выше и сохраните."
                onDismiss={() => setShowHelp(false)}
                link={{
                    label: "Google AI Studio",
                    url: "https://aistudio.google.com/app/apikey"
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    headerTitle: {
        fontWeight: "700",
    },
    iconPod: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    noMargin: {
        margin: 0,
    },
    content: { 
        paddingHorizontal: 16, 
        paddingBottom: 32 
    },
    card: { 
        padding: 20, 
        borderRadius: 28, 
        marginBottom: 16 
    },
    inputWrapper: {
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginVertical: 16,
    },
    nativeInput: {
        padding: 0,
        fontSize: 16,
    },
    button: { 
        borderRadius: 16,
    },
    sectionTitle: { 
        marginVertical: 12, 
        marginLeft: 8,
        fontWeight: "700",
    },
    modelList: {
        gap: 0,
    },
    modelItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 20,
    },
    modelItemContent: {
        marginLeft: 4,
        flex: 1,
    },
    emptyText: { 
        textAlign: "center", 
        opacity: 0.7, 
        lineHeight: 20,
    },
});
