# JoJo's Shave Ice App

A React Native application for JoJo's Shave Ice staff to manage daily tasks organized by different shifts (opening, mid-day, closing).

## Features

- Location-based login system
- Task management organized by shift periods (opening, mid, closing)
- Integration with Asana for task data
- Firebase Firestore for storing location and authentication data

## Setup Instructions

### Prerequisites

- Node.js and npm
- React Native development environment
- Firebase account
- Asana account and API token

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the app:
   ```
   npm start
   ```

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore database
3. Deploy the included Firestore security rules:
   ```
   firebase deploy --only firestore:rules
   ```
4. **Important:** Set up the locations data in Firestore using one of the methods detailed in the `FIRESTORE_SETUP.md` file

### Location Setup

The app requires three locations to be set up in Firestore:
- CMP
- Waimea
- Hanalei

You can set up these locations using:
1. The included web admin tool (`firestoreAdmin.html`)
2. The Firebase Console (manual entry)
3. The app's Admin screen (triple-tap the app title on the login screen)

See `FIRESTORE_SETUP.md` for detailed instructions.

Each location is configured with:
- Location name
- Email address (for login)
- Password
- Asana User ID and PAT (Personal Access Token)

### Asana Setup

1. Generate a Personal Access Token in Asana for each location user
2. Update the locations in Firebase with the correct Asana information:
   - Asana User ID
   - Asana Personal Access Token

## Task Types

The app supports various task types from Asana:

- Check Box
- Short Answer
- Long Answer
- Value (Number)
- Scale Rating
- Picture
- Video
- Signature
- Date/Time
- Dropdown/Select
- Multiple Choice
- Location
- File Upload
- Timer/Duration
- Audio Recording
- Link/URL
- Barcode/QR Scan

## Usage

1. Login with location email and password
2. View and complete tasks organized by shift type
3. Tasks are synced with Asana for project management integration

## Development Notes

- Update the Asana PAT placeholder values with real tokens for production use
- Customize the task UI components based on the task type
- Implement proper Asana integration for production 