"use client";
import { Divider, Stack } from "@mui/material";
import { Prisma } from "@prisma/client";
import { use } from "react";
import { userHasSkillBadge } from "../../ui/utils";
import { useUserContext } from "../../context/UserContext";
import SkillBadgeCard from "../skill_badges/SkillBadgeCard";

interface SkillBadgesTabProps {
    skillBadgesPromise: Promise<Prisma.SkillBadgeGetPayload<true>[]>;
}

const SkillBadgesTab = ({ skillBadgesPromise }: SkillBadgesTabProps) => {
    const { user } = useUserContext();
    const skillBadges = use(skillBadgesPromise);

    const getSortedSkillBadges = () => {
        return skillBadges.sort((a, b) => {
            if (userHasSkillBadge(user, a.id)) {
                if (userHasSkillBadge(user, b.id)) {
                    return a.name.localeCompare(b.name);
                }
                return -1;
            }
            if (userHasSkillBadge(user, b.id)) return 1;
            return a.name.localeCompare(b.name);
        });
    };
    return (
        <Stack direction="row" justifyContent="space-around" flexWrap="wrap" gap={2}>
            {getSortedSkillBadges().map((badge) => {
                return (
                    <Stack key={badge.id} spacing={1}>
                        <SkillBadgeCard
                            badge={badge}
                            greyedOut={!userHasSkillBadge(user, badge.id)}
                        />
                        <Stack spacing={1} maxWidth={250}>
                            <Divider />
                        </Stack>
                    </Stack>
                );
            })}
        </Stack>
    );
};

export default SkillBadgesTab;
