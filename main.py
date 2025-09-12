import time
import random

IR_SIGNATURES = {
    "organic": 680,
    "plastic": 850,
    "paper": 920,
    "metal": 1050,
    "unknown": 0 # Signature for items not detected by the sensors
}

def simulate_ir_sensor():
    """Simulates a sensor reading by randomly choosing a material type."""
    material_types = list(IR_SIGNATURES.keys())
    # 90% chance of a known material, 10% chance of an unknown one
    if random.random() < 0.9:
        random_material = random.choice([m for m in material_types if m != "unknown"])
    else:
        random_material = "unknown"
    
    return IR_SIGNATURES[random_material]

def get_material_from_signature(signature):
    """Returns the material name corresponding to a given IR signature."""
    for material, sig in IR_SIGNATURES.items():
        if sig == signature:
            return material
    return "unknown"

def main():
    """Main function to run the waste sorting simulation."""
    print("Starting the Multi-Stage Waste Sorting System Simulation...")
    print("Simulating items on a conveyor belt going through sequential sensor stages.\n")
    sorting_stages = [
        {"material": "organic", "destination": "dumping pits"},
        {"material": "plastic", "destination": "crushers"},
        {"material": "paper", "destination": "different conveyor belt to recycling"},
        {"material": "metal", "destination": "melting process"}
    ]
    
    try:
        item_count = 1
        while True:
            print(f"--- Item #{item_count} on conveyor belt ---")
            
            # Step 1: Simulate a new item and get its sensor reading.
            sensor_reading = simulate_ir_sensor()
            identified_material = get_material_from_signature(sensor_reading)
            
            print(f"Initial sensor scan identifies material as: {identified_material.upper()}")
            
            # Step 2: Pass the item through each sensor stage sequentially.
            item_sorted = False
            for stage_num, stage in enumerate(sorting_stages):
                print(f"  > Passing through Stage {stage_num + 1}: {stage['material']} sensor row...")
                
                # Check if the item matches the current stage's target material.
                if identified_material == stage['material']:
                    print(f"    -> SUCCESS! Firing air gun for {stage['material'].upper()} bin. Item sent to {stage['destination']}.")
                    item_sorted = True
                    break # The item is sorted, so we exit the stage loop.
                else:
                    print(f"    -> Item does not match. Continues on the main conveyor belt.")
            
            if not item_sorted:
                # This handles items that pass all stages (e.g., an "unknown" material).
                print("  > Item passed all sorting stages. It proceeds to the end of the line for manual inspection or as residual waste.")
            
            print("-------------------------------------------\n")
            time.sleep(2) 
            item_count += 1
            
    except KeyboardInterrupt:
        print("\nSimulation stopped by user.")
        print("Total items simulated:", item_count - 1)

if __name__ == "__main__":
    main()
