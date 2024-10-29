
# TribeWell


![TribeWell Logo](https://github.com/user-attachments/assets/bf54cf76-8ddf-4f7f-9aee-8e8857756935)


---

## Synopsis

**TribeWell** is a platform focused on creating a connected community of wellness enthusiasts who explore and engage with ancient healing wisdom. Our platform provides resources on Ayurveda, Reiki, and Sound Healing, allowing users to access educational content, personalized wellness plans, and interactive community features. With TribeWell, users can discover holistic practices, participate in discussions, and enhance their wellness journey.

---

## Features

- **Diverse Healing Modalities**: Access a library of ancient healing practices, including Ayurveda, Reiki, and Sound Healing.
- **Educational Content**: Explore introductory courses, articles, and videos tailored for wellness education.
- **Community Engagement**: Participate in forums, live Q&A sessions, and discussions with other wellness enthusiasts.
- **Personalized Experience**: Tailor your healing journey with customizable plans and progress tracking.
- **Modern Technology Integration**: Access TribeWell on a responsive website and mobile app.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.0 or higher)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- Basic knowledge of React, Firebase, and Firestore.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YourUsername/TribeWell.git
   cd TribeWell
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Firebase credentials**:
   - Add your Firebase project credentials in a `.env` file or in `firebaseConfig.js`.

4. **Run the app locally**:
   ```bash
   npm start
   ```

---

## Testing (Placeholder)

*To be detailed in CSC 191*

Testing strategy, including unit tests, integration tests, and end-to-end testing, will be added as development progresses.

---

## Deployment (Placeholder)

*To be detailed in CSC 191*

This section will cover deployment instructions and setup for production.

---

## Developer Instructions (Placeholder)

*To be detailed in CSC 191*

Detailed instructions for setting up development environments, code structure, and collaboration guidelines will be included.

---

## Project Timeline and Key Milestones

The timeline below is based on the JIRA backlog and outlines key milestones for TribeWell.

| Milestone                            | Expected Completion Date |
|--------------------------------------|--------------------------|
| Basic Setup & User Authentication    | Sprint 1                 |
| Content Management (Text, Media)     | Sprint 2                 |
| Video Uploads & User Association     | Sprint 3                 |
| Community Engagement Features        | Sprint 4                 |
| UI/UX Enhancements and Testing       | Sprint 5                 |
| Final Deployment and Documentation   | Sprint 6                 |
| Advanced Analytics & User Insights   | Sprint 7                 |
| Post-Launch Optimization & Feedback  | Sprint 8                 |

---

## Visuals

### Entity Relationship Diagram (ERD)

Here’s the ERD for TribeWell, outlining the core entities and relationships:

- **USER**
  - `UID` (Primary Key): Unique identifier for each user
  - `Displayname`: User’s display name
  - `DisplayPicture`: User’s profile picture
  - `Email`: User’s email address
  - `Password`: User’s password
  - `Date_of_Birth`: User’s date of birth
  - `Account_Type`: Type of account (e.g., standard, admin)

- **CONTENT**
  - `Post_ID` (Primary Key): Unique identifier for each post
  - `User_ID` (Foreign Key): Links post to its author
  - `Thread_ID`: Unique identifier for discussion threads
  - `Video_Audio_File`: Multimedia content associated with the post
  - `Text`: Text content of the post
  - `Post_Date`: Date when the post was created

- **COMMENT**
  - `Comment_ID` (Primary Key): Unique identifier for each comment
  - `User_ID` (Foreign Key): Links comment to its author
  - `Thread_ID` (Foreign Key): Links comment to relevant thread
  - `Comment`: Text of the comment
  - `Post_Date`: Date when the comment was made

![ERD Diagram](path/to/ERD-TribeWell.png)

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Contact

For questions or feedback, please reach out to the **TribeWell** development team (Team GitBuds) at [gitbuds@gmail.com].

---


## Previous Version (Below)

Alternative healing app platform "TribeWell" created by Team GitBuds.<br>

## Members
Parsa Bayat

Arthur Erlandson

Austin Mann

Matthew Morello

Emiley Mynhier

Jason Neal

Priya Pillay

Kat Shpak
