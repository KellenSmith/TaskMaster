import { Button, Stack, Typography } from "@mui/material";
import GlobalConstants from "../../GlobalConstants";
import { useUserContext } from "../../context/UserContext";
import { addEventParticipant, addEventReserve } from "../../lib/event-actions";
import { startTransition, useActionState } from "react";
import { defaultActionState, FormActionState } from "../../ui/form/Form";
import { isUserHost } from "../../lib/definitions";

const ParticipationSection = ({ event, fetchEventAction }) => {
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

    const [participateActionState, participateAction, isParticipatePending] = useActionState(
        appendUserEventData(addEventParticipant),
        defaultActionState,
    );
    const [reserveActionState, reserveAction, isReservePending] = useActionState(
        appendUserEventData(addEventReserve),
        defaultActionState,
    );

    const isUserParticipant = () =>
        event[GlobalConstants.PARTICIPANT_USERS]
            .map((participant: any) => participant[GlobalConstants.USER_ID])
            .includes(user[GlobalConstants.ID]);

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
        if (isUserParticipant()) return <Typography color="primary">See you there!</Typography>;
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
        <Button
            disabled={isParticipatePending}
            onClick={() => actAndUpdateEvent(participateAction)}
        >
            participate
        </Button>;
    };

    return (
        <Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="primary">{getParticipantsText()}</Typography>
                {getContent()}
            </Stack>
            <Typography color="error">
                {participateActionState.errorMsg || reserveActionState.errorMsg}
            </Typography>
        </Stack>
    );
};

export default ParticipationSection;
