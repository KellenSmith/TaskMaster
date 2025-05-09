const testdata = {
    user: {
        id: "1234-5678-9abc-def0",
        firstName: "Johnnie",
        surName: "Doe",
        nickname: "johnniedoe123",
        pronoun: "they/them",
        email: "john.doe@example.com",
        phone: "+1-555-123-4567",
        created: new Date("2023-01-01T00:00:00Z"),
        membershipRenewed: new Date("2024-01-01T00:00:00Z"),
        consentToNewsletters: true,
        role: "user",
        hostingEvents: [],
        participantEvents: [],
        reserveEvents: [],
        assignedTasks: [],
        reporterTasks: [],
    },

    createUser: {
        firstName: "Johnnie",
        surName: "Doe",
        nickname: "johnniedoe123",
        pronoun: "they/them",
        email: "john.doe@example.com",
        phone: "+1-555-123-4567",
        consentToNewsletters: true,
    },

    userCredentials: {
        id: "cred-1234-5678",
        email: "john.doe@example.com",
        salt: "randomsalt123",
        hashedPassword: "hashedpassword456",
    },

    event: {
        id: "event-1234-5678",
        title: "Summer Coding Workshop",
        location: "Tech Hub, Downtown",
        startTime: new Date("2024-06-15T09:00:00Z"),
        endTime: new Date("2024-06-15T17:00:00Z"),
        description: "Learn coding basics in this one-day workshop",
        maxParticipants: 20,
        fullTicketPrice: 50,
        status: "published",
        hostId: "1234-5678-9abc-def0",
    },

    participantInEvent: {
        userId: "1234-5678-9abc-def0",
        eventId: "event-1234-5678",
    },

    reserveInEvent: {
        userId: "1234-5678-9abc-def0",
        eventId: "event-1234-5678",
        queueingSince: new Date("2024-01-15T12:00:00Z"),
    },

    task: {
        id: "task-1234-5678",
        eventId: "event-1234-5678",
        assigneeId: "1234-5678-9abc-def0",
        reporterId: "1234-5678-9abc-def0",
        phase: "before",
        name: "Prepare Workshop Materials",
        status: "in progress",
        tags: ["preparation", "documentation"],
        startTime: new Date("2024-06-14T09:00:00Z"),
        endTime: new Date("2024-06-14T17:00:00Z"),
        description: "Create and organize workshop materials for participants",
    },
};

export default testdata;
