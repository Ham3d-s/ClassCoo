"""
Script to convert university schedule data from Excel format to JSON.
Usage: python data_converter.py input.xls output.json
"""
import json
import sys
import pandas as pd
import logging
from typing import Dict, List, Any

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def format_time(time_str):
    """Convert time string to HH:MM format"""
    try:
        parts = str(time_str).strip().split(':')
        return f"{parts[0]}:{parts[1]}"
    except:
        return time_str

def parse_excel_schedule(input_file: str) -> Dict[str, Any]:
    """Parse Excel schedule file and return structured data."""
    try:
        # Read Excel file
        logger.info(f"Reading Excel file: {input_file}")
        df = pd.read_excel(input_file, header=1)

        # Clean column names and drop empty rows
        df = df.dropna(how='all')

        # Initialize data structures
        fields = set()
        semesters = set()
        courses = []

        # Process each row
        for _, row in df.iterrows():
            try:
                # Skip rows with missing essential data
                if pd.isna(row[1]) or pd.isna(row[3]) or pd.isna(row[4]):
                    continue

                field_name = str(row[1]).strip()
                semester = int(float(row[3])) if not pd.isna(row[3]) else None
                course_name = str(row[4]).strip()
                credits = float(row[5]) if not pd.isna(row[5]) else None
                prof_first = str(row[6]).strip() if not pd.isna(row[6]) else ""
                prof_last = str(row[7]).strip() if not pd.isna(row[7]) else ""
                day = str(row[8]).strip() if not pd.isna(row[8]) else None
                start_time = str(row[9]).strip() if not pd.isna(row[9]) else None
                end_time = str(row[10]).strip() if not pd.isna(row[10]) else None
                classroom = str(row[11]).strip() if not pd.isna(row[11]) else None

                if all([field_name, semester, course_name]):
                    fields.add(field_name)
                    semesters.add(semester)

                    course = {
                        "field": field_name,
                        "semester": semester,
                        "name": course_name,
                        "credits": credits,
                        "professor": {
                            "firstName": prof_first,
                            "lastName": prof_last
                        },
                        "classroom": classroom
                    }

                    if day and start_time and end_time:
                        course["schedule"] = {
                            "day": day,
                            "startTime": format_time(start_time),
                            "endTime": format_time(end_time)
                        }
                    else:
                        course["schedule"] = None

                    courses.append(course)

            except Exception as e:
                logger.warning(f"Error processing row: {e}")
                continue

        # Create JSON structure
        data = {
            "fields": [{"id": f.replace(" ", "_").lower(), "name": f} for f in sorted(fields)],
            "semesters": [{"id": s, "name": f"ترم {s}"} for s in sorted(semesters)],
            "courses": courses
        }

        logger.info(f"Successfully processed {len(courses)} courses")
        return data

    except Exception as e:
        logger.error(f"Error parsing Excel file: {e}")
        raise

def main():
    if len(sys.argv) != 3:
        print("Usage: python data_converter.py input.xls output.json")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    try:
        data = parse_excel_schedule(input_file)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        logger.info(f"Successfully converted schedule data to {output_file}")

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()