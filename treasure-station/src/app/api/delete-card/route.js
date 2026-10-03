import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(request) {
  try {
    const { stationName, cardId } = await request.json();
    
    // Define the path to your JSON file
    const filePath = path.join(process.cwd(), 'src/data/questions.json');
    
    // Read and parse the current data
    const fileData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileData);
    
    // Check if the station exists
    if (!data[stationName]) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }
    
    // Filter out the card with the matching ID
    const initialLength = data[stationName].length;
    data[stationName] = data[stationName].filter(card => card.id !== cardId);
    
    if (data[stationName].length === initialLength) {
      return NextResponse.json({ error: 'Card ID not found' }, { status: 404 });
    }
    
    // Write the updated data back to the JSON file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    
    return NextResponse.json({ success: true, message: `Card ${cardId} deleted successfully.` });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete card', details: error.message }, { status: 500 });
  }
}