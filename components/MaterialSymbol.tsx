import { Text, TextStyle } from "react-native";

interface MaterialSymbolProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle;
}

export const MaterialSymbol = ({
    name,
    size = 24,
    color,
    style,
}: MaterialSymbolProps) => (
    <Text
        style={[
            {
                fontFamily: "MaterialSymbolsRounded", // Используем только этот шрифт для индекса
                fontSize: size,
                color: color,
                textAlign: "center",
                textAlignVertical: "center",
                includeFontPadding: false,
            },
            style,
        ]}
    >
        {name}
    </Text>
);
