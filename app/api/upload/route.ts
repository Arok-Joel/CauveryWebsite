import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create unique filename
    const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), "public/uploads/plots");
    await mkdir(uploadDir, { recursive: true });
    
    // Save to public/uploads/plots directory
    const path = join(uploadDir, uniqueFilename);
    await writeFile(path, buffer);
    
    // Return the URL for the uploaded file
    const url = `/uploads/plots/${uniqueFilename}`;
    
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
} 