# TaskMaster

## TL:DR

Help me test the TaskMaster!
Play around as much as you like. Try to break it and tell me what else you want in there.

To get access you need to apply with a valid email. Login is done with magic links sent to your email.

The TaskMaster helps out by sending automatic emails related to events, orders, and user actions. The email will be sent to the address of the relevant user.

For payments, use the following test data:

- Swish: any phone number, e.g. +46 739000001
- Visa card number: 4761739001010416, expiry after the following month (today is 2025/08/25 so 09/25 for me), any 3-digit security code
- Mastercard: 5226612199533406, same as above

<mark>**Keep in mind that this is a test version open to the internet and everyone i ask to help me test this. Don't input any data you don't want to share with random people.**</mark>

## Known bugs

- All known fixed!

## Further plans in order of priority

- ~~Enable eventHosts to manually add participants and reserves~~
- ~~Add configurable locations with properties like address, accessibility info, max capacity which can be chosen by eventHosts~~
- ~~Ditch the task phase property and sort by start/end dates instead~~
- ~~Skill badges for members mapped to tasks such that an event host can limit who can be assigned to which tasks.~~
- ~~A year wheel for admins showing planning times and current and upcoming events~~
- ~~Ability to translate texts and labels for menu, event descriptions etc.~~
- ~~Mobile friendly layout~~
- ~~Upload images for events/products/texts~~
- ~~Add approval for events posted by non-admins~~
- ~~Move task shift start and end time when cloning an event~~
- ~~Event tags (munch/playparty/section etc...)~~
- ~~Buttons to message the assignee and reviewer of a task~~
- Implement membership subscription
- Fine tune filtering of tasks in the task board and events
- Add age check for purchases
- QR code scanner usable from any mobile device to check in event participants along with qr codes for tickets. Currently tickets are checked manually by crossing off nicknames on the participant list. The QR code scanner should be reachable through a link on a task if configured by the event host.
- Implement checklists for tasks.
- Add automatic notification to event participants if there are unbooked tasks remaining a configurable time before the event starts.
- Enable different membership types.
- Implement shopping cart.
- Enable different event types (open to all members, open to specific membership types, open to public)
- Enable task assignees to submit receipts
- Solidarity and community funded event tickets - one bought solidarity ticket funds a ticket for someone else
- Merch store
- Connect databases for different organizations within the taskmaster family to share events, tasks, member lists and locations.

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
git remote add origin https://github.com/KellenSmith/TaskMaster.git
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

## Documentation

- Start here: `docs/README.md`
- Purpose and audience: `docs/00-purpose.md`
- Local setup: `docs/01-getting-started.md`
- Environment variables: `docs/02-environment.md` (+ see `.env.example`)
- Architecture overview: `docs/03-architecture.md`
- Testing: `docs/04-testing.md`
