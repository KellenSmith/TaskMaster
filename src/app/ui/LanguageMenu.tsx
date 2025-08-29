import Image from "next/image";
import { Menu, MenuItem } from "@mui/material";
import { useMemo, useState } from "react";
import { Language } from "@prisma/client";
import { useUserContext } from "../context/UserContext";

const LanguageMenu = () => {
    const { language, setLanguage } = useUserContext();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openLanguageMenu = Boolean(anchorEl);
    const languageFlags = useMemo(
        () => ({
            [Language.english]: "/images/british-flag.svg",
            [Language.swedish]: "/images/swedish-flag.svg",
        }),
        [],
    );

    return (
        <>
            <Image
                src={languageFlags[language]}
                alt={`${language} flag`}
                width={24}
                height={24}
                onClick={(e) => setAnchorEl(e.currentTarget as HTMLElement)}
                style={{ cursor: "pointer", marginRight: 24 }}
            />
            <Menu
                anchorEl={anchorEl}
                open={openLanguageMenu}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
                {Object.values(Language).map((languageOption) => (
                    <MenuItem
                        key={languageOption}
                        selected={languageOption === language}
                        onClick={() => {
                            setLanguage(languageOption);
                            setAnchorEl(null);
                        }}
                    >
                        <Image
                            src={languageFlags[languageOption]}
                            alt={`${Language[languageOption]} flag`}
                            style={{ width: 24, height: 24, marginRight: 8 }}
                            width={24}
                            height={24}
                        />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default LanguageMenu;
