import { useTheme } from "@mui/material";
import {
    MenuButtonBold,
    MenuButtonBulletedList,
    MenuButtonEditLink,
    MenuButtonHighlightColor,
    MenuButtonIndent,
    MenuButtonItalic,
    MenuButtonOrderedList,
    MenuButtonStrikethrough,
    MenuButtonTextColor,
    MenuButtonUnderline,
    MenuButtonUnindent,
    MenuControlsContainer,
    MenuDivider,
    MenuSelectHeading,
    MenuSelectTextAlign,
    isTouchDevice,
} from "mui-tiptap";

const RichTextFieldControls = () => {
    const theme = useTheme();
    return (
        <MenuControlsContainer>
            <MenuSelectHeading />

            <MenuDivider />

            <MenuButtonBold />

            <MenuButtonItalic />

            <MenuButtonUnderline />

            <MenuButtonStrikethrough />

            <MenuDivider />

            <MenuButtonTextColor
                defaultTextColor={theme.palette.text.primary}
                swatchColors={[
                    { value: "#000000", label: "Black" },
                    { value: "#ffffff", label: "White" },
                    { value: "#888888", label: "Grey" },
                    { value: "#ff0000", label: "Red" },
                    { value: "#ff9900", label: "Orange" },
                    { value: "#ffff00", label: "Yellow" },
                    { value: "#00d000", label: "Green" },
                    { value: theme.palette.primary.main, label: "Primary" },
                ]}
            />

            <MenuButtonHighlightColor
                swatchColors={[
                    { value: theme.palette.primary.main, label: "Primary" },
                    { value: "#dddddd", label: "Light grey" },
                    { value: "#ffa6a6", label: "Light red" },
                    { value: "#ffd699", label: "Light orange" },
                    // Plain yellow matches the browser default `mark` like when using Cmd+Shift+H
                    { value: "#ffff00", label: "Yellow" },
                    { value: "#99cc99", label: "Light green" },
                    { value: "#90c6ff", label: "Light blue" },
                    { value: "#8085e9", label: "Light purple" },
                ]}
            />

            <MenuDivider />

            <MenuButtonEditLink />

            <MenuDivider />

            <MenuSelectTextAlign />

            <MenuDivider />

            <MenuButtonOrderedList />

            <MenuButtonBulletedList />

            {/* On touch devices, we'll show indent/unindent buttons, since they're
      unlikely to have a keyboard that will allow for using Tab/Shift+Tab. These
      buttons probably aren't necessary for keyboard users and would add extra
      clutter. */}
            {isTouchDevice() && (
                <>
                    <MenuButtonIndent />
                    <MenuButtonUnindent />
                </>
            )}
        </MenuControlsContainer>
    );
};

export default RichTextFieldControls;
