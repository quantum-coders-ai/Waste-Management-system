Smart Waste Sorting Dashboard
1. Project Overview
Sortify is a full-stack web application that simulates a modern, automated waste sorting facility. It features an interactive dashboard that visualizes the process of waste items moving along a conveyor belt, being identified by a series of specialized sensors, and sorted into different processing streams in real-time.

The project combines a Python-based simulation logic for the backend with a dynamic frontend built using HTML, CSS, and JavaScript. All data from the simulation is stored and retrieved in real-time from a Google Firebase (Firestore) database, providing a persistent and interactive user experience.

2. Key Features
Interactive Web Dashboard: A user-friendly interface to start, stop, and monitor the sorting process.

Realistic Simulation: The system simulates various material types (organic, plastic, paper, metal) and includes a probability for "unknown" items to mimic real-world scenarios.

Multi-Stage Sensor Checkpoints: A sequential sorting system where each sensor is specialized for one type of material, providing a clear visualization of the sorting workflow.

Real-time Database Integration: Utilizes Google Firestore to log every sorting action. The dashboard reflects database changes instantly without needing a refresh.

Data Analytics: The dashboard displays live counts of total, recycled, and non-recyclable items processed.

Detailed Breakdown: Users can click on the counter cards to see a detailed breakdown of the items within each category (e.g., how many plastic vs. paper items were recycled).

3. Technologies Used
This project integrates several technologies to create a full-stack experience:

Backend (Simulation Logic):

Python 3.x: Used for the core backend simulation logic in the main.py file, which serves as the conceptual foundation for the system.

Frontend (Dashboard & Interaction):

HTML5: Structures the web dashboard.

Tailwind CSS: A utility-first CSS framework for rapidly building a modern and responsive user interface.

JavaScript (ES6+): Powers the client-side simulation logic, DOM manipulation, and communication with the database.

Database:

Google Firebase (Firestore): A cloud-based NoSQL database used for real-time data storage and synchronization, allowing the dashboard to update instantly as new data is generated.

4. System Architecture & Step-by-Step Workflow
The application follows a clear, event-driven workflow from user interaction to data persistence.

Initialization:

When the index.html page loads, script.js initializes a connection to the Firebase project.

The script authenticates the user (anonymously in this case) and sets up a real-time listener (onSnapshot) on the waste_log collection in Firestore.

Starting the Simulation:

The user clicks the "START CONVEYOR" button.

This action triggers the toggleConveyor() function, which starts a JavaScript interval (setInterval).

Item Generation & Processing:

At each interval, the runSortingSimulation() function is called.

A new virtual waste item is generated with a random material type using the simulateIrSensor() logic.

The UI updates to show the name of the "Current Item" being processed.

Visual Sorting on Conveyor Belt:

The item visually "travels" through the sensor checkpoints on the dashboard.

As the item reaches each sensor, the sensor's light on the UI pulses (updateSensorUI).

If the item's material matches the sensor's target (e.g., a "Plastic" item at the "Plastic Sensor"), the sorting is successful.

Database Transaction:

Once an item is sorted (or passes all sensors as "unknown"), the saveWasteData() function is called.

A new document is created in the Firestore waste_log collection, containing the item's material, category (recycled/dumped), destination, and a server timestamp.

Real-time Dashboard Update:

The onSnapshot listener, which has been active since the page loaded, detects the new document in the database instantly.

The listener's callback function re-reads the entire collection, recalculates the totals for recycled and dumped waste, and updates the counters and log on the dashboard. This ensures the UI is always a perfect reflection of the database state.

Stopping the Simulation:

The user can click "STOP CONVEYOR" or "EMERGENCY STOP" to clear the simulation interval and pause the process.

5. Potential Use Cases & Applications
This project, while a simulation, serves as a powerful prototype and educational tool with several real-world applications:

Educational Tool: An excellent resource for teaching students about automation, IoT (Internet of Things) sensor systems, real-time databases, and full-stack web development.

Industrial Prototyping: Can be used as a digital twin or a proof-of-concept for designing and validating the logic of a physical waste sorting facility before investing in expensive hardware.

Operator Training: A safe, virtual environment for training new employees on how to monitor and manage an automated sorting plant.

Data Generation: The simulation can be run to generate large, structured datasets that could be used to train machine learning models for more advanced waste detection and classification.

6. Project Setup & Installation
To run this project on your local machine, follow these steps:

Prerequisites
A modern web browser (e.g., Chrome, Firefox).

A Google Firebase account (a free "Spark" plan is sufficient).

Setup Instructions
Set up Firebase:

Go to the Firebase Console.

Create a new project.

Create a new Firestore Database in your project.

In your Project Settings, add a new Web App.

Firebase will provide you with a firebaseConfig object. Copy this object.

Configure script.js:

Note: In the original project environment, the configuration is injected automatically. For local setup, you must add it manually.

Open the script.js file.

At the top of the initializeFirebase function, you will see a line for firebaseConfig. Paste your copied configuration object here.

You can leave __app_id and __initial_auth_token as they are for local testing.

Run the Application:

Place the index.html, style.css, and script.js files in the same directory.

Open the index.html file in your web browser.

The dashboard should load, and you can now start the simulation. All data will be saved to your Firebase project.
