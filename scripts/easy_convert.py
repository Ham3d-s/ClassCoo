import pandas as pd
import json
import os

def format_time(time_str):
    """Convert time string to HH:MM format"""
    try:
        # Split time string and take only hours and minutes
        parts = str(time_str).strip().split(':')
        return f"{parts[0]}:{parts[1]}"
    except:
        return time_str

def convert_schedule():
    # Get the Excel file path
    print("Please put your Excel file in the 'data' folder")
    filename = input("Enter the Excel file name (e.g., schedule.xlsx): ")
    
    # Full paths
    input_path = os.path.join('data', filename)
    output_path = os.path.join('static', 'data', 'schedule.json')
    
    try:
        # Read Excel file
        print("Reading Excel file...")
        df = pd.read_excel(input_path, header=1)
        
        # Initialize data structures
        fields = set()
        semesters = set()
        courses = []
        
        # Process each row
        print("Processing data...")
        for _, row in df.iterrows():
            if pd.isna(row[1]) or pd.isna(row[3]) or pd.isna(row[4]):
                continue
                
            field = str(row[1]).strip()
            semester = int(float(row[3]))
            course = {
                "field": field,
                "semester": semester,
                "name": str(row[4]).strip(),
                "credits": float(row[5]) if not pd.isna(row[5]) else None,
                "professor": {
                    "firstName": str(row[6]).strip() if not pd.isna(row[6]) else "",
                    "lastName": str(row[7]).strip() if not pd.isna(row[7]) else ""
                },
                "classroom": str(row[11]).strip() if not pd.isna(row[11]) else None
            }
            
            # Add schedule if available
            if not pd.isna(row[8]) and not pd.isna(row[9]) and not pd.isna(row[10]):
                course["schedule"] = {
                    "day": str(row[8]).strip(),
                    "startTime": format_time(str(row[9]).strip()),
                    "endTime": format_time(str(row[10]).strip())
                }
            else:
                course["schedule"] = None
            
            fields.add(field)
            semesters.add(semester)
            courses.append(course)
        
        # Create final data structure
        data = {
            "fields": [{"id": f.replace(" ", "_"), "name": f} for f in sorted(fields)],
            "semesters": [{"id": s, "name": f"ترم {s}"} for s in sorted(semesters)],
            "courses": courses
        }
        
        # Save to JSON
        print("Saving data...")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"Success! Data saved to {output_path}")
        print(f"Processed {len(courses)} courses from {len(fields)} fields")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    convert_schedule()
