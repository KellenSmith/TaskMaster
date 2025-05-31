"use client";

import {
    startTransition,
    useActionState,
    useEffect,
    useState,
    useMemo,
    MouseEvent,
    ChangeEvent,
} from "react";
import { getTextContent, updateTextContent } from "../lib/text-content-actions";
import { defaultActionState, FormActionState } from "./form/Form";
import {
    CircularProgress,
    IconButton,
    Popover,
    Stack,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import { useUserContext } from "../context/UserContext";
import RichTextField from "./form/RichTextField";
import { isUserAdmin } from "../lib/definitions";
import { Cancel, Check, Edit } from "@mui/icons-material";

interface TextContentProps {
    id: string;
    richText?: boolean;
}

const TextContent = ({ id, richText = false }: TextContentProps) => {
    const theme = useTheme();
    const { user, language } = useUserContext();
    const [editMode, setEditMode] = useState(false);
    const [popoverAnchor, setPopoverAnchor] = useState<null | HTMLElement>(null);
    const [editedTextContent, setEditedTextContent] = useState<string>("");
    const handlePopoverClose = () => {
        !editMode && setPopoverAnchor(null);
    };

    const fetchTextContent = async (
        currentActionState: FormActionState,
    ): Promise<FormActionState> => getTextContent(currentActionState, id, language);
    const [fetchTextContentState, fetchTextContentAction, isTextContentLoading] = useActionState(
        fetchTextContent,
        defaultActionState,
    );
    const updateTextContentAction = () => {
        startTransition(async () => {
            const result = await updateTextContent(
                defaultActionState,
                id,
                language,
                editedTextContent,
            );
            if (result.status === 200) {
                setEditMode(false);
                startTransition(() => {
                    fetchTextContentAction();
                });
            }
        });
        handlePopoverClose();
    };

    const hoverProps = useMemo<Object>(() => {
        if (isUserAdmin(user))
            return {
                onMouseEnter: (event: MouseEvent<HTMLElement>) => {
                    setPopoverAnchor(event.currentTarget);
                },
            };
        return {};
    }, [user]);

    useEffect(() => {
        startTransition(() => {
            fetchTextContentAction();
        });
        // Fetch the text content when the component mounts
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleEditMode = () => {
        setEditedTextContent(fetchTextContentState.result);
        setEditMode((prev) => !prev);
    };

    const getTextComponent = () => {
        if (fetchTextContentState.status === 500) {
            return (
                <Typography textAlign="center" color={theme.palette.text.primary} variant="h5">
                    Text content not found
                </Typography>
            );
        }
        if (richText) {
            return (
                <RichTextField
                    fieldId={id}
                    editMode={editMode}
                    value={fetchTextContentState.result}
                    changeFieldValue={(_, newContent) => setEditedTextContent(newContent)}
                />
            );
        }
        if (editMode)
            return (
                <TextField
                    value={editedTextContent}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        setEditedTextContent(event.target.value);
                    }}
                />
            );
        return <Typography>{fetchTextContentState.result}</Typography>;
    };

    return (
        <>
            <Stack padding={2} {...hoverProps}>
                {isTextContentLoading ? <CircularProgress /> : getTextComponent()}
                <Popover
                    id={id}
                    open={!!popoverAnchor}
                    anchorEl={popoverAnchor}
                    onClose={handlePopoverClose}
                    anchorOrigin={{
                        vertical: "top",
                        horizontal: "right",
                    }}
                    onMouseLeave={handlePopoverClose}
                    disableEnforceFocus
                    sx={{
                        pointerEvents: "none",
                        "& .MuiPopover-paper": {
                            pointerEvents: "auto",
                        },
                    }}
                >
                    <Stack direction="row">
                        {editMode && (
                            <IconButton onClick={updateTextContentAction}>
                                <Check />
                            </IconButton>
                        )}
                        <IconButton onClick={toggleEditMode}>
                            {editMode ? <Cancel /> : <Edit />}
                        </IconButton>
                    </Stack>
                </Popover>
            </Stack>
        </>
    );
};

export default TextContent;
