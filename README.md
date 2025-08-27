# TaskMaster

## TL:DR

Help me test the TaskMaster!
Play around as much as you like. Try to break it and tell me what else you want in there.

There are a few test accounts you can use. All accounts have password 123456

- admin@email.com
- eventHost@email.com
- eventParticipant@email.com
- eventVolunteer@email.com
- eventReserve@email.com
- pendingMembership@email.com
- expiredMembership@email.com

At the time of writing i've prepped the database with accounts, events a.s.o to show off what the TaskMaster can do. Feel free to change things around. I can easily reset the database.
The test accounts have been set up with various roles and permissions to help you explore the application. The event-related roles refer to the event "Test Event" happening on 2025-08-26 in the calendar.

The TaskMaster helps out by sending automatic emails related to events, orders, and user actions. The email will be sent to the address of the relevant user. If you want to test it, feel free to enter an email you have access to.

For payments, use the following test data:

- Swish: any phone number, e.g. +46 739000001
- Visa card number: 4761739001010416, expiry after the following month (today is 2025/08/25 so 09/25 for me), any 3-digit security code
- Mastercard: 5226612199533406, same as above

<mark>**Keep in mind that this is a test version open to the internet and everyone i ask to help me test this. Don't input any data you don't want to share with random people.**</mark>

## Known bugs

- When you clone an event and is redirected to the new event clone, the event menu button (...) in the upper right corner does not work until the page is refreshed.

## Further plans in order of priority

- Add configurable locations with properties like address, accessibility info, max capacity which can be chosen by eventHosts
- Add instructions for eventHosts on how to set up and manage their events or require admins to approve events before publishing
- Ability to translate texts and labels for menu, event descriptions etc.
- Skill badges for members mapped to tasks such that an event host can limit who can be assigned to which tasks.
- Buttons to message the assignee and reviewer of a task
- Event tags (munch/playparty/section etc...)
- A year wheel for admins showing planning times and current and upcoming events
- Enable task assignees to submit receipts
- Solidarity and community funded event tickets - one bought solidarity ticket funds another ticket for someone else
- Upload images for events/products/texts
- Merch store

## Contributions

To contribute to this project, go through the following steps to setup the environment on your computer:

- Create a [GitHub](github.com) account.
- Ask Kellen to add you to the TaskMaster project to give you access to the code and detailed plans for the project.

Download your tools:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en/download)
- [Visual Studio Code](https://visualstudio.microsoft.com/downloads/)

Create an empty folder on your machine and open the folder in Visual Studio Code (hereafter: VS). Open a terminal and run the following commands:

```
git init
git add origin https://github.com/KellenSmith/TaskMaster.git
git fetch origin
```

Follow the steps to log in to GitHub when prompted.

You should now have a bunch of files in your previously empty folder.
Install all the tools the project used by running the commands:

```
pnpm install
```

Start the application by running the command

```
pnpm dev
```

You should then be able to access the application at [https://localhost:3000](https://localhost:3000)

Create a new file in the root folder called ".env" and ask Kellen for the contents. To begin working, go to GitHub and grab one of the "issues" tagged with the topic you prefer.
