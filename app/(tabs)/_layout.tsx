import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

export default function TabLayout() {
    const theme = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: "absolute",
                    borderTopLeftRadius: 36,
                    borderTopRightRadius: 36,
                    backgroundColor: theme.colors.elevation.level2,
                    borderTopWidth: 0,

                    paddingTop: 16,
                    height: 104,
                    paddingBottom: 12,

                    elevation: 0,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                },
                tabBarActiveTintColor: theme.colors.onSurface,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                tabBarLabelStyle: {
                    fontWeight: "700",
                    fontSize: 12,
                    marginTop: 4, // Отступ между таблеткой и текстом
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarLabel: "Дневник",
                    tabBarIcon: ({ focused, color }) => (
                        <View
                            style={{
                                // Стандартные размеры активного индикатора M3
                                width: 64,
                                height: 32,
                                backgroundColor: focused
                                    ? theme.colors.secondaryContainer
                                    : "transparent",
                                borderRadius: 16,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Icon
                                name={focused ? "notebook" : "notebook-outline"}
                                size={24}
                                color={
                                    focused
                                        ? theme.colors.onSecondaryContainer
                                        : color
                                }
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="recipes"
                options={{
                    tabBarLabel: "Идеи",
                    tabBarIcon: ({ focused, color }) => (
                        <View
                            style={{
                                width: 64,
                                height: 32,
                                backgroundColor: focused
                                    ? theme.colors.secondaryContainer
                                    : "transparent",
                                borderRadius: 16,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Icon
                                name={
                                    focused
                                        ? "lightbulb-on"
                                        : "lightbulb-outline"
                                }
                                size={24}
                                color={
                                    focused
                                        ? theme.colors.onSecondaryContainer
                                        : color
                                }
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="kitchen"
                options={{
                    tabBarLabel: "Кухня",
                    tabBarIcon: ({ focused, color }) => (
                        <View
                            style={{
                                width: 64,
                                height: 32,
                                backgroundColor: focused
                                    ? theme.colors.secondaryContainer
                                    : "transparent",
                                borderRadius: 16,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Icon
                                name={focused ? "fridge" : "fridge-outline"}
                                size={24}
                                color={
                                    focused
                                        ? theme.colors.onSecondaryContainer
                                        : color
                                }
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="goal"
                options={{
                    tabBarLabel: "Цели",
                    tabBarIcon: ({ focused, color }) => (
                        <View
                            style={{
                                width: 64,
                                height: 32,
                                backgroundColor: focused
                                    ? theme.colors.secondaryContainer
                                    : "transparent",
                                borderRadius: 16,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Icon
                                name={focused ? "compass" : "compass-outline"}
                                size={24}
                                color={
                                    focused
                                        ? theme.colors.onSecondaryContainer
                                        : color
                                }
                            />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}
