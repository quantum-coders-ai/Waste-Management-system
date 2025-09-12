# Waste-Management-system
Smart Waste Sorting Simulation

This project is a Python-based simulation of an automated, multi-stage waste sorting system. It models a conveyor belt where items of different materials are identified by a series of sensors and sorted into appropriate bins. This script is the backend logic for the "Sortify - Smart Waste Dashboard" project.

Features

Realistic Simulation: Simulates different types of waste materials: organic, plastic, paper, and metal.

Unknown Items: Includes a chance for an "unknown" material to appear, simulating real-world scenarios where an item might not be identifiable by sensors.

Multi-Stage Checkpoint System: Items pass through a series of specialized sensors, each designed to detect a single type of material.

Console Logging: Provides a detailed, real-time log of the sorting process for each item directly in the terminal.

Graceful Shutdown: The simulation can be stopped at any time using Ctrl+C, and it will display a summary of the total items processed.

How It Works

The simulation operates in a continuous loop, with each iteration representing a new item on the conveyor belt:

Item Generation: A new item is simulated with a specific material type (e.g., plastic). There is a 90% chance it's a known material and a 10% chance it's "unknown."

Sensor Detection: The item's simulated IR signature is read.

Sequential Sorting: The item passes through a series of sensor stages:

Stage 1: Organic Sensor

Stage 2: Plastic Sensor

Stage 3: Paper Sensor

Stage 4: Metal Sensor

Sorting Action: If a sensor detects a material that matches its target, a message is printed indicating that the item has been successfully sorted, and the simulation moves on to the next item.

Manual Inspection: If an item passes through all sensor stages without being sorted (e.g., an "unknown" item), it is sent to the end of the line for manual inspection.

How to Run

Prerequisites

Python 3.x

Execution

Save the code as main.py.

Open your terminal or command prompt.

Navigate to the directory where you saved the file.

Run the script using the following command:

python main.py


The simulation will start and print the status of each item to the console.

To stop the simulation, press Ctrl+C.

Code Overview

IR_SIGNATURES: A dictionary that maps material types to their simulated infrared signature values.

simulate_ir_sensor(): This function randomly selects a material to simulate a new item appearing on the conveyor belt.

get_material_from_signature(): Translates a given IR signature back into its corresponding material name.

main(): The core function that contains the main loop, controls the flow of the simulation, and prints the operational log.
