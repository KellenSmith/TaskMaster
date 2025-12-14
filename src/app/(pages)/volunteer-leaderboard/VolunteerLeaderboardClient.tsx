"use client"
import { Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import LanguageTranslations from "./LanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import GlobalConstants from "../../GlobalConstants";
import { useRouter } from "next/navigation";
import { clientRedirect } from "../../lib/utils";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

interface VolunteerLeaderboardClientProps {
    assigneeVolunteerHours: {
        nickname: string;
        hours: number;
    }[];
    year: string;
}

const VolunteerLeaderboardClient: React.FC<VolunteerLeaderboardClientProps> = ({ assigneeVolunteerHours, year }) => {
    const { language } = useUserContext()
    const router = useRouter();

    const stepYear = (step: number) => {
        const newYear = (parseInt(year) + step).toString();
        clientRedirect(router, [GlobalConstants.VOLUNTEER_LEADERBOARD], { year: newYear });
    }

    return <Stack spacing={3} sx={{ maxWidth: 600, mx: 'auto', py: 4 }} justifyContent="center">
        <Typography variant="h4" component="h1">
            {LanguageTranslations[GlobalConstants.VOLUNTEER_LEADERBOARD][language]}
        </Typography>
        <Stack direction="row" justifyContent="space-around" >
            <Button onClick={() => stepYear(-1)}>
                <ChevronLeft />
                {LanguageTranslations.prev[language]}
            </Button>
            <Typography variant="h4" component="h1">
                {year}
            </Typography>
            <Button onClick={() => stepYear(1)}>
                {LanguageTranslations.next[language]}
                <ChevronRight />
            </Button>
        </Stack>
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{LanguageTranslations.rank[language]}</TableCell>
                        <TableCell>{LanguageTranslations.nickname[language]}</TableCell>
                        <TableCell align="right">{LanguageTranslations.hours[language]}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {assigneeVolunteerHours
                        .sort((a, b) => b.hours - a.hours)
                        .map((volunteer, index) => (
                            <TableRow key={volunteer.nickname} hover>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{volunteer.nickname}</TableCell>
                                <TableCell align="right">{volunteer.hours.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Stack>
};

export default VolunteerLeaderboardClient;
