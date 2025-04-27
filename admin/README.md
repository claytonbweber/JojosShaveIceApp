# JoJo's Shave Ice - Admin Interface

This is a web-based admin interface for managing JoJo's Shave Ice App's backend data.

## Features

1. **Locations Management**
   - Initialize and manage location data in Firestore
   - Configure Asana integration for each location

2. **Projects Management**
   - Create and manage Asana projects
   - Create sections within projects for task organization
   - Configure project schedules (by day or by section)
   - Configure projects to work with the JoJo's Shave Ice app

## Setup

1. Start a local web server in this directory:
   ```
   python3 -m http.server
   ```

2. Open a web browser and navigate to:
   ```
   http://localhost:8000/admin/
   ```

## Pages

1. **Locations** (`locations.html`)
   - Initialize locations in Firebase
   - Each location has an email, password, and Asana integration details

2. **Projects** (`projects.html`)
   - Select a location to manage its Asana projects
   - Fetch existing projects from Asana
   - Create new projects in Asana
   - Add sections to projects for task organization
   - Configure project scheduling:
     - **Custom By Section**: Default option for custom handling of each section
     - **Select Day(s) of the Week**: Schedule the project to appear on specific days

## Asana Structure

For the app to work correctly, each Asana project should have these sections:
- **Opening**: Tasks to be completed during opening shift
- **Mid**: Tasks to be completed during mid-day shift
- **Closing**: Tasks to be completed during closing shift

## Project Scheduling

Projects can be scheduled in two ways:

1. **Custom By Section**: Each section in the project (Opening, Mid, Closing) is treated independently.
   This is useful for projects that need more granular control.

2. **Day-based Scheduling**: The project appears in the app only on selected days of the week.
   For example, a "Weekly Cleaning" project might only appear on Mondays.

This configuration is stored in Firestore in the `projectConfigurations` collection.

## Security

This admin interface should be hosted securely and only accessible to authorized personnel as it contains sensitive information like Asana Personal Access Tokens.

For production use, consider adding proper authentication and authorization. 