# User Acceptance Test Flows

This document outlines the most recommended test flows for a User Acceptance Test (UAT) of the TaskMaster application's most critical features. Each scenario assumes a running server. Tests are sequential and each step depends on the successful completion of the previous one.

---

## 1. Create First User (Admin)

**Steps:**
1. Navigate to the home page.
2. Click "Apply for Membership" and fill in the application form with valid details, using an email address you have access to.
3. Click the document links.
4. Submit a membership application using an email address you have access to.
5. Check your email inbox for the membership confirmation link.
6. Log in using the link provided in the email.
7. Go to the profile page.

**Expected Results:**
- The document links are accessible and open the correct documents.
- The user is granted a free yearly membership.
- The user is assigned the role "admin".
- Membership details are visible on the profile page.
- All menu items are visible, including admins only items.

**Post-condition:**
- Log out.

---

## 2. Create Second User (Member)

**Steps:**
1. Submit a membership application for a second user.
2. Log in with the new member's email address using the link provided in the email.

**Expected Results:**
- An email notification is sent to the organization email address to inform them of the pending membership application.
- Upon login with the sent login link, the new member is directed to the profile page.
- "Your membership is awaiting validation by an admin" message is displayed on the profile page.
- The left-hand menu displays only: Home, Contact and Profile.

** Post-condition:**
- Log out.

---

## 3. Validate Membership for New Member

**Steps:**
1. Log in with the admin account.
2. Navigate to the members page.
3. Validate the new member's membership application.
4. Log out.
5. Log in with the new member's account.
6. Go to the profile page and verify that the membership status is updated to valid.

**Expected Results:**
- The new member's membership is validated and the status is updated to expired (red) in the members list.
- The new member receives an email notification about their membership validation.
- The new member can see the updated membership status on their profile page.
- The left-hand menu now displays only: Home, Contact, Profile and Shop.

---

## 4. Activate Membership for New Member

**Steps:**
1. While logged in as the new member, go to the profile page.
2. Click "Activate Membership".
3. Select a membership type and proceed through the order process.
4. Complete the payment/order.

**Expected Results:**
- The membership is activated and visible on the profile page.
- The left-hand menu now includes Calendar and Todo, in addition to Home, Contact, Profile, and Shop.
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
8. Print the members list

**Expected Results:**
- All members are created and visible in the members list with valid memberships (green).
- All members receive email notifications about their membership validation.
- The printed members list includes all created members with their email and nickname.

** Post-condition:**
- Log out.

## 8. Create an event

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
7. Go to the tickets tab in the event view and create a new ticket with the following details:
   - Name: "General Admission"
   - Type: "standard"
   - Price: 100
8. Go to the participant tab in the event and verify that the member is on the participant list.
9. Send the event for approval.
10. Log out and log in with the admin account.
11. Approve the event.
12. Publish the event.
13. Log out and log in with the eventParticipant account.
14. Go to the calendar page and verify that the event is visible.

**Expected Results:**
- Created tasks have start and end time set to the event start and end time by default.
- The event draft is created and visible on the calendar as a draft to the member and admin.
- The event draft is not visible on the calendar to other members.
- The published event is visible on the calendar to all members.

** Post-condition:**
- Log out.

## 9. Edit the organization settings

**Steps:**
1. Log in with the admin account.
2. Navigate to the organization settings page.
4. Upload a document to the organization documents section.
5. Fill in the event manager email.
6. Save the changes.
7. Go to the calendar page and create a new event.
8. Submit the event for approval.

**Expected Results:**
- The uploaded document is visible in the organization documents section.
- The event needs to be sent for approval before being published.
- An email notification is sent to the event manager email address, informing them of the pending event approval.

** Post-condition:**
- Log out.

## 10. Create an event for approval

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
8. Navigate to the calendar page and publish the pending event.

**Expected Results:**
- The pending event is submitted for approval and visible to the member as a draft in the calendar.
- An email notification is sent to the event creator, informing them of the event approval.
- The approved event is visible on the calendar.

** Post-condition:**
- Log out.

## 11. Participate in an event

**Steps:**
1. Log in with the eventParticipant account.
2. Navigate to the calendar page.
3. Find the "Test Event" event and click "Tickets"-tab in the event view.
4. Choose a ticket and go through the order process to purchase the ticket.
5. Go to the ticket tab in the event.

**Expected Results:**
- The ticket is purchased successfully and visible in the event's ticket tab.
- The ticket QR-code is visible and scannable on the dashboard page.
- An email confirmation is sent to the participant.

## 12. Volunteer for an event

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

## 13. Volunteer for a skilled task

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

## 14. Reserve a spot for an event

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

## 15. Leave the participant list

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

## 16. Manage an event as a host

**Steps:**
1. Log in with the member account.
2. Navigate to the calendar page.
3. Find the "Test Event" event and click on it to view the event details.
4. Go to the "Participants" tab and verify that the volunteer, skilled member, and reservation are visible.
5. Send a message to all participants using the event's messaging feature
6. Print the participant list.
7. Print the volunteer schedule.
8. Cancel the event.
9. TODO: Add more host management actions as they are implemented (e.g., check-in participants, manage volunteers, etc.)

**Expected Results:**
- All participants are visible in the participants tab.
- The message is sent successfully to all participants.
- The participant list is printed successfully.
- The volunteer schedule is printed successfully.
- The event is canceled successfully and participants notified.


## Notes
- Each scenario should be executed in sequence.
- All email notifications should be verified for correct content and delivery.
