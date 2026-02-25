# User Acceptance Test Flows

This document outlines the most recommended test flows for a User Acceptance Test (UAT) of the TaskMaster application's most critical features. Each scenario assumes a running server. Tests are sequential and each step depends on the successful completion of the previous one.

---

## 1. Create First User (Admin)

**Steps:**
1. Navigate to the home page.
2. Submit a membership application using an email address you have access to.
3. Check your email inbox for the membership confirmation link.
4. Log in using the link provided in the email.
5. Go to the profile page.

**Expected Results:**
- The user is granted a free yearly membership.
- The user is assigned the role "admin".
- Membership details are visible on the profile page.

**Post-condition:**
- Log out.

---

## 2. Create Second User (Member)

**Steps:**
1. Submit a membership application for a second user.
2. Verify that an email notification is sent to the organization email address.
3. Log in with the admin account created in Scenario 1.
4. Navigate to the members page.
5. Validate the new membership application.
6. Log out.
7. Check that an email notification is sent to the new user, informing them of membership validation.
8. Log in with the new member's account.

**Expected Results:**
- Upon login, the new member is directed to the root page.
- The left-hand menu displays only: Contact, Profile, and Shop.

---

## 3. Activate Membership for New Member

**Steps:**
1. While logged in as the new member, go to the profile page.
2. Click "Activate Membership".
3. Select a membership type and proceed through the order process.
4. Complete the payment/order.

**Expected Results:**
- The membership is activated and visible on the profile page.
- The left-hand menu now includes Calendar and Todo, in addition to Contact, Profile, and Shop.
- An email order confirmation is sent to the member.

** Post-condition:**
- Log out.

## 5. Create a location

**Steps:**
1. Log in with the admin account.
2. Navigate to the locations page.
3. Create a new location with the following details:
   - Name: "Test Location"
   - Capacity: 50

**Expected Results:**
- The new location is created and visible in the locations list.

## 6. Create a skill badge

**Steps:**
1. Navigate to the skill badges page.
2. Create a new skill badge with the following details:
   - Name: "Test Skill Badge"
   - Description: "This is a test skill badge."
3. Save the skill badge.

**Expected Results:**
- The new skill badge is created and visible in the skill badges list.

## 7. Create members from the members page

**Steps:**
1. Log in with the admin account.
2. Navigate to the members page.
3. Create a new member with the following details:
   - Email: [Use a valid email address]
   - Nickname: "eventParticipant"
   - Role: "member"
4. Create a new member with the following details:
   - Email: [Use a valid email address]
   - Nickname: "eventVolunteer"
   - Role: "member"
5. Create a new member with the following details:
   - Email: [Use a valid email address]
   - Nickname: "skilledMember"
   - Role: "member"
   - Skill badges: "Test Skill Badge"
5. Create a new member with the following details:
   - Email: [Use a valid email address]
   - Nickname: "eventReserve"
   - Role: "member"
6. Validate all members' memberships.
7. Assign all members a membership.

**Expected Results:**
- All members are created and visible in the members list with valid memberships (green).
- All members receive email notifications about their membership validation.

** Post-condition:**
- Log out.

## 6. Create an event

**Steps:**
1. Log in with the member account.
2. Navigate to the calendar page.
3. Create a new event with the following details:
   - Title: "Test Event"
   - Date: [Select a future date]
   - Location: "Test Location"
   - Max participants: 4
4. Save the event.
5. Go to the volunteering tab in the event view and create a new task with the following details:
   - Name: "Event Setup"
6. Create a new task with the following details:
   - Name: "Skilled task"
   - Skill badge requirement: "Test Skill Badge"
5. Go to the tickets tab in the event view and create a new ticket with the following details:
   - Name: "General Admission"
   - Type: "standard"
   - Price: 100
4. Publish the event.

**Expected Results:**
- The event is created and visible on the calendar.

** Post-condition:**
- Log out.

## 7. Edit the organization settings

**Steps:**
1. Log in with the admin account.
2. Navigate to the organization settings page.
3. Update the organization name to "Test Organization".
4. Upload a document to the organization documents section.
5. Fill in the event manager email.
6. Save the changes.
7. Go to the calendar page and create a new event.

**Expected Results:**
- The organization name is updated and visible on the home page.
- The uploaded document is visible in the organization documents section.
- The event needs to be sent for approval before being published.
- An email notification is sent to the event manager email address, informing them of the pending event approval.

** Post-condition:**
- Log out.

## 8. Create an event for approval

**Steps:**
1. Log in with the member account.
2. Navigate to the calendar page.
3. Create a new event with the following details:
   - Title: "Test Event for Approval"
   - Date: [Select a future date]
   - Location: "Test Location"
4. Save the event as a draft.
5. Submit the event for approval.
6. Log out.
7. Log in with the admin account.
8. Navigate to the calendar page and approve the pending event.

**Expected Results:**
- The pending event is submitted for approval and visible to the member as a draft in the calendar.
- An email notification is sent to the event creator, informing them of the event approval.
- The approved event is visible on the calendar.

** Post-condition:**
- Log out.

## 10. Participate in an event

**Steps:**
1. Log in with the eventParticipant account.
2. Navigate to the calendar page.
3. Find the "Test Event" event and click "Tickets"-tab in the event view.
4. Choose a ticket and go through the order process to purchase the ticket.
5. Go to the ticket tab in the event.

**Expected Results:**
- The ticket is purchased successfully and visible in the event's ticket tab.
- An email confirmation is sent to the participant.

## 11. Volunteer for an event

**Steps:**
1. Log in with the eventVolunteer account.
2. Navigate to the calendar page.
3. Find the "Test Event" event and click "Volunteer"-tab in the event view.
4. Sign up for the "Event Setup" task.

**Expected Results:**
- The volunteer is signed up for the task and visible in the event's volunteer tab.
- The volunteer is not able to book the "Skilled task" due to not having the required skill badge.
- In the ticket tab, the volunteer should see they hold a ticket.

** Post-condition:**
- Log out.

## 12. Volunteer for a skilled task

**Steps:**
1. Log in with the skilledMember account.
2. Navigate to the calendar page.
3. Find the "Test Event" event and click "Volunteer"-tab in the event view.
4. Sign up for the "Skilled task" task.

**Expected Results:**
- The skilled member is signed up for the task and visible in the event's volunteer tab.
- The skilled member is able to book the "Skilled task" due to having the required skill badge.

** Post-condition:**
- Log out.

## 13. Reserve a spot for an event

**Steps:**
1. Log in with the eventReserve account.
2. Navigate to the calendar page.
3. Find the "Test Event" event and click "Tickets"-tab in the event view.
4. Click "Reserve" to reserve a spot for the event.
5. Leave the reserve list.
6. Reserve a spot again.

**Expected Results:**
- The spot is reserved successfully and visible in the event's ticket tab as a reservation.
- The reservation is removed successfully when leaving the reserve list and the spot becomes available again.

** Post-condition:**
- Log out.

## 14. Leave the participant list

**Steps:**
1. Log in with the eventParticipant account.
2. Navigate to the calendar page.
3. Find the "Test Event" event and click "Participants"-tab in the event view.
4. Leave the participant list.

**Expected Results:**
- The participant is removed from the participant list successfully.
- The event reserve is notified of the available spot and can book a ticket for the event.

** Post-condition:**
- Log out.

## 15. Manage an event as a host

**Steps:**
1. Log in with the member account.
2. Navigate to the calendar page.
3. Find the "Test Event" event and click on it to view the event details.
4. Go to the "Participants" tab and verify that the participant, volunteer, skilled member, and reservation are visible.
5. Send a message to all participants using the event's messaging feature
6. Print the participant list.
7. Print the volunteer schedule.
8. Cancel the event.
8. TODO: Add more host management actions as they are implemented (e.g., check-in participants, manage volunteers, etc.)

**Expected Results:**
- All participants are visible in the participants tab.
- The message is sent successfully to all participants.
- The participant list is printed successfully.
- The volunteer schedule is printed successfully.
- The event is canceled successfully and participants notified.


## Notes
- Each scenario should be executed in sequence.
- All email notifications should be verified for correct content and delivery.
