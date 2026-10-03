import pandas as pd
import json
import os

# The direct export URL for your Google Sheet
# We use the specific sheet ID and the 'gid' (333065428) for the GK_Cards sheet
sheet_id = "1cEpPsnD9T6XtPm1N0loYZxOLMXzlcPoo"
gid = "333065428"
csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"

print("Reading data directly from Google Sheets...")

try:
    # Read the data directly from the URL
    df = pd.read_csv(csv_url)
    
    output_data = {}
    
    # Group the data by the 'station_number' column
    for station_num, group in df.groupby("station_number"):
        # Skip any empty/NaN station numbers just in case
        if pd.isna(station_num):
            continue
            
        # Convert to integer in case Pandas reads it as a float (e.g., 1.0 -> 1)
        station_name = f"Station {int(station_num)}"
        cards = []
        
        # Loop through each row in this station
        for index, row in group.iterrows():
            cards.append({
                "qA": str(row["question_a"]).strip(),
                "aA": str(row["answer_a"]).strip(),
                "qB": str(row["question_b"]).strip(),
                "aB": str(row["answer_b"]).strip()
            })
            
        output_data[station_name] = cards
        print(f"✅ Loaded {len(cards)} paired cards for {station_name}")

    # Set up the output path
    output_file = "src/data/questions.json"
    
    # Ensure the 'src/data' directory exists before saving
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Save to your Next.js data folder
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=4)

    print(f"\n🎉 Success! The file '{output_file}' has been created directly from the live sheet.")
    
except Exception as e:
    print(f"❌ Error: {e}")