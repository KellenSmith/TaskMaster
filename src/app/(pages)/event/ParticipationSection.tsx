import { Button, Stack, Typography } from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { useUserContext } from "../../context/UserContext";
import { addEventReserve } from "../../lib/event-actions";
import { startTransition, useActionState } from "react";
import { getFormActionMsg } from "../../ui/form/Form";
import { defaultFormActionState, FormActionState, isUserHost } from "../../lib/definitions";
import { isUserParticipant } from "./event-utils";

const ParticipationSection = ({ event, fetchEventAction, setOpenTab }) => {
    const { user } = useUserContext();

    const actAndUpdateEvent = (buttonAction: Function) => {
        startTransition(() => {
            buttonAction();
            fetchEventAction();
        });
    };

    const appendUserEventData = (serverAction: Function) => {
        return (currentActionState: FormActionState) =>
            serverAction(user[GlobalConstants.ID], event[GlobalConstants.ID], currentActionState);
    };

    const [reserveActionState, reserveAction, isReservePending] = useActionState(
        appendUserEventData(addEventReserve),
        defaultFormActionState,
    );

    const findReserveUserIndexById = () => {
        return event[GlobalConstants.RESERVE_USERS].findIndex(
            (reserve) => reserve[GlobalConstants.USER_ID] === user[GlobalConstants.ID],
        );
    };

    const isUserReserve = () => findReserveUserIndexById() > -1;
    const getNParticipants = () => event[GlobalConstants.PARTICIPANT_USERS].length;
    const isEventSoldOut = () => getNParticipants() >= event[GlobalConstants.MAX_PARTICIPANTS];

    const getParticipantsText = () => {
        let participantsText = `Participants: ${getNParticipants()}`;
        if (isEventSoldOut()) participantsText += " (sold out)";
        return participantsText;
    };

    const getContent = () => {
        if (isUserHost(user, event)) return;
        if (isUserParticipant(user, event))
            return <Typography color="primary">You have a ticket. See you there!</Typography>;
        if (isUserReserve())
            return (
                <Typography color="primary" maxWidth="25%">
                    {`You are #${findReserveUserIndexById() + 1} on the reserve list. We'll let you know when a spot opens up.`}
                </Typography>
            );
        if (isEventSoldOut())
            return (
                <Button
                    disabled={isReservePending}
                    onClick={() => actAndUpdateEvent(reserveAction)}
                >
                    get on reserve list
                </Button>
            );
    };

    return (
        <>
            <Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="primary">{getParticipantsText()}</Typography>
                    {getContent()}
                </Stack>
                {getFormActionMsg(reserveActionState)}
            </Stack>
        </>
    );
};

export default ParticipationSection;
