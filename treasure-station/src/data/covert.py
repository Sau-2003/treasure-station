import pandas as pd
import json

# Make sure this matches your exact file name
excel_file = "src/data/wedding_treasure_hunt.xlsx"

print(f"Reading {excel_file}...")

try:
    # Read the specific sheet
    df = pd.read_excel(excel_file, sheet_name="GK_Cards")
    
    output_data = {}
    
    # Group the data by the 'station_number' column
    for station_num, group in df.groupby("station_number"):
        station_name = f"Station {station_num}"
        cards = []
        
        # Loop through each row in this station
        for index, row in group.iterrows():
            # Grab Question A and Question B directly from the columns
            cards.append({
                "qA": str(row["question_a"]).strip(),
                "aA": str(row["answer_a"]).strip(),
                "qB": str(row["question_b"]).strip(),
                "aB": str(row["answer_b"]).strip()
            })
            
        output_data[station_name] = cards
        print(f"✅ Loaded {len(cards)} paired cards for {station_name}")

    # Save to your Next.js data folder
    output_file = "src/data/questions.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=4)

    print(f"\n🎉 Success! The file '{output_file}' has been created.")
    
except Exception as e:
    print(f"❌ Error: {e}")